import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { useClientConfig } from '@/contexts/ClientConfigContext';

export function DataFactoryMigrationModule() {
  const { activeConfig } = useClientConfig();

  if (!activeConfig) {
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
          tools / data-factory-migration
        </p>

        {/* Warning Badge */}
        <span className="tag tag-updated mb-4 inline-block">Config Required</span>

        <h1
          className="font-mono font-medium mb-3"
          style={{
            fontSize: 'var(--text-h1)',
            color: 'var(--text-primary)',
            letterSpacing: 'var(--letter-spacing-tight)',
            lineHeight: 'var(--line-height-tight)'
          }}
        >
          Data Factory Migration
        </h1>
        <p
          className="mb-8 max-w-lg"
          style={{
            fontSize: 'var(--text-body)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--line-height-relaxed)'
          }}
        >
          You need to configure an Azure AD connection before using this tool.
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
          Go to Settings
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const steps = [
    { num: '01', title: 'Upload', desc: 'Export your ARM template from Azure Data Factory or Synapse' },
    { num: '02', title: 'Map', desc: 'Match your connections to Fabric equivalents' },
    { num: '03', title: 'Validate', desc: 'Review any compatibility issues before deploying' },
    { num: '04', title: 'Deploy', desc: 'Push directly to your Fabric workspace' },
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
        tools / data-factory-migration
      </p>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1
            className="font-mono font-medium"
            style={{
              fontSize: 'var(--text-h1)',
              color: 'var(--text-primary)',
              letterSpacing: 'var(--letter-spacing-tight)',
              lineHeight: 'var(--line-height-tight)'
            }}
          >
            data-factory-migration
          </h1>
          <span className="tag tag-new">new</span>
        </div>
        <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
          Migrate ADF & Synapse pipelines to Microsoft Fabric
        </p>
      </div>

      {/* Steps */}
      <div className="mb-8">
        <p
          className="font-mono uppercase mb-4"
          style={{
            fontSize: 'var(--text-tag)',
            color: 'var(--text-faint)',
            letterSpacing: 'var(--letter-spacing-caps)'
          }}
        >
          How it works
        </p>
        <div
          className="border"
          style={{
            borderColor: 'var(--border-subtle)',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          {steps.map((step, index) => (
            <div
              key={step.num}
              className="flex gap-4"
              style={{
                padding: 'var(--card-padding)',
                borderBottom: index < steps.length - 1 ? '1px solid var(--border-subtle)' : 'none'
              }}
            >
              <span
                className="font-mono flex-shrink-0"
                style={{
                  fontSize: 'var(--text-label)',
                  color: 'var(--accent)',
                  width: '24px'
                }}
              >
                {step.num}
              </span>
              <div>
                <p
                  className="font-mono mb-0.5"
                  style={{
                    fontSize: 'var(--text-small)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {step.title}
                </p>
                <p
                  style={{
                    fontSize: 'var(--text-small)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div
        className="pt-6 border-t"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <p
          className="mb-4"
          style={{
            fontSize: 'var(--text-small)',
            color: 'var(--text-muted)'
          }}
        >
          Full dashboard integration coming soon. For now, use the standalone application.
        </p>
        <a
          href="https://github.com/microsoft/fabric-toolbox/tree/main/tools/FabricDataFactoryMigrationAssistant"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 border transition-colors"
          style={{
            padding: 'var(--input-padding-y) var(--input-padding-x)',
            fontSize: 'var(--text-small)',
            color: 'var(--text-secondary)',
            borderColor: 'var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            transitionDuration: 'var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-strong)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-medium)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          Open standalone app
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
