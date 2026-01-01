import { NavLink, useLocation } from 'react-router-dom';
import { Home, Settings, Database } from 'lucide-react';

export function AppSidebar() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const tools = [
    { path: '/tools/data-factory-migration', label: 'Data Factory', icon: Database, tag: 'new' as const },
  ];

  return (
    <aside
      className="flex flex-col h-screen border-r"
      style={{
        width: 'var(--sidebar-expanded)',
        background: 'var(--bg-primary)',
        borderColor: 'var(--border-subtle)'
      }}
    >
      {/* Logo */}
      <div
        className="h-14 flex items-center px-4 border-b"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <NavLink to="/" className="flex items-center gap-2">
          <span
            className="font-mono text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            fabric-toolbox
          </span>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3">
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative flex items-center gap-3 transition-colors"
              style={{
                padding: 'var(--nav-padding-y) var(--nav-padding-x)',
                fontSize: 'var(--text-small)',
                color: isActive(item.path) ? 'var(--text-primary)' : 'var(--text-muted)',
                background: isActive(item.path) ? 'var(--bg-hover)' : 'transparent',
                transitionDuration: 'var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.background = 'var(--bg-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {isActive(item.path) && (
                <span
                  className="absolute left-0 top-0 bottom-0 w-[3px]"
                  style={{ background: 'var(--accent)' }}
                />
              )}
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Tools Section */}
        <div className="mt-6">
          <p
            className="px-4 py-2 font-mono uppercase"
            style={{
              fontSize: 'var(--text-tag)',
              color: 'var(--text-faint)',
              letterSpacing: 'var(--letter-spacing-caps)'
            }}
          >
            Tools
          </p>
          <div className="space-y-0.5">
            {tools.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className="relative flex items-center gap-3 transition-colors"
                style={{
                  padding: 'var(--nav-padding-y) var(--nav-padding-x)',
                  fontSize: 'var(--text-small)',
                  color: isActive(item.path) ? 'var(--text-primary)' : 'var(--text-muted)',
                  background: isActive(item.path) ? 'var(--bg-hover)' : 'transparent',
                  transitionDuration: 'var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'var(--bg-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {isActive(item.path) && (
                  <span
                    className="absolute left-0 top-0 bottom-0 w-[3px]"
                    style={{ background: 'var(--accent)' }}
                  />
                )}
                <item.icon className="w-4 h-4" />
                <span className="flex-1">{item.label}</span>
                {item.tag && (
                  <span className="tag tag-new">{item.tag}</span>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div
        className="px-4 py-3 border-t"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <p
          className="font-mono"
          style={{ fontSize: 'var(--text-tag)', color: 'var(--text-faint)' }}
        >
          v1.0.0
        </p>
      </div>
    </aside>
  );
}
