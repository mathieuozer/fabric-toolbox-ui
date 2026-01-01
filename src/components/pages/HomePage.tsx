import { Link } from 'react-router-dom';
import { Database, ArrowRight } from 'lucide-react';
import { useClientConfig } from '@/contexts/ClientConfigContext';

export function HomePage() {
  const { activeConfig, state } = useClientConfig();

  if (!activeConfig && !state.isLoading) {
    return (
      <div className="py-4">
        {/* Breadcrumb */}
        <p
          className="font-mono uppercase mb-6"
          style={{
            fontSize: 'var(--text-label)',
            color: 'var(--text-faint)',
            letterSpacing: 'var(--letter-spacing-caps)'
          }}
        >
          home / setup
        </p>

        <h1
          className="font-mono font-medium mb-3"
          style={{
            fontSize: 'var(--text-h1)',
            color: 'var(--text-primary)',
            letterSpacing: 'var(--letter-spacing-tight)',
            lineHeight: 'var(--line-height-tight)'
          }}
        >
          Welcome to Fabric Toolbox
        </h1>
        <p
          className="mb-8 max-w-lg"
          style={{
            fontSize: 'var(--text-body)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--line-height-relaxed)'
          }}
        >
          Connect your Azure AD app registration to start using the migration tools.
        </p>
        <Link
          to="/settings"
          className="inline-flex items-center gap-2 font-medium transition-opacity"
          style={{
            padding: 'var(--input-padding-y) var(--input-padding-x)',
            fontSize: 'var(--text-small)',
            background: 'var(--accent)',
            color: 'var(--bg-primary)',
            borderRadius: 'var(--radius-sm)',
            transitionDuration: 'var(--transition-fast)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          Add Configuration
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const tools = [
    {
      path: '/tools/data-factory-migration',
      name: 'data-factory-migration',
      description: 'Migrate Azure Data Factory & Synapse pipelines to Microsoft Fabric',
      icon: Database,
      tag: 'new' as const,
      version: '1.0.0'
    },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <p
        className="font-mono uppercase mb-6"
        style={{
          fontSize: 'var(--text-label)',
          color: 'var(--text-faint)',
          letterSpacing: 'var(--letter-spacing-caps)'
        }}
      >
        home / {activeConfig?.name.toLowerCase().replace(/\s+/g, '-')}
      </p>

      {/* Header */}
      <div className="mb-8">
        <h1
          className="font-mono font-medium"
          style={{
            fontSize: 'var(--text-h1)',
            color: 'var(--text-primary)',
            letterSpacing: 'var(--letter-spacing-tight)',
            lineHeight: 'var(--line-height-tight)'
          }}
        >
          {activeConfig?.name}
        </h1>
        <p
          className="font-mono mt-1"
          style={{
            fontSize: 'var(--text-label)',
            color: 'var(--text-faint)'
          }}
        >
          {activeConfig?.azureAD.tenantId}
        </p>
      </div>

      {/* Tools Section */}
      <div>
        <p
          className="font-mono uppercase mb-4"
          style={{
            fontSize: 'var(--text-tag)',
            color: 'var(--text-faint)',
            letterSpacing: 'var(--letter-spacing-caps)'
          }}
        >
          Available Tools
        </p>

        {/* Tools Grid with 1px gap effect */}
        <div
          className="grid gap-px"
          style={{
            background: 'var(--border-subtle)',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
          }}
        >
          {tools.map((tool) => (
            <Link
              key={tool.path}
              to={tool.path}
              className="card-accent group flex flex-col transition-colors"
              style={{
                padding: 'var(--card-padding)',
                paddingLeft: '20px',
                background: 'var(--bg-primary)',
                transitionDuration: 'var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-primary)';
              }}
            >
              {/* Tool Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div
                  className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'var(--bg-selected)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <tool.icon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                </div>
                {tool.tag && (
                  <span className="tag tag-new">{tool.tag}</span>
                )}
              </div>

              {/* Tool Info */}
              <p
                className="font-mono font-medium mb-1"
                style={{
                  fontSize: 'var(--text-body)',
                  color: 'var(--text-primary)'
                }}
              >
                {tool.name}
              </p>
              <p
                className="mb-3"
                style={{
                  fontSize: 'var(--text-small)',
                  color: 'var(--text-secondary)',
                  lineHeight: 'var(--line-height-normal)'
                }}
              >
                {tool.description}
              </p>

              {/* Tool Footer */}
              <div className="flex items-center justify-between mt-auto pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="tag tag-default">v{tool.version}</span>
                <ArrowRight
                  className="w-4 h-4 transition-colors"
                  style={{
                    color: 'var(--text-faint)',
                    transitionDuration: 'var(--transition-fast)'
                  }}
                />
              </div>
            </Link>
          ))}
        </div>

        <p
          className="font-mono mt-6"
          style={{
            fontSize: 'var(--text-small)',
            color: 'var(--text-faint)'
          }}
        >
          More tools coming soon
        </p>
      </div>
    </div>
  );
}
