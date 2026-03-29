import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/brand-analysis', label: 'Brand Analysis', icon: 'analytics' },
  { path: '/content-plan', label: 'Content Plan', icon: 'edit_calendar' },
  { path: '/publishing-queue', label: 'Publishing Queue', icon: 'schedule_send' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="w-64 bg-surface-container-low flex flex-col flex-shrink-0">
        {/* Brand */}
        <div className="px-6 pt-8 pb-6">
          <h1 className="font-display font-800 text-xl tracking-tight text-on-surface">
            BRAND OS
          </h1>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant/60 mt-0.5 uppercase">
            Elite Edition
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(({ path, label, icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-btn text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-surface-container-highest text-on-surface'
                    : 'text-on-surface-variant hover:bg-surface-container-high/50'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="px-4 py-4 mt-auto">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center">
              <span className="text-xs font-semibold text-on-primary-fixed-variant">
                {user?.email?.charAt(0)?.toUpperCase() ?? 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-on-surface truncate">
                {user?.email ?? 'User'}
              </p>
            </div>
            <button
              onClick={logout}
              className="text-on-surface-variant hover:text-on-surface transition-colors"
              title="Sign out"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 flex items-center px-8 bg-surface-container-lowest shadow-ambient">
          <h2 className="font-display font-semibold text-on-surface">Personal Brand OS</h2>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
