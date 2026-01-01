import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AppSidebar } from './AppSidebar';
import { Search } from 'lucide-react';

export function DashboardShell() {
  return (
    <div
      className="flex h-screen"
      style={{ background: 'var(--bg-primary)' }}
    >
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header
          className="h-14 flex items-center justify-between px-6 border-b"
          style={{
            background: 'var(--bg-primary)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <div className="flex-1" />

          {/* Command Palette Trigger */}
          <button
            className="flex items-center gap-2 border transition-colors"
            style={{
              padding: 'var(--input-padding-y) var(--input-padding-x)',
              fontSize: 'var(--text-small)',
              color: 'var(--text-muted)',
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              transitionDuration: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-strong)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-medium)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
            onClick={() => {/* TODO: Open command palette */}}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
            <kbd
              className="ml-2 font-mono px-1.5 py-0.5"
              style={{
                fontSize: 'var(--text-tag)',
                color: 'var(--text-faint)',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              ⌘K
            </kbd>
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
