import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
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
        error / 404
      </p>

      {/* Error Badge */}
      <span className="tag tag-new mb-4 inline-block">404 Error</span>

      <h1
        className="font-mono font-medium mb-3"
        style={{
          fontSize: 'var(--text-h1)',
          color: 'var(--text-primary)',
          letterSpacing: 'var(--letter-spacing-tight)',
          lineHeight: 'var(--line-height-tight)'
        }}
      >
        Page not found
      </h1>
      <p
        className="mb-8 max-w-lg"
        style={{
          fontSize: 'var(--text-body)',
          color: 'var(--text-secondary)',
          lineHeight: 'var(--line-height-relaxed)'
        }}
      >
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 font-medium transition-colors"
        style={{
          fontSize: 'var(--text-small)',
          color: 'var(--accent)',
          transitionDuration: 'var(--transition-fast)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-hover)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--accent)'}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </Link>
    </div>
  );
}
