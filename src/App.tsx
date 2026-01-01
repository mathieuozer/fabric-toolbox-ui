import React, { useState, useEffect, useRef, useMemo } from 'react';

// Tool data from the actual Fabric Toolbox repo
const TOOLS_DATA = {
  monitoring: [
    { id: 'fca', name: 'Fabric Cost Analysis', desc: 'Monitor and analyze your Fabric capacity costs', tags: ['UPDATED', 'PowerBI'], path: '/monitoring/fabric-cost-analysis' },
    { id: 'fuam', name: 'Fabric Unified Admin Monitoring', desc: 'Centralized admin monitoring for your Fabric tenant', tags: ['UPDATED', 'PowerBI'], path: '/monitoring/fabric-unified-admin-monitoring' },
    { id: 'fpm', name: 'Fabric Platform Monitoring', desc: 'Monitor Fabric with RTI and Capacity Events', tags: ['RTI'], path: '/monitoring/fabric-platform-monitoring' },
    { id: 'wsm', name: 'Workspace Monitoring Dashboards', desc: 'Report templates for workspace monitoring', tags: ['PowerBI'], path: '/monitoring/workspace-monitoring-dashboards' },
    { id: 'fsm', name: 'Fabric Spark Monitoring', desc: 'Monitor Spark workloads with Real-Time Intelligence', tags: ['RTI', 'Spark'], path: '/monitoring/fabric-spark-monitoring' },
  ],
  accelerators: [
    { id: 'bcdr', name: 'BCDR Accelerator', desc: 'Business Continuity and Disaster Recovery patterns', tags: ['Python'], path: '/accelerators/BCDR' },
    { id: 'cicd-git', name: 'Git-Based Deployments', desc: 'CI/CD patterns using Git integration', tags: ['CICD', 'Git'], path: '/accelerators/CICD/Git-based-deployments' },
    { id: 'cicd-pipelines', name: 'Fabric Deployment Pipelines', desc: 'Deploy using native Fabric deployment pipelines', tags: ['CICD'], path: '/accelerators/CICD/Deploy-using-Fabric-deployment-pipelines' },
    { id: 'cicd-branch', name: 'Branch to Workspace', desc: 'Branch out to new workspace patterns', tags: ['CICD', 'Git'], path: '/accelerators/CICD/Branch-out-to-new-workspace' },
    { id: 'dw-backup', name: 'DW Backup & Recovery', desc: 'Data Warehouse backup and recovery automation', tags: ['T-SQL', 'Python'], path: '/accelerators/data-warehouse-backup-and-recovery' },
    { id: 'pbi-modernize', name: 'Datamart to DW Migration', desc: 'Power BI datamart to Fabric Data Warehouse', tags: ['Migration'], path: '/accelerators/power-bi-to-fabric-data-warehouse-modernization' },
    { id: 'rti-eventhouse', name: 'RTI Eventhouse', desc: 'Real Time Intelligence Eventhouse patterns', tags: ['RTI', 'KQL'], path: '/accelerators/real-time-intelligence_eventhouse' },
    { id: 'rti-eventstream', name: 'RTI Eventstream', desc: 'Real Time Intelligence Eventstream patterns', tags: ['RTI'], path: '/accelerators/real-time-intelligence_eventstream' },
    { id: 'policy-weaver', name: 'Policy Weaver', desc: 'Mirror data access policies from Databricks and Snowflake', tags: ['Python', 'Security'], path: '/accelerators/policy-weaver' },
  ],
  samples: [
    { id: 'open-mirror', name: 'Open Mirroring', desc: 'Sample implementation for open mirroring', tags: ['Python'], path: '/samples/open-mirroring' },
    { id: 'adv-schedule', name: 'Advanced Pipeline Scheduling', desc: 'Schedule pipelines for specific days', tags: ['Pipeline'], path: '/samples/Advanced_Data_Pipeline_Scheduleing_Specific_Day' },
    { id: 'poll-trigger', name: 'Polling Storage Event Trigger', desc: 'Event-based triggers for storage changes', tags: ['Pipeline'], path: '/samples/polling-storage-even-trigger' },
    { id: 'nb-refresh', name: 'Refresh SQL Endpoint Tables', desc: 'Notebook to refresh tables in SQL Endpoint', tags: ['Notebook', 'Python'], path: '/samples/notebook-refresh-tables-in-sql-endpoint' },
    { id: 'viz-dataflows', name: 'Visualize Linked Dataflows', desc: 'Visualizing linked table dataflows', tags: ['PowerBI'], path: '/samples/visualizing-linked-table-dataflows' },
    { id: 'az-policy', name: 'Azure Capacity Policies', desc: 'Azure Policies to pause or delete capacity', tags: ['Azure', 'Policy'], path: '/samples/azure-policy' },
    { id: 'nb-pool', name: 'List Pool Connections', desc: 'Notebook to list dedicated pool connections', tags: ['Notebook'], path: '/samples/notebook-list-dedicated-pool-connections' },
    { id: 'nb-warehouse', name: 'Warehouse CRUD', desc: 'Create, list, delete Data Warehouse via notebook', tags: ['Notebook', 'Python'], path: '/samples/notebook-create-list-delete-warehouse' },
    { id: 'nb-size', name: 'Workspace Size', desc: 'Calculate workspace storage size', tags: ['Notebook'], path: '/samples/notebook-workspace-size' },
  ],
  scripts: [
    { id: 'mirror-cci', name: 'Mirror CCI Tables', desc: 'Mirror CCI tables for Fabric SQL DB', tags: ['NEW', 'T-SQL'], path: '/scripts/sql-Mirror-CCI-tables' },
    { id: 'ci-views', name: 'CI Views', desc: 'Continuous integration views for warehouses', tags: ['T-SQL'], path: '/scripts/dw-ci-views' },
    { id: 'dw-props', name: 'DW/SQL AE Properties', desc: 'Query data warehouse and SQL analytics endpoint properties', tags: ['T-SQL'], path: '/scripts/dw-properties' },
    { id: 'dw-requests', name: 'DW Active Requests', desc: 'Monitor active requests in your warehouse', tags: ['T-SQL'], path: '/scripts/dw-active-requests' },
    { id: 'dw-dmv', name: 'Copy DMV to Table', desc: 'Copy DMV results to persistent table', tags: ['T-SQL'], path: '/scripts/dw-copy-dmv-to-table' },
    { id: 'dw-timepoint', name: 'Queries at Timepoint', desc: 'Find queries running at specific time', tags: ['T-SQL'], path: '/scripts/dw-queries-running-at-timepoint' },
    { id: 'dw-kill', name: 'SP Kill Queries', desc: 'Stored procedure to terminate queries', tags: ['T-SQL'], path: '/scripts/dw-sp-kill-queries' },
  ],
  tools: [
    { id: 'adf-migrate', name: 'ADF Migration Assistant', desc: 'Migrate Azure Data Factory pipelines to Fabric', tags: ['UPDATED', 'TypeScript'], path: '/tools/FabricDataFactoryMigrationAssistant' },
    { id: 'dax-mcp', name: 'DAX Performance Tuner MCP', desc: 'MCP Server for DAX performance tuning', tags: ['MCP', 'Python'], path: '/tools/DAXPerformanceTunerMCPServer' },
    { id: 'sem-mcp', name: 'Semantic Model MCP Server', desc: 'MCP Server for semantic model operations', tags: ['MCP', 'Python'], path: '/tools/SemanticModelMCPServer' },
    { id: 'mirror-sdk', name: 'Open Mirroring SDK', desc: 'Python SDK for open mirroring', tags: ['Python', 'SDK'], path: '/tools/OpenMirroringPythonSDK' },
    { id: 'ps-module', name: 'MicrosoftFabricMgmt', desc: 'PowerShell module for Fabric management', tags: ['PowerShell'], path: '/tools/MicrosoftFabricMgmt' },
    { id: 'gen2-copy', name: 'Gen2 to Fabric DW Copy', desc: 'Copy tables from Gen2 Dedicated Pool to Fabric DW', tags: ['Python'], path: '/tools/Gen2toFabricDW' },
    { id: 'sem-audit', name: 'Semantic Model Audit', desc: 'Audit and analyze semantic models', tags: ['Python'], path: '/tools/SemanticModelAudit' },
    { id: 'copy-wh', name: 'Copy Warehouse', desc: 'Clone warehouse schemas and data', tags: ['Python'], path: '/tools/copy-warehouse' },
    { id: 'tpch', name: 'TPC-H Benchmarking', desc: 'TPC-H benchmark suite for Fabric', tags: ['Benchmark'], path: '/tools/tpch-benchmarking' },
    { id: 'dax-perf', name: 'DAX Performance Testing', desc: 'Test and measure DAX query performance', tags: ['DAX', 'Python'], path: '/tools/DAXPerformanceTesting' },
  ],
};

const CATEGORIES = [
  { id: 'monitoring', label: 'Monitoring', icon: '◉' },
  { id: 'accelerators', label: 'Accelerators', icon: '⚡' },
  { id: 'samples', label: 'Samples', icon: '◫' },
  { id: 'scripts', label: 'Scripts', icon: '>' },
  { id: 'tools', label: 'Tools', icon: '⚙' },
];

const GITHUB_BASE = 'https://github.com/microsoft/fabric-toolbox/tree/main';

interface Tool {
  id: string;
  name: string;
  desc: string;
  tags: string[];
  path: string;
  category?: string;
}

// Tag component
const Tag = ({ label }: { label: string }) => {
  const isNew = label === 'NEW';
  const isUpdated = label === 'UPDATED';

  return (
    <span style={{
      fontSize: '10px',
      fontFamily: "'IBM Plex Mono', monospace",
      letterSpacing: '0.5px',
      padding: '2px 6px',
      border: '1px solid',
      borderColor: isNew ? '#ff6b35' : isUpdated ? '#fbbf24' : 'rgba(255,255,255,0.2)',
      color: isNew ? '#ff6b35' : isUpdated ? '#fbbf24' : 'rgba(255,255,255,0.5)',
      textTransform: 'uppercase',
    }}>
      {label}
    </span>
  );
};

// Tool card component
const ToolCard = ({ tool, onClick, style }: { tool: Tool; onClick: (tool: Tool) => void; style?: React.CSSProperties }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => onClick(tool)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(255,255,255,0.03)' : 'transparent',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '16px 16px 16px 20px',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 100ms',
        ...style,
      }}
    >
      {/* Accent bar on hover */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '3px',
        background: '#ff6b35',
        opacity: hovered ? 1 : 0,
        transition: 'opacity 100ms',
      }} />

      <div style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '14px',
        color: '#fff',
        marginBottom: '6px',
        fontWeight: 500,
      }}>
        {tool.name}
      </div>

      <div style={{
        fontSize: '13px',
        color: 'rgba(255,255,255,0.45)',
        lineHeight: 1.4,
        marginBottom: '10px',
        fontFamily: "'Inter', sans-serif",
      }}>
        {tool.desc}
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {tool.tags.map((tag, i) => <Tag key={i} label={tag} />)}
      </div>
    </div>
  );
};

// Command palette
const CommandPalette = ({ isOpen, onClose, tools, onSelect }: {
  isOpen: boolean;
  onClose: () => void;
  tools: typeof TOOLS_DATA;
  onSelect: (tool: Tool) => void;
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const allTools = useMemo(() =>
    Object.entries(tools).flatMap(([category, items]) =>
      items.map(t => ({ ...t, category }))
    ), [tools]
  );

  const filtered = useMemo(() => {
    if (!query) return allTools.slice(0, 8);
    const q = query.toLowerCase();
    return allTools.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.desc.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [query, allTools]);

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
          width: '540px',
          maxHeight: '420px',
          background: '#101012',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '0 16px',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.3)', marginRight: '12px', fontSize: '14px' }}>⌘</span>
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
              padding: '16px 0',
              color: '#fff',
              fontSize: '14px',
              fontFamily: "'Inter', sans-serif",
            }}
          />
          <span style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.3)',
            padding: '3px 6px',
            border: '1px solid rgba(255,255,255,0.15)',
            fontFamily: "'IBM Plex Mono', monospace",
          }}>ESC</span>
        </div>

        <div style={{ maxHeight: '360px', overflow: 'auto' }}>
          {filtered.map((tool, i) => (
            <div
              key={tool.id}
              onClick={() => { onSelect(tool); onClose(); }}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                background: i === selectedIndex ? 'rgba(255,107,53,0.1)' : 'transparent',
                borderLeft: i === selectedIndex ? '2px solid #ff6b35' : '2px solid transparent',
                transition: 'background 50ms',
              }}
            >
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '13px',
                color: '#fff',
                marginBottom: '2px',
              }}>
                {tool.name}
              </div>
              <div style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{
                  color: '#ff6b35',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  fontFamily: "'IBM Plex Mono', monospace",
                }}>
                  {tool.category}
                </span>
                <span>·</span>
                <span>{tool.desc}</span>
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

// Detail panel
const DetailPanel = ({ tool, onClose }: { tool: Tool | null; onClose: () => void }) => {
  if (!tool) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 50,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '480px',
          height: '100%',
          background: '#0a0a0b',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          padding: '32px',
          overflow: 'auto',
          animation: 'slideIn 150ms ease-out',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '8px',
          }}
        >
          ✕
        </button>

        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '10px',
          color: '#ff6b35',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '8px',
        }}>
          {tool.category}
        </div>

        <h2 style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '24px',
          color: '#fff',
          fontWeight: 500,
          margin: '0 0 16px 0',
          lineHeight: 1.3,
        }}>
          {tool.name}
        </h2>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {tool.tags.map((tag, i) => <Tag key={i} label={tag} />)}
        </div>

        <p style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: '14px',
          lineHeight: 1.6,
          fontFamily: "'Inter', sans-serif",
          marginBottom: '32px',
        }}>
          {tool.desc}
        </p>

        <div style={{
          padding: '20px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: '24px',
        }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '11px',
            color: 'rgba(255,255,255,0.4)',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Path
          </div>
          <code style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '12px',
            color: 'rgba(255,255,255,0.7)',
          }}>
            {tool.path}
          </code>
        </div>

        <a
          href={`${GITHUB_BASE}${tool.path}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#ff6b35',
            fontSize: '13px',
            fontFamily: "'Inter', sans-serif",
            textDecoration: 'none',
            borderBottom: '1px solid #ff6b35',
            paddingBottom: '2px',
          }}
        >
          Open in GitHub
          <span style={{ fontSize: '11px' }}>↗</span>
        </a>
      </div>
    </div>
  );
};

// Main app
export default function App() {
  const [activeCategory, setActiveCategory] = useState('monitoring');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

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

  const tools = TOOLS_DATA[activeCategory as keyof typeof TOOLS_DATA] || [];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0b',
      color: '#fff',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      {/* Sidebar */}
      <aside style={{
        width: sidebarExpanded ? '200px' : '56px',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        padding: '20px 0',
        transition: 'width 150ms',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Logo area */}
        <div
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          style={{
            padding: '0 16px 24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div style={{
            width: '24px',
            height: '24px',
            background: '#ff6b35',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '14px',
            fontWeight: 600,
          }}>
            F
          </div>
          {sidebarExpanded && (
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '13px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.9)',
            }}>
              toolbox
            </span>
          )}
        </div>

        {/* Categories */}
        <nav style={{ flex: 1 }}>
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                  transition: 'color 100ms',
                  textAlign: 'left',
                }}
              >
                {/* Active indicator */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '3px',
                  height: '20px',
                  background: '#ff6b35',
                  opacity: isActive ? 1 : 0,
                  transition: 'opacity 100ms',
                }} />

                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '14px',
                  width: '20px',
                  textAlign: 'center',
                }}>
                  {cat.icon}
                </span>

                {sidebarExpanded && (
                  <span style={{
                    fontSize: '13px',
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    {cat.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Stats */}
        {sidebarExpanded && (
          <div style={{
            padding: '16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{
              fontSize: '10px',
              color: 'rgba(255,255,255,0.3)',
              fontFamily: "'IBM Plex Mono', monospace",
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '6px',
            }}>
              Total tools
            </div>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '24px',
              color: '#fff',
              fontWeight: 500,
            }}>
              {Object.values(TOOLS_DATA).flat().length}
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {/* Header */}
        <header style={{
          padding: '20px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.3)',
              fontFamily: "'IBM Plex Mono', monospace",
            }}>
              fabric-toolbox
            </span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
            <span style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.6)',
              fontFamily: "'IBM Plex Mono', monospace",
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
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)',
              fontSize: '13px',
              fontFamily: "'Inter', sans-serif",
              borderRadius: '2px',
              minWidth: '200px',
            }}
          >
            <span>Search tools...</span>
            <span style={{
              marginLeft: 'auto',
              fontSize: '10px',
              padding: '2px 6px',
              border: '1px solid rgba(255,255,255,0.15)',
              fontFamily: "'IBM Plex Mono', monospace",
              color: 'rgba(255,255,255,0.35)',
            }}>⌘K</span>
          </button>
        </header>

        {/* Category header */}
        <div style={{ padding: '32px 32px 24px' }}>
          <h1 style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '28px',
            fontWeight: 500,
            color: '#fff',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            {CATEGORIES.find(c => c.id === activeCategory)?.label}
            <span style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.3)',
              fontWeight: 400,
            }}>
              ({tools.length})
            </span>
          </h1>
        </div>

        {/* Tools grid */}
        <div style={{
          padding: '0 32px 48px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1px',
          background: 'rgba(255,255,255,0.06)',
        }}>
          {tools.map(tool => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onClick={() => setSelectedTool({ ...tool, category: activeCategory })}
              style={{ background: '#0a0a0b' }}
            />
          ))}
        </div>
      </main>

      {/* Command palette */}
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        tools={TOOLS_DATA}
        onSelect={(tool) => setSelectedTool(tool)}
      />

      {/* Detail panel */}
      <DetailPanel
        tool={selectedTool}
        onClose={() => setSelectedTool(null)}
      />
    </div>
  );
}
