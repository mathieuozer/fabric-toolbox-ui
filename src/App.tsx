import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TOOLS_MANIFEST, ToolManifest, getToolsByCategory, searchTools } from './data/toolsManifest';

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
const ConfigPanel = ({ tool, onClose }: { tool: ToolManifest | null; onClose: () => void }) => {
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'config' | 'run' | 'download'>('config');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (tool) {
      const defaults: Record<string, string> = {};
      tool.config.forEach(c => {
        if (c.default) defaults[c.name] = c.default;
      });
      setConfigValues(defaults);
      setActiveTab('config');
    }
  }, [tool]);

  if (!tool) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const generateEnvFile = () => {
    return tool.config.map(c =>
      `${c.name.toUpperCase()}=${configValues[c.name] || ''}`
    ).join('\n');
  };

  const generateRunScript = () => {
    const lines = ['#!/bin/bash', '', '# Generated by Fabric Toolbox UI', ''];

    // Add prerequisite checks
    tool.prerequisites.forEach(p => {
      if (p.checkCmd) {
        lines.push(`# Check ${p.name}`);
        lines.push(`${p.checkCmd} || echo "Warning: ${p.name} not found"`);
      }
    });

    lines.push('');

    // Add run instructions
    tool.runInstructions.forEach(r => {
      lines.push(`# Step ${r.step}: ${r.description}`);
      if (r.command) {
        let cmd = r.command;
        // Replace config placeholders
        tool.config.forEach(c => {
          cmd = cmd.replace(`$${c.name}`, configValues[c.name] || `\${${c.name.toUpperCase()}}`);
        });
        lines.push(cmd);
      }
      lines.push('');
    });

    return lines.join('\n');
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(43,142,195,0.1)',
          padding: '0 32px',
        }}>
          {(['config', 'run', 'download'] as const).map(tab => (
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
              {tab === 'config' ? '⚙️ Configure' : tab === 'run' ? '▶️ Run' : '📥 Download'}
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

          {activeTab === 'download' && (
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
                Download Files
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Environment File */}
                <div
                  style={{
                    padding: '16px',
                    background: 'rgba(43,142,195,0.05)',
                    border: '1px solid rgba(43,142,195,0.1)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ color: '#FEFEFE', fontSize: '14px', margin: 0 }}>
                        📄 Environment File (.env)
                      </h4>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '4px 0 0' }}>
                        Configuration values as environment variables
                      </p>
                    </div>
                    <button
                      onClick={() => downloadFile(generateEnvFile(), '.env')}
                      style={{
                        background: '#2B8EC3',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        color: '#FEFEFE',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Download
                    </button>
                  </div>
                  <pre style={{
                    background: 'rgba(0,0,0,0.3)',
                    padding: '12px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: '#AAD1E7',
                    overflow: 'auto',
                    margin: 0,
                  }}>
                    {generateEnvFile()}
                  </pre>
                </div>

                {/* Run Script */}
                <div
                  style={{
                    padding: '16px',
                    background: 'rgba(43,142,195,0.05)',
                    border: '1px solid rgba(43,142,195,0.1)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ color: '#FEFEFE', fontSize: '14px', margin: 0 }}>
                        🚀 Run Script (run.sh)
                      </h4>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '4px 0 0' }}>
                        Shell script with all commands
                      </p>
                    </div>
                    <button
                      onClick={() => downloadFile(generateRunScript(), `run-${tool.id}.sh`)}
                      style={{
                        background: '#2B8EC3',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        color: '#FEFEFE',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Download
                    </button>
                  </div>
                  <pre style={{
                    background: 'rgba(0,0,0,0.3)',
                    padding: '12px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: '#AAD1E7',
                    overflow: 'auto',
                    margin: 0,
                    maxHeight: '200px',
                  }}>
                    {generateRunScript()}
                  </pre>
                </div>

                {/* Tool Files */}
                <div
                  style={{
                    padding: '16px',
                    background: 'rgba(43,142,195,0.05)',
                    border: '1px solid rgba(43,142,195,0.1)',
                    borderRadius: '8px',
                  }}
                >
                  <h4 style={{ color: '#FEFEFE', fontSize: '14px', margin: '0 0 8px' }}>
                    📁 Tool Source Files
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '0 0 12px' }}>
                    Located at: <code style={{ color: '#AAD1E7' }}>{tool.path}</code>
                  </p>
                  <button
                    onClick={() => copyToClipboard(tool.path, 'path')}
                    style={{
                      background: 'rgba(43,142,195,0.15)',
                      border: '1px solid rgba(43,142,195,0.3)',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      color: '#79B8D9',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    {copied === 'path' ? '✓ Copied' : 'Copy Path'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
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
              onClick={() => setSelectedTool(tool)}
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
        onClose={() => setSelectedTool(null)}
      />
    </div>
  );
}
