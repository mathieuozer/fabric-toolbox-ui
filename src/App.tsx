import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TOOLS_MANIFEST, ToolManifest, getToolsByCategory, searchTools } from './data/toolsManifest';
import { useLLM } from './hooks/useLLM';
import { useAuth } from './hooks/useAuth';
import { useExecution } from './hooks/useExecution';
import { useInfrastructureBuilder } from './hooks/useInfrastructureBuilder';
import { useSubscription } from './hooks/useSubscription';
import { ExtractedConfig, EXAMPLE_QUERIES } from './services/llmService';
import { downloadDeploymentZip } from './services/deployService';
import { addExecutionRecord } from './services/executionTrackingService';
import { InfraMessage, ScriptFormat } from './services/infrastructureService';
import { mockUpgrade, isStripeConfigured, redirectToCheckout } from './services/stripeService';

// Auth Button Component
const AuthButton = () => {
  const { isAuthenticated, isLoading, user, login, logout, config, initialize } = useAuth();
  const [showConfig, setShowConfig] = useState(false);
  const [clientId, setClientId] = useState(config?.clientId || '');
  const [tenantId, setTenantId] = useState(config?.tenantId || '');

  const handleConfigure = async () => {
    if (clientId && tenantId) {
      await initialize({ clientId, tenantId });
      setShowConfig(false);
    }
  };

  if (isAuthenticated && user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: '20px',
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            background: '#22C55E',
            borderRadius: '50%',
          }} />
          <span style={{ fontSize: '12px', color: '#22C55E' }}>{user.name}</span>
        </div>
        <button
          onClick={logout}
          disabled={isLoading}
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '6px',
            padding: '6px 12px',
            color: '#EF4444',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>
    );
  }

  if (showConfig) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: 'rgba(43,142,195,0.05)',
        border: '1px solid rgba(43,142,195,0.2)',
        borderRadius: '8px',
      }}>
        <input
          type="text"
          value={clientId}
          onChange={e => setClientId(e.target.value)}
          placeholder="Client ID"
          style={{
            padding: '4px 8px',
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(43,142,195,0.2)',
            borderRadius: '4px',
            color: '#FEFEFE',
            fontSize: '11px',
            width: '120px',
          }}
        />
        <input
          type="text"
          value={tenantId}
          onChange={e => setTenantId(e.target.value)}
          placeholder="Tenant ID"
          style={{
            padding: '4px 8px',
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(43,142,195,0.2)',
            borderRadius: '4px',
            color: '#FEFEFE',
            fontSize: '11px',
            width: '120px',
          }}
        />
        <button
          onClick={handleConfigure}
          style={{
            background: '#2B8EC3',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 10px',
            color: '#FEFEFE',
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          Connect
        </button>
        <button
          onClick={() => setShowConfig(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#79B8D9',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => config ? login() : setShowConfig(true)}
      disabled={isLoading}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        background: 'rgba(43,142,195,0.1)',
        border: '1px solid rgba(43,142,195,0.3)',
        borderRadius: '6px',
        color: '#79B8D9',
        fontSize: '12px',
        cursor: 'pointer',
      }}
    >
      <span>🔐</span>
      <span>{isLoading ? 'Connecting...' : 'Sign In'}</span>
    </button>
  );
};

// Execution Panel Component (shown after Deploy)
const ExecutionPanel = ({
  tool,
  configValues,
  onExecuted,
}: {
  tool: ToolManifest;
  configValues: Record<string, string>;
  onExecuted?: (success: boolean) => void;
}) => {
  const [copied, setCopied] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const { prepareExecution, copyCommand, terminalInstructions, markAsExecuted } = useExecution();

  useEffect(() => {
    prepareExecution(tool, configValues);
  }, [tool, configValues]);

  const handleCopy = async () => {
    const success = await copyCommand();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleMarkExecuted = (success: boolean) => {
    markAsExecuted(success);
    onExecuted?.(success);
  };

  // Get platform-specific command
  const platform = navigator.platform.toLowerCase().includes('mac') ? 'mac' :
                   navigator.platform.toLowerCase().includes('win') ? 'windows' : 'linux';

  return (
    <div style={{
      marginTop: '20px',
      padding: '20px',
      background: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(16,185,129,0.1) 100%)',
      border: '1px solid rgba(34,197,94,0.3)',
      borderRadius: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          background: '#22C55E',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
        }}>
          ▶️
        </div>
        <div>
          <h3 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '15px',
            fontWeight: 600,
            color: '#FEFEFE',
            margin: 0,
          }}>
            Execute Now
          </h3>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: '2px 0 0' }}>
            Copy command and run in your terminal
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <button
          onClick={handleCopy}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px',
            background: '#22C55E',
            border: 'none',
            borderRadius: '8px',
            color: '#FEFEFE',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {copied ? '✓ Copied!' : '📋 Copy Command'}
        </button>
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          style={{
            padding: '12px 16px',
            background: 'rgba(34,197,94,0.2)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: '8px',
            color: '#22C55E',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          {showInstructions ? 'Hide' : 'How to Run'}
        </button>
      </div>

      {showInstructions && (
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
        }}>
          <h4 style={{ color: '#22C55E', fontSize: '13px', marginBottom: '12px' }}>
            {platform === 'mac' ? '🍎 macOS' : platform === 'windows' ? '🪟 Windows' : '🐧 Linux'} Instructions:
          </h4>
          <ol style={{ margin: 0, paddingLeft: '20px', color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
            <li style={{ marginBottom: '8px' }}>
              Open {platform === 'mac' ? 'Terminal (Cmd + Space, type "Terminal")' :
                     platform === 'windows' ? 'PowerShell (Win + X)' : 'Terminal (Ctrl + Alt + T)'}
            </li>
            <li style={{ marginBottom: '8px' }}>Navigate to your project directory</li>
            <li style={{ marginBottom: '8px' }}>Click "Copy Command" above</li>
            <li>Paste (Ctrl/Cmd + V) and press Enter</li>
          </ol>
        </div>
      )}

      <div style={{
        display: 'flex',
        gap: '8px',
        paddingTop: '12px',
        borderTop: '1px solid rgba(34,197,94,0.2)',
      }}>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>After running:</span>
        <button
          onClick={() => handleMarkExecuted(true)}
          style={{
            background: 'rgba(34,197,94,0.2)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: '4px',
            padding: '4px 10px',
            color: '#22C55E',
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          ✓ Completed
        </button>
        <button
          onClick={() => handleMarkExecuted(false)}
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '4px',
            padding: '4px 10px',
            color: '#EF4444',
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          ✗ Failed
        </button>
      </div>
    </div>
  );
};

const CATEGORIES = [
  { id: 'monitoring', label: 'Monitoring', icon: '◉' },
  { id: 'accelerators', label: 'Accelerators', icon: '⚡' },
  { id: 'samples', label: 'Samples', icon: '◫' },
  { id: 'scripts', label: 'Scripts', icon: '>' },
  { id: 'tools', label: 'Tools', icon: '⚙' },
];

const TYPE_ICONS: Record<string, string> = {
  python: '🐍',
  powershell: '⚡',
  notebook: '📓',
  sql: '🗃️',
  powerbi: '📊',
  typescript: '📘',
  cli: '💻',
};

// Tag component
const Tag = ({ label }: { label: string }) => {
  const isNew = label === 'NEW';
  const isUpdated = label === 'UPDATED';

  return (
    <span style={{
      fontSize: '10px',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontWeight: 600,
      letterSpacing: '0.5px',
      padding: '3px 8px',
      borderRadius: '4px',
      border: '1px solid',
      borderColor: isNew ? '#2B8EC3' : isUpdated ? '#79B8D9' : 'rgba(121,184,217,0.3)',
      color: isNew ? '#2B8EC3' : isUpdated ? '#79B8D9' : 'rgba(170,209,231,0.7)',
      background: isNew ? 'rgba(43,142,195,0.1)' : isUpdated ? 'rgba(121,184,217,0.1)' : 'transparent',
      textTransform: 'uppercase',
    }}>
      {label}
    </span>
  );
};

// Tool card component
const ToolCard = ({ tool, onClick, style }: { tool: ToolManifest; onClick: (tool: ToolManifest) => void; style?: React.CSSProperties }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => onClick(tool)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(43,142,195,0.06)' : 'transparent',
        border: '1px solid rgba(43,142,195,0.1)',
        padding: '20px 20px 20px 24px',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 150ms ease',
        borderRadius: '8px',
        ...style,
      }}
    >
      {/* Accent bar on hover */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: '12px',
        bottom: '12px',
        width: '3px',
        background: 'linear-gradient(180deg, #2B8EC3 0%, #79B8D9 100%)',
        borderRadius: '2px',
        opacity: hovered ? 1 : 0,
        transition: 'opacity 150ms',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '16px' }}>{TYPE_ICONS[tool.type] || '📦'}</span>
        <div style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '15px',
          color: '#FEFEFE',
          fontWeight: 600,
          letterSpacing: '-0.01em',
        }}>
          {tool.name}
        </div>
      </div>

      <div style={{
        fontSize: '14px',
        color: 'rgba(255,255,255,0.6)',
        lineHeight: 1.5,
        marginBottom: '12px',
        fontFamily: "'Inter', sans-serif",
      }}>
        {tool.description}
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {tool.tags.map((tag, i) => <Tag key={i} label={tag} />)}
      </div>
    </div>
  );
};

// Command palette
const CommandPalette = ({ isOpen, onClose, onSelect }: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tool: ToolManifest) => void;
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!query) return TOOLS_MANIFEST.slice(0, 8);
    return searchTools(query).slice(0, 8);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && filtered[selectedIndex]) {
        onSelect(filtered[selectedIndex]);
        onClose();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, filtered, selectedIndex, onClose, onSelect]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '120px',
        zIndex: 100,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '560px',
          maxHeight: '480px',
          background: '#101012',
          border: '1px solid rgba(43,142,195,0.2)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid rgba(43,142,195,0.1)',
          padding: '0 20px',
        }}>
          <span style={{ color: '#79B8D9', marginRight: '12px', fontSize: '16px' }}>⌘</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tools..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              padding: '18px 0',
              color: '#FEFEFE',
              fontSize: '15px',
              fontFamily: "'Inter', sans-serif",
            }}
          />
          <span style={{
            fontSize: '11px',
            color: 'rgba(121,184,217,0.6)',
            padding: '4px 8px',
            border: '1px solid rgba(43,142,195,0.3)',
            borderRadius: '4px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 500,
          }}>ESC</span>
        </div>

        <div style={{ maxHeight: '400px', overflow: 'auto', padding: '8px' }}>
          {filtered.map((tool, i) => (
            <div
              key={tool.id}
              onClick={() => { onSelect(tool); onClose(); }}
              style={{
                padding: '14px 16px',
                cursor: 'pointer',
                background: i === selectedIndex ? 'rgba(43,142,195,0.12)' : 'transparent',
                borderLeft: i === selectedIndex ? '3px solid #2B8EC3' : '3px solid transparent',
                borderRadius: '6px',
                marginBottom: '4px',
                transition: 'all 100ms',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span>{TYPE_ICONS[tool.type] || '📦'}</span>
                <span style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#FEFEFE',
                }}>
                  {tool.name}
                </span>
              </div>
              <div style={{
                fontSize: '13px',
                color: 'rgba(255,255,255,0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: "'Inter', sans-serif",
              }}>
                <span style={{
                  color: '#79B8D9',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 600,
                }}>
                  {tool.category}
                </span>
                <span style={{ color: 'rgba(121,184,217,0.4)' }}>·</span>
                <span>{tool.description}</span>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{
              padding: '40px 16px',
              textAlign: 'center',
              color: 'rgba(255,255,255,0.3)',
              fontSize: '13px',
            }}>
              No tools found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Configuration Panel - Run/Configure tools
const ConfigPanel = ({
  tool,
  onClose,
  prefilledConfig
}: {
  tool: ToolManifest | null;
  onClose: () => void;
  prefilledConfig?: ExtractedConfig;
}) => {
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'config' | 'run' | 'deploy'>('config');
  const [copied, setCopied] = useState<string | null>(null);
  const [showPrefilledBanner, setShowPrefilledBanner] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [gitRepoUrl, setGitRepoUrl] = useState('');
  const [gitBranch, setGitBranch] = useState('main');

  useEffect(() => {
    if (tool) {
      const defaults: Record<string, string> = {};
      // First apply defaults
      tool.config.forEach(c => {
        if (c.default) defaults[c.name] = c.default;
      });
      // Then overlay with prefilled values from AI
      if (prefilledConfig) {
        Object.assign(defaults, prefilledConfig);
        setShowPrefilledBanner(true);
      } else {
        setShowPrefilledBanner(false);
      }
      setConfigValues(defaults);
      setActiveTab('config');
    }
  }, [tool, prefilledConfig]);

  if (!tool) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 50,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '600px',
          height: '100%',
          background: '#0a0a0b',
          borderLeft: '1px solid rgba(43,142,195,0.2)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 150ms ease-out',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid rgba(43,142,195,0.1)',
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(43,142,195,0.1)',
              border: '1px solid rgba(43,142,195,0.2)',
              borderRadius: '8px',
              color: '#79B8D9',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '8px 12px',
            }}
          >
            ✕
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '24px' }}>{TYPE_ICONS[tool.type] || '📦'}</span>
            <div>
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '11px',
                fontWeight: 600,
                color: '#79B8D9',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '4px',
              }}>
                {tool.category} · {tool.type}
              </div>
              <h2 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '22px',
                color: '#FEFEFE',
                fontWeight: 700,
                margin: 0,
              }}>
                {tool.name}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {tool.tags.map((tag, i) => <Tag key={i} label={tag} />)}
          </div>

          <p style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '14px',
            lineHeight: 1.6,
            margin: 0,
          }}>
            {tool.description}
          </p>
        </div>

        {/* AI Prefilled Banner */}
        {showPrefilledBanner && (
          <div style={{
            margin: '0 24px',
            padding: '12px 16px',
            background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(99,102,241,0.15) 100%)',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{ fontSize: '16px' }}>✨</span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#A78BFA',
              }}>
                AI-detected configuration
              </div>
              <div style={{
                fontSize: '12px',
                color: 'rgba(167,139,250,0.7)',
              }}>
                Values were extracted from your query. Review and adjust as needed.
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(43,142,195,0.1)',
          padding: '0 32px',
        }}>
          {(['config', 'run', 'deploy'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 20px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #2B8EC3' : '2px solid transparent',
                color: activeTab === tab ? '#FEFEFE' : 'rgba(255,255,255,0.5)',
                fontSize: '13px',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab === 'config' ? '⚙️ Configure' : tab === 'run' ? '▶️ Run' : '🚀 Deploy'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>
          {activeTab === 'config' && (
            <div>
              {/* Prerequisites */}
              <div style={{ marginBottom: '28px' }}>
                <h3 style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#79B8D9',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '12px',
                }}>
                  Prerequisites
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tool.prerequisites.map((p, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(43,142,195,0.05)',
                        border: '1px solid rgba(43,142,195,0.1)',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ color: '#FEFEFE', fontSize: '13px' }}>{p.name}</span>
                      {p.installCmd && (
                        <button
                          onClick={() => copyToClipboard(p.installCmd!, p.name)}
                          style={{
                            background: 'rgba(43,142,195,0.15)',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 10px',
                            color: '#79B8D9',
                            fontSize: '11px',
                            cursor: 'pointer',
                            fontFamily: 'monospace',
                          }}
                        >
                          {copied === p.name ? '✓ Copied' : p.installCmd}
                        </button>
                      )}
                      {p.url && !p.installCmd && (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#79B8D9',
                            fontSize: '12px',
                            textDecoration: 'none',
                          }}
                        >
                          Learn more →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Configuration Form */}
              <div>
                <h3 style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#79B8D9',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '12px',
                }}>
                  Configuration
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {tool.config.map((c, i) => (
                    <div key={i}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '6px',
                        fontSize: '13px',
                        color: '#FEFEFE',
                        fontFamily: "'Inter', sans-serif",
                      }}>
                        {c.name}
                        {c.required && <span style={{ color: '#2B8EC3' }}>*</span>}
                      </label>
                      <p style={{
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.5)',
                        marginBottom: '8px',
                      }}>
                        {c.description}
                      </p>
                      {c.options ? (
                        <select
                          value={configValues[c.name] || ''}
                          onChange={e => setConfigValues({ ...configValues, [c.name]: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: 'rgba(43,142,195,0.05)',
                            border: '1px solid rgba(43,142,195,0.2)',
                            borderRadius: '6px',
                            color: '#FEFEFE',
                            fontSize: '13px',
                            outline: 'none',
                          }}
                        >
                          <option value="">Select...</option>
                          {c.options.map(o => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={c.type === 'number' ? 'number' : 'text'}
                          value={configValues[c.name] || ''}
                          onChange={e => setConfigValues({ ...configValues, [c.name]: e.target.value })}
                          placeholder={c.default || `Enter ${c.name}...`}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: 'rgba(43,142,195,0.05)',
                            border: '1px solid rgba(43,142,195,0.2)',
                            borderRadius: '6px',
                            color: '#FEFEFE',
                            fontSize: '13px',
                            outline: 'none',
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'run' && (
            <div>
              <h3 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '13px',
                fontWeight: 600,
                color: '#79B8D9',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '16px',
              }}>
                Run Instructions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tool.runInstructions.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '16px',
                      background: 'rgba(43,142,195,0.05)',
                      border: '1px solid rgba(43,142,195,0.1)',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                    }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        background: '#2B8EC3',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#FEFEFE',
                        flexShrink: 0,
                      }}>
                        {r.step}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{
                          color: '#FEFEFE',
                          fontSize: '14px',
                          margin: 0,
                          marginBottom: r.command ? '8px' : 0,
                        }}>
                          {r.description}
                          {r.isOptional && (
                            <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: '8px' }}>
                              (optional)
                            </span>
                          )}
                        </p>
                        {r.command && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(0,0,0,0.3)',
                            padding: '8px 12px',
                            borderRadius: '4px',
                          }}>
                            <code style={{
                              flex: 1,
                              fontFamily: 'monospace',
                              fontSize: '12px',
                              color: '#AAD1E7',
                            }}>
                              {r.command}
                            </code>
                            <button
                              onClick={() => copyToClipboard(r.command!, `step-${r.step}`)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#79B8D9',
                                cursor: 'pointer',
                                padding: '4px',
                              }}
                            >
                              {copied === `step-${r.step}` ? '✓' : '📋'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {tool.output && (
                <div style={{ marginTop: '24px' }}>
                  <h4 style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.5)',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                  }}>
                    Expected Output
                  </h4>
                  <p style={{
                    color: '#79B8D9',
                    fontSize: '14px',
                    padding: '12px 16px',
                    background: 'rgba(43,142,195,0.08)',
                    borderRadius: '6px',
                    borderLeft: '3px solid #2B8EC3',
                  }}>
                    {tool.output}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'deploy' && (
            <div>
              {/* Download ZIP Package */}
              <div
                style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, rgba(43,142,195,0.1) 0%, rgba(121,184,217,0.1) 100%)',
                  border: '1px solid rgba(43,142,195,0.3)',
                  borderRadius: '12px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: '#2B8EC3',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}>
                    📦
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#FEFEFE',
                      margin: 0,
                    }}>
                      Download Deployment Package
                    </h3>
                    <p style={{
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: '13px',
                      margin: '4px 0 0',
                    }}>
                      ZIP file with .env, run.sh, run.bat, and README.md
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      setIsDeploying(true);
                      try {
                        await downloadDeploymentZip(tool, configValues);
                      } finally {
                        setIsDeploying(false);
                      }
                    }}
                    disabled={isDeploying}
                    style={{
                      background: '#2B8EC3',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 24px',
                      color: '#FEFEFE',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: isDeploying ? 'wait' : 'pointer',
                      opacity: isDeploying ? 0.7 : 1,
                    }}
                  >
                    {isDeploying ? 'Generating...' : 'Download ZIP'}
                  </button>
                </div>
              </div>

              {/* Git Push Section */}
              <div
                style={{
                  padding: '20px',
                  background: 'rgba(43,142,195,0.05)',
                  border: '1px solid rgba(43,142,195,0.1)',
                  borderRadius: '12px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '20px' }}>🔗</span>
                  <h3 style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#FEFEFE',
                    margin: 0,
                  }}>
                    Push to Git Repository
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.6)',
                      marginBottom: '6px',
                    }}>
                      Repository URL
                    </label>
                    <input
                      type="text"
                      value={gitRepoUrl}
                      onChange={e => setGitRepoUrl(e.target.value)}
                      placeholder="https://github.com/user/repo.git"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(43,142,195,0.2)',
                        borderRadius: '6px',
                        color: '#FEFEFE',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.6)',
                      marginBottom: '6px',
                    }}>
                      Branch
                    </label>
                    <input
                      type="text"
                      value={gitBranch}
                      onChange={e => setGitBranch(e.target.value)}
                      placeholder="main"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(43,142,195,0.2)',
                        borderRadius: '6px',
                        color: '#FEFEFE',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <p style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.4)',
                    margin: '4px 0 0',
                  }}>
                    Download includes a git-push.sh script to push configs to your repo
                  </p>
                </div>
              </div>

              {/* Package Contents Preview */}
              <h3 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '13px',
                fontWeight: 600,
                color: '#79B8D9',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '12px',
              }}>
                Package Contents
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { icon: '📄', name: '.env', desc: 'Environment variables' },
                  { icon: '🐧', name: 'run.sh', desc: 'Linux/macOS script' },
                  { icon: '🪟', name: 'run.bat', desc: 'Windows script' },
                  { icon: '📖', name: 'README.md', desc: 'Instructions' },
                  ...(gitRepoUrl ? [{ icon: '🔗', name: 'git-push.sh', desc: 'Git push script' }] : []),
                ].map((file, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: '6px',
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{file.icon}</span>
                    <code style={{ color: '#AAD1E7', fontSize: '13px', flex: 1 }}>{file.name}</code>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{file.desc}</span>
                  </div>
                ))}
              </div>

              {/* Tool Source Path */}
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(43,142,195,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Tool source files: </span>
                    <code style={{ color: '#AAD1E7', fontSize: '12px' }}>{tool.path}</code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(tool.path, 'path')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#79B8D9',
                      fontSize: '12px',
                      cursor: 'pointer',
                      padding: '4px 8px',
                    }}
                  >
                    {copied === 'path' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Execution Panel */}
              <ExecutionPanel
                tool={tool}
                configValues={configValues}
                onExecuted={(success) => {
                  // Could show a toast or notification here
                  console.log(`Execution ${success ? 'completed' : 'failed'}`);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple markdown renderer for AI responses
const MarkdownText = ({ text }: { text: string }) => {
  const renderLine = (line: string, idx: number) => {
    // Bold text: **text**
    let parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} style={{ color: '#FEFEFE', fontWeight: 600 }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      // Italic: *text*
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return (
          <em key={i} style={{ color: '#AAD1E7' }}>
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });

    // Check for numbered lists
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      return (
        <div key={idx} style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '8px',
          paddingLeft: '4px',
        }}>
          <span style={{
            color: '#2B8EC3',
            fontWeight: 600,
            minWidth: '20px',
          }}>
            {numberedMatch[1]}.
          </span>
          <span style={{ flex: 1 }}>{renderLine(numberedMatch[2], 0)}</span>
        </div>
      );
    }

    // Check for bullet points
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return (
        <div key={idx} style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '6px',
          paddingLeft: '4px',
        }}>
          <span style={{ color: '#79B8D9' }}>•</span>
          <span style={{ flex: 1 }}>{renderLine(line.slice(2), 0)}</span>
        </div>
      );
    }

    // Headers
    if (line.startsWith('## ')) {
      return (
        <div key={idx} style={{
          fontWeight: 600,
          color: '#FEFEFE',
          fontSize: '15px',
          marginTop: '12px',
          marginBottom: '8px',
        }}>
          {line.slice(3)}
        </div>
      );
    }

    if (line.startsWith('# ')) {
      return (
        <div key={idx} style={{
          fontWeight: 700,
          color: '#FEFEFE',
          fontSize: '16px',
          marginTop: '12px',
          marginBottom: '8px',
        }}>
          {line.slice(2)}
        </div>
      );
    }

    // Empty lines become spacing
    if (line.trim() === '') {
      return <div key={idx} style={{ height: '8px' }} />;
    }

    return <span key={idx}>{rendered}</span>;
  };

  const lines = text.split('\n');

  return (
    <div style={{ lineHeight: 1.6 }}>
      {lines.map((line, idx) => {
        const rendered = renderLine(line, idx);
        // If it's not already wrapped in a div (lists, headers), wrap it
        if (typeof rendered === 'object' && rendered.type === 'div') {
          return rendered;
        }
        return (
          <React.Fragment key={idx}>
            {rendered}
            {idx < lines.length - 1 && line.trim() !== '' && <br />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Infrastructure Builder Panel
const InfrastructureBuilderPanel = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const {
    messages,
    conversationState,
    isProcessing,
    error,
    templates,
    costEstimate,
    sendMessage: sendMessageRaw,
    reset,
    regenerateScript: regenerateScriptRaw,
    downloadScript,
    selectTemplate: selectTemplateRaw,
  } = useInfrastructureBuilder();

  const {
    tier,
    isProUser,
    remainingGenerations,
    usageDisplay,
    daysUntilReset,
    canGenerate,
    isTemplateLocked,
    isFormatLocked,
    recordGeneration,
    applyWatermark,
    tierDisplayName,
    tierBadgeColor,
    pricing,
    handleUpgrade,
  } = useSubscription();

  const [input, setInput] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Wrap sendMessage to check generation limits
  const sendMessage = async (message: string) => {
    if (!canGenerate()) {
      setUpgradeReason('generation limit');
      setShowUpgradeModal(true);
      return;
    }
    recordGeneration();
    await sendMessageRaw(message);
  };

  // Wrap selectTemplate to check template access
  const selectTemplate = (templateId: string) => {
    if (isTemplateLocked(templateId)) {
      setUpgradeReason('premium template');
      setShowUpgradeModal(true);
      return;
    }
    if (!canGenerate()) {
      setUpgradeReason('generation limit');
      setShowUpgradeModal(true);
      return;
    }
    recordGeneration();
    selectTemplateRaw(templateId);
  };

  // Wrap regenerateScript to check format access
  const regenerateScript = (format: ScriptFormat) => {
    if (isFormatLocked(format)) {
      setUpgradeReason(`${format} format`);
      setShowUpgradeModal(true);
      return;
    }
    regenerateScriptRaw(format);
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    const query = input;
    setInput('');
    await sendMessage(query);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 60,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '560px',
          height: '100%',
          background: '#0a0a0b',
          borderLeft: '1px solid rgba(34,197,94,0.2)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 150ms ease-out',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(34,197,94,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}>
              🏗️
            </div>
            <div>
              <h2 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '16px',
                color: '#FEFEFE',
                fontWeight: 600,
                margin: 0,
              }}>
                Infrastructure Builder
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <p style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.5)',
                  margin: 0,
                }}>
                  AI-powered Fabric environment setup
                </p>
                <span style={{
                  padding: '2px 8px',
                  background: tierBadgeColor,
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#FEFEFE',
                }}>
                  {tierDisplayName}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Usage display for free tier */}
            {!isProUser && (
              <div style={{
                fontSize: '11px',
                color: remainingGenerations === 0 ? '#EF4444' : 'rgba(255,255,255,0.5)',
              }}>
                {usageDisplay} · Resets in {daysUntilReset}d
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={reset}
              style={{
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: '6px',
                color: '#22C55E',
                cursor: 'pointer',
                fontSize: '12px',
                padding: '6px 12px',
              }}
            >
              Start Over
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: '6px',
                color: '#22C55E',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '6px 10px',
              }}
            >
              ✕
            </button>
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px 24px',
        }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '90%',
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
                    : 'rgba(34,197,94,0.1)',
                  border: msg.role === 'user' ? 'none' : '1px solid rgba(34,197,94,0.2)',
                }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    lineHeight: 1.6,
                    color: msg.role === 'user' ? '#FEFEFE' : 'rgba(255,255,255,0.9)',
                    whiteSpace: 'pre-wrap',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.3);padding:2px 6px;border-radius:4px;font-family:monospace;">$1</code>')
                      .replace(/\n/g, '<br/>'),
                  }}
                />

                {/* Script display */}
                {msg.script && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}>
                      <span style={{
                        fontSize: '12px',
                        color: '#22C55E',
                        fontWeight: 600,
                      }}>
                        {msg.scriptFormat === 'powershell' ? 'PowerShell Script' : msg.scriptFormat === 'bicep' ? 'Bicep Template' : 'Terraform Config'}
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(msg.script || '');
                          }}
                          style={{
                            background: 'rgba(34,197,94,0.2)',
                            border: '1px solid rgba(34,197,94,0.3)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            color: '#22C55E',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          Copy
                        </button>
                        <button
                          onClick={downloadScript}
                          style={{
                            background: '#22C55E',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            color: '#FEFEFE',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          Download
                        </button>
                      </div>
                    </div>
                    <pre
                      style={{
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid rgba(34,197,94,0.2)',
                        borderRadius: '8px',
                        padding: '12px',
                        fontSize: '11px',
                        lineHeight: 1.4,
                        overflow: 'auto',
                        maxHeight: '300px',
                        color: 'rgba(255,255,255,0.8)',
                        fontFamily: 'monospace',
                      }}
                    >
                      {msg.script.slice(0, 2000)}
                      {msg.script.length > 2000 && '\n\n... (script continues - download for full version)'}
                    </pre>

                    {/* Format toggle */}
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      marginTop: '12px',
                    }}>
                      <button
                        onClick={() => regenerateScript('powershell')}
                        style={{
                          background: msg.scriptFormat === 'powershell' ? '#22C55E' : 'rgba(34,197,94,0.1)',
                          border: '1px solid rgba(34,197,94,0.3)',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          color: msg.scriptFormat === 'powershell' ? '#FEFEFE' : '#22C55E',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        PowerShell
                      </button>
                      <button
                        onClick={() => regenerateScript('bicep')}
                        style={{
                          background: isFormatLocked('bicep')
                            ? 'rgba(107,114,128,0.1)'
                            : msg.scriptFormat === 'bicep' ? '#22C55E' : 'rgba(34,197,94,0.1)',
                          border: `1px solid ${isFormatLocked('bicep') ? 'rgba(107,114,128,0.3)' : 'rgba(34,197,94,0.3)'}`,
                          borderRadius: '4px',
                          padding: '6px 12px',
                          color: isFormatLocked('bicep')
                            ? '#6B7280'
                            : msg.scriptFormat === 'bicep' ? '#FEFEFE' : '#22C55E',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Bicep {isFormatLocked('bicep') && '🔒'}
                      </button>
                      <button
                        onClick={() => regenerateScript('terraform')}
                        style={{
                          background: isFormatLocked('terraform')
                            ? 'rgba(107,114,128,0.1)'
                            : msg.scriptFormat === 'terraform' ? '#22C55E' : 'rgba(34,197,94,0.1)',
                          border: `1px solid ${isFormatLocked('terraform') ? 'rgba(107,114,128,0.3)' : 'rgba(34,197,94,0.3)'}`,
                          borderRadius: '4px',
                          padding: '6px 12px',
                          color: isFormatLocked('terraform')
                            ? '#6B7280'
                            : msg.scriptFormat === 'terraform' ? '#FEFEFE' : '#22C55E',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Terraform {isFormatLocked('terraform') && '🔒'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              color: 'rgba(34,197,94,0.7)',
              fontSize: '14px',
            }}>
              <span style={{ animation: 'pulse 1.5s infinite' }}>●</span>
              Thinking...
            </div>
          )}

          {error && (
            <div style={{
              padding: '12px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px',
              color: '#EF4444',
              fontSize: '13px',
            }}>
              {error}
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(34,197,94,0.1)',
          }}
        >
          <div style={{
            display: 'flex',
            gap: '12px',
          }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={
                conversationState.phase === 'complete'
                  ? 'Ask about the script or say "start over"...'
                  : 'Describe your infrastructure needs...'
              }
              disabled={isProcessing}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'rgba(34,197,94,0.05)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: '8px',
                color: '#FEFEFE',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={isProcessing || !input.trim()}
              style={{
                padding: '12px 20px',
                background: isProcessing || !input.trim()
                  ? 'rgba(34,197,94,0.2)'
                  : 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#FEFEFE',
                fontSize: '14px',
                cursor: isProcessing || !input.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              Send
            </button>
          </div>

          {/* Templates and Quick actions */}
          {conversationState.phase === 'greeting' && (
            <div style={{ marginTop: '16px' }}>
              {/* Template Grid */}
              <div style={{
                marginBottom: '12px',
                fontSize: '11px',
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Quick Start Templates
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                marginBottom: '16px',
              }}>
                {templates.map(template => {
                  const locked = isTemplateLocked(template.id);
                  return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => selectTemplate(template.id)}
                    style={{
                      padding: '12px',
                      background: locked ? 'rgba(107,114,128,0.1)' : 'rgba(34,197,94,0.05)',
                      border: `1px solid ${locked ? 'rgba(107,114,128,0.3)' : 'rgba(34,197,94,0.2)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 150ms',
                      position: 'relative',
                    }}
                  >
                    {locked && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        fontSize: '12px',
                      }}>
                        🔒
                      </div>
                    )}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}>
                      <span style={{ fontSize: '16px' }}>{template.icon}</span>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: locked ? '#6B7280' : '#22C55E',
                      }}>
                        {template.name}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: 'rgba(255,255,255,0.5)',
                      lineHeight: 1.3,
                    }}>
                      {template.description}
                    </div>
                    <div style={{
                      marginTop: '6px',
                      fontSize: '10px',
                      color: locked ? 'rgba(107,114,128,0.7)' : 'rgba(34,197,94,0.7)',
                    }}>
                      {template.config.capacitySize} · {template.estimatedSetupTime}
                      {locked && ' · Pro'}
                    </div>
                  </button>
                  );
                })}
              </div>

              {/* Quick suggestions */}
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
              }}>
                {[
                  'Guide me step by step',
                  'Custom setup',
                ].map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => sendMessage(suggestion)}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(34,197,94,0.1)',
                      border: '1px solid rgba(34,197,94,0.2)',
                      borderRadius: '16px',
                      color: '#22C55E',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cost Estimate Badge */}
          {costEstimate && conversationState.phase !== 'greeting' && (
            <div style={{
              marginTop: '12px',
              padding: '10px 12px',
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  Estimated Monthly Cost
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#22C55E',
                }}>
                  ~${costEstimate.monthlyTotal.toLocaleString()}
                </div>
              </div>
              <div style={{
                textAlign: 'right',
                fontSize: '10px',
                color: 'rgba(255,255,255,0.5)',
              }}>
                <div>Capacity: ${costEstimate.breakdown.capacity.toLocaleString()}</div>
                <div>Storage: ${costEstimate.breakdown.storage.toLocaleString()}</div>
                <div>Compute: ${costEstimate.breakdown.compute.toLocaleString()}</div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001,
        }}>
          <div style={{
            background: '#1E1E1E',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '400px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚀</div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#FEFEFE',
              margin: '0 0 8px 0',
            }}>
              Upgrade to Pro
            </h3>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.6)',
              margin: '0 0 24px 0',
              lineHeight: 1.5,
            }}>
              {upgradeReason === 'generation limit'
                ? "You've reached your free tier limit of 3 generations per month."
                : upgradeReason === 'premium template'
                ? 'This template is only available with Pro.'
                : `${upgradeReason.charAt(0).toUpperCase() + upgradeReason.slice(1)} is only available with Pro.`}
            </p>

            <div style={{
              background: 'rgba(139,92,246,0.1)',
              border: '1px solid rgba(139,92,246,0.3)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
            }}>
              <div style={{
                fontSize: '32px',
                fontWeight: 700,
                color: '#8B5CF6',
                marginBottom: '4px',
              }}>
                ${pricing.pro.monthly}/mo
              </div>
              <div style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.5)',
              }}>
                Cancel anytime
              </div>

              <div style={{
                marginTop: '16px',
                textAlign: 'left',
                fontSize: '13px',
                color: 'rgba(255,255,255,0.7)',
              }}>
                <div style={{ marginBottom: '8px' }}>✓ All 6+ templates</div>
                <div style={{ marginBottom: '8px' }}>✓ PowerShell, Bicep & Terraform</div>
                <div style={{ marginBottom: '8px' }}>✓ Unlimited generations</div>
                <div style={{ marginBottom: '8px' }}>✓ Save & export configs</div>
                <div style={{ marginBottom: '8px' }}>✓ No watermarks</div>
                <div>✓ Databricks & Snowflake (coming)</div>
              </div>
            </div>

            <button
              onClick={() => {
                if (isStripeConfigured()) {
                  // Production: redirect to Stripe checkout
                  redirectToCheckout().catch(console.error);
                } else {
                  // Development: use mock upgrade
                  const stripeData = mockUpgrade();
                  handleUpgrade(stripeData);
                  setShowUpgradeModal(false);
                }
              }}
              style={{
                width: '100%',
                padding: '14px 24px',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#FEFEFE',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '12px',
              }}
            >
              {isStripeConfigured() ? 'Upgrade Now' : 'Upgrade Now (Dev Mode)'}
            </button>
            <button
              onClick={() => setShowUpgradeModal(false)}
              style={{
                width: '100%',
                padding: '12px 24px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// AI Chat Panel
const AIChatPanel = ({
  isOpen,
  onClose,
  onToolSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  onToolSelect: (tool: ToolManifest, extractedConfig?: ExtractedConfig) => void;
}) => {
  const { history, isLoading, error, sendMessage, clearHistory, getExtractedConfig } = useLLM();
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const query = input;
    setInput('');
    await sendMessage(query);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 60,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '480px',
          height: '100%',
          background: '#0a0a0b',
          borderLeft: '1px solid rgba(43,142,195,0.2)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 150ms ease-out',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(43,142,195,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}>
              ✨
            </div>
            <div>
              <h2 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '16px',
                color: '#FEFEFE',
                fontWeight: 600,
                margin: 0,
              }}>
                AI Tool Finder
              </h2>
              <p style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.5)',
                margin: 0,
              }}>
                Describe what you need in natural language
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={clearHistory}
              style={{
                background: 'rgba(43,142,195,0.1)',
                border: '1px solid rgba(43,142,195,0.2)',
                borderRadius: '6px',
                color: '#79B8D9',
                cursor: 'pointer',
                fontSize: '12px',
                padding: '6px 12px',
              }}
            >
              Clear
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(43,142,195,0.1)',
                border: '1px solid rgba(43,142,195,0.2)',
                borderRadius: '6px',
                color: '#79B8D9',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '6px 10px',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Chat area */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px 24px',
        }}>
          {history.length === 0 && (
            <div style={{ padding: '20px 0' }}>
              {/* Quick suggestions */}
              <div style={{
                textAlign: 'center',
                marginBottom: '24px',
              }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>✨</div>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
                  Describe what you need - I'll find the right tool
                </p>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  justifyContent: 'center',
                }}>
                  {[
                    'Migrate from ADF',
                    'Monitor costs',
                    'DAX performance',
                    'Set up CI/CD',
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(suggestion);
                        sendMessage(suggestion);
                      }}
                      style={{
                        background: 'rgba(43,142,195,0.08)',
                        border: '1px solid rgba(43,142,195,0.2)',
                        borderRadius: '20px',
                        padding: '6px 14px',
                        color: '#79B8D9',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Config extraction tips */}
              <div style={{
                background: 'rgba(139,92,246,0.08)',
                border: '1px solid rgba(139,92,246,0.2)',
                borderRadius: '12px',
                padding: '16px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                }}>
                  <span style={{ fontSize: '14px' }}>💡</span>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#A78BFA',
                  }}>
                    Pro Tip: Include IDs for auto-config
                  </span>
                </div>
                <p style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: '12px',
                  lineHeight: 1.5,
                }}>
                  Include workspace IDs, resource groups, or server names in your query
                  and I'll pre-fill the configuration for you.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {EXAMPLE_QUERIES.slice(0, 2).map((ex, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setInput(ex.query);
                        sendMessage(ex.query);
                      }}
                      style={{
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        cursor: 'pointer',
                      }}
                    >
                      <code style={{
                        fontSize: '11px',
                        color: '#AAD1E7',
                        display: 'block',
                        marginBottom: '6px',
                      }}>
                        "{ex.query}"
                      </code>
                      <div style={{
                        display: 'flex',
                        gap: '6px',
                        flexWrap: 'wrap',
                      }}>
                        {ex.extracts.map((e, j) => (
                          <span
                            key={j}
                            style={{
                              fontSize: '10px',
                              background: 'rgba(139,92,246,0.2)',
                              color: '#A78BFA',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {e}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {history.map((entry) => (
            <div key={entry.id} style={{ marginBottom: '24px' }}>
              {/* User query */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: '12px',
              }}>
                <div style={{
                  background: '#2B8EC3',
                  borderRadius: '12px 12px 4px 12px',
                  padding: '10px 14px',
                  maxWidth: '80%',
                  color: '#FEFEFE',
                  fontSize: '14px',
                }}>
                  {entry.query}
                </div>
              </div>

              {/* Assistant response */}
              <div style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  flexShrink: 0,
                }}>
                  ✨
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    background: 'rgba(43,142,195,0.08)',
                    borderRadius: '4px 12px 12px 12px',
                    padding: '12px 14px',
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: '14px',
                  }}>
                    <MarkdownText text={entry.response} />
                  </div>

                  {/* Tool recommendations */}
                  {entry.recommendations.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      {entry.recommendations.slice(0, 3).map((rec) => (
                        <div
                          key={rec.tool.id}
                          onClick={() => {
                            const extracted = entry.extractedConfigs.get(rec.tool.id);
                            onToolSelect(rec.tool, extracted);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            background: 'rgba(43,142,195,0.05)',
                            border: '1px solid rgba(43,142,195,0.15)',
                            borderRadius: '8px',
                            marginBottom: '8px',
                            cursor: 'pointer',
                            transition: 'all 150ms',
                          }}
                        >
                          <span style={{ fontSize: '16px' }}>
                            {TYPE_ICONS[rec.tool.type] || '📦'}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                              fontSize: '13px',
                              fontWeight: 600,
                              color: '#FEFEFE',
                            }}>
                              {rec.tool.name}
                            </div>
                            <div style={{
                              fontSize: '11px',
                              color: 'rgba(255,255,255,0.5)',
                            }}>
                              {rec.tool.category}
                            </div>
                          </div>
                          <span style={{
                            color: '#79B8D9',
                            fontSize: '12px',
                          }}>
                            →
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              padding: '12px',
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
              }}>
                ✨
              </div>
              <div style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: '14px',
              }}>
                Thinking...
              </div>
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px',
              padding: '12px',
              color: '#EF4444',
              fontSize: '13px',
              marginTop: '12px',
            }}>
              {error}
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <form onSubmit={handleSubmit} style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(43,142,195,0.1)',
        }}>
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="What do you want to accomplish?"
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'rgba(43,142,195,0.06)',
                border: '1px solid rgba(43,142,195,0.2)',
                borderRadius: '10px',
                color: '#FEFEFE',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                background: '#2B8EC3',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 20px',
                color: '#FEFEFE',
                fontSize: '14px',
                fontWeight: 600,
                cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: isLoading || !input.trim() ? 0.5 : 1,
              }}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main app
export default function App() {
  const [activeCategory, setActiveCategory] = useState('monitoring');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolManifest | null>(null);
  const [prefilledConfig, setPrefilledConfig] = useState<ExtractedConfig | undefined>(undefined);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [infraBuilderOpen, setInfraBuilderOpen] = useState(false);

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const tools = getToolsByCategory(activeCategory);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0b',
      color: '#FEFEFE',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(43,142,195,0.2); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(43,142,195,0.35); }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        select option {
          background: #101012;
          color: #FEFEFE;
        }
      `}</style>

      {/* Sidebar */}
      <aside style={{
        width: sidebarExpanded ? '220px' : '64px',
        borderRight: '1px solid rgba(43,142,195,0.12)',
        padding: '24px 0',
        transition: 'width 150ms',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(43,142,195,0.02)',
      }}>
        {/* Logo area */}
        <div
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          style={{
            padding: '0 20px 28px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, #2B8EC3 0%, #79B8D9 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '16px',
            fontWeight: 700,
            color: '#FEFEFE',
          }}>
            F
          </div>
          {sidebarExpanded && (
            <span style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '15px',
              fontWeight: 600,
              color: '#FEFEFE',
              letterSpacing: '-0.01em',
            }}>
              Fabric Toolbox
            </span>
          )}
        </div>

        {/* Categories */}
        <nav style={{ flex: 1, padding: '0 12px' }}>
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id;
            const count = getToolsByCategory(cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 12px',
                  background: isActive ? 'rgba(43,142,195,0.12)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  position: 'relative',
                  color: isActive ? '#FEFEFE' : 'rgba(255,255,255,0.5)',
                  transition: 'all 150ms',
                  textAlign: 'left',
                  marginBottom: '4px',
                }}
              >
                {/* Active indicator */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '3px',
                  height: '24px',
                  background: 'linear-gradient(180deg, #2B8EC3 0%, #79B8D9 100%)',
                  borderRadius: '2px',
                  opacity: isActive ? 1 : 0,
                  transition: 'opacity 150ms',
                }} />

                <span style={{
                  fontSize: '16px',
                  width: '24px',
                  textAlign: 'center',
                  opacity: isActive ? 1 : 0.7,
                }}>
                  {cat.icon}
                </span>

                {sidebarExpanded && (
                  <>
                    <span style={{
                      flex: 1,
                      fontSize: '14px',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: isActive ? 500 : 400,
                    }}>
                      {cat.label}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      color: '#79B8D9',
                      background: 'rgba(43,142,195,0.15)',
                      padding: '2px 6px',
                      borderRadius: '10px',
                    }}>
                      {count}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Stats */}
        {sidebarExpanded && (
          <div style={{
            padding: '20px',
            margin: '0 12px',
            borderTop: '1px solid rgba(43,142,195,0.1)',
          }}>
            <div style={{
              fontSize: '11px',
              color: 'rgba(121,184,217,0.6)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px',
            }}>
              Total tools
            </div>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '28px',
              color: '#79B8D9',
              fontWeight: 700,
            }}>
              {TOOLS_MANIFEST.length}
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {/* Header */}
        <header style={{
          padding: '20px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(43,142,195,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '13px',
              color: 'rgba(121,184,217,0.5)',
              fontFamily: "'Inter', sans-serif",
            }}>
              fabric-toolbox
            </span>
            <span style={{ color: 'rgba(43,142,195,0.3)' }}>/</span>
            <span style={{
              fontSize: '13px',
              color: '#79B8D9',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
            }}>
              {activeCategory}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {/* Infrastructure Builder button */}
            <button
              onClick={() => setInfraBuilderOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.15) 100%)',
                border: '1px solid rgba(34,197,94,0.3)',
                cursor: 'pointer',
                color: '#22C55E',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
                borderRadius: '8px',
                transition: 'all 150ms',
              }}
            >
              <span>🏗️</span>
              <span>Build Infra</span>
            </button>

            {/* AI Chat button */}
            <button
              onClick={() => setAiChatOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(99,102,241,0.15) 100%)',
                border: '1px solid rgba(139,92,246,0.3)',
                cursor: 'pointer',
                color: '#A78BFA',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
                borderRadius: '8px',
                transition: 'all 150ms',
              }}
            >
              <span>✨</span>
              <span>Ask AI</span>
            </button>

            {/* Search trigger */}
            <button
              onClick={() => setPaletteOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 16px',
                background: 'rgba(43,142,195,0.06)',
                border: '1px solid rgba(43,142,195,0.15)',
                cursor: 'pointer',
                color: 'rgba(170,209,231,0.7)',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
                borderRadius: '8px',
                minWidth: '240px',
                transition: 'all 150ms',
              }}
            >
              <span>Search tools...</span>
              <span style={{
                marginLeft: 'auto',
                fontSize: '11px',
                padding: '3px 8px',
                border: '1px solid rgba(43,142,195,0.3)',
                borderRadius: '4px',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 600,
                color: 'rgba(121,184,217,0.6)',
              }}>⌘K</span>
            </button>

            {/* Auth button */}
            <AuthButton />
          </div>
        </header>

        {/* Category header */}
        <div style={{ padding: '40px 40px 32px' }}>
          <h1 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '32px',
            fontWeight: 700,
            color: '#FEFEFE',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            letterSpacing: '-0.02em',
          }}>
            {CATEGORIES.find(c => c.id === activeCategory)?.label}
            <span style={{
              fontSize: '16px',
              color: '#79B8D9',
              fontWeight: 500,
              background: 'rgba(43,142,195,0.1)',
              padding: '4px 12px',
              borderRadius: '20px',
            }}>
              {tools.length}
            </span>
          </h1>
        </div>

        {/* Tools grid */}
        <div style={{
          padding: '0 40px 60px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '16px',
        }}>
          {tools.map(tool => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onClick={() => {
                setSelectedTool(tool);
                setPrefilledConfig(undefined); // Clear any AI-prefilled config
              }}
              style={{ background: 'rgba(43,142,195,0.02)' }}
            />
          ))}
        </div>
      </main>

      {/* Command palette */}
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelect={(tool) => setSelectedTool(tool)}
      />

      {/* Configuration panel */}
      <ConfigPanel
        tool={selectedTool}
        onClose={() => {
          setSelectedTool(null);
          setPrefilledConfig(undefined);
        }}
        prefilledConfig={prefilledConfig}
      />

      {/* AI Chat panel */}
      <AIChatPanel
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        onToolSelect={(tool, extractedConfig) => {
          setAiChatOpen(false);
          setSelectedTool(tool);
          setPrefilledConfig(extractedConfig);
        }}
      />

      {/* Infrastructure Builder panel */}
      <InfrastructureBuilderPanel
        isOpen={infraBuilderOpen}
        onClose={() => setInfraBuilderOpen(false)}
      />
    </div>
  );
}
