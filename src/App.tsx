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
const ToolCard = ({ tool, onClick, style }: { tool: Tool; onClick: (tool: Tool) => void; style?: React.CSSProperties }) => {
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

      <div style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: '15px',
        color: '#FEFEFE',
        marginBottom: '8px',
        fontWeight: 600,
        letterSpacing: '-0.01em',
      }}>
        {tool.name}
      </div>

      <div style={{
        fontSize: '14px',
        color: 'rgba(255,255,255,0.6)',
        lineHeight: 1.5,
        marginBottom: '12px',
        fontFamily: "'Inter', sans-serif",
      }}>
        {tool.desc}
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '14px',
                fontWeight: 600,
                color: '#FEFEFE',
                marginBottom: '4px',
              }}>
                {tool.name}
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
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 50,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '520px',
          height: '100%',
          background: '#0a0a0b',
          borderLeft: '1px solid rgba(43,142,195,0.2)',
          padding: '40px',
          overflow: 'auto',
          animation: 'slideIn 150ms ease-out',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '28px',
            right: '28px',
            background: 'rgba(43,142,195,0.1)',
            border: '1px solid rgba(43,142,195,0.2)',
            borderRadius: '8px',
            color: '#79B8D9',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '8px 12px',
            transition: 'all 150ms',
          }}
        >
          ✕
        </button>

        <div style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '11px',
          fontWeight: 600,
          color: '#79B8D9',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '12px',
        }}>
          {tool.category}
        </div>

        <h2 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '26px',
          color: '#FEFEFE',
          fontWeight: 700,
          margin: '0 0 20px 0',
          lineHeight: 1.3,
          letterSpacing: '-0.02em',
        }}>
          {tool.name}
        </h2>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
          {tool.tags.map((tag, i) => <Tag key={i} label={tag} />)}
        </div>

        <p style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: '15px',
          lineHeight: 1.7,
          fontFamily: "'Inter', sans-serif",
          marginBottom: '36px',
        }}>
          {tool.desc}
        </p>

        <div style={{
          padding: '20px',
          background: 'rgba(43,142,195,0.06)',
          border: '1px solid rgba(43,142,195,0.15)',
          borderRadius: '8px',
          marginBottom: '28px',
        }}>
          <div style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '11px',
            fontWeight: 600,
            color: 'rgba(121,184,217,0.7)',
            marginBottom: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Path
          </div>
          <code style={{
            fontFamily: "monospace",
            fontSize: '13px',
            color: '#AAD1E7',
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
            gap: '10px',
            background: '#2B8EC3',
            color: '#FEFEFE',
            fontSize: '14px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 600,
            textDecoration: 'none',
            padding: '12px 20px',
            borderRadius: '8px',
            transition: 'all 150ms',
          }}
        >
          Open in GitHub
          <span style={{ fontSize: '14px' }}>↗</span>
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
                  <span style={{
                    fontSize: '14px',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: isActive ? 500 : 400,
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
              {Object.values(TOOLS_DATA).flat().length}
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
              onClick={() => setSelectedTool({ ...tool, category: activeCategory })}
              style={{ background: 'rgba(43,142,195,0.02)' }}
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
