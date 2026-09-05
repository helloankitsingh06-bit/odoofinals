import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, FileText, Clock, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { VALID_ROLES } from '../constants';

export default function Sidebar({ user: propUser }) {
  const { user: authUser, logout, setRole } = useAuth();
  const location = useLocation();

  const user = propUser !== undefined ? propUser : authUser;
  const isAdmin = user?.role === 'Admin';

  const navItems = [
    { name: 'Employees', path: '/employees', icon: Users },
    { name: 'Contracts', path: '/contracts', icon: FileText },
    { name: 'Working Schedules', path: '/schedules', icon: Clock },
    { name: 'User Roles', path: '/admin/users', icon: Shield, adminOnly: true },
  ];

  return (
    <aside className="w-64 h-[calc(100vh-3rem)] my-6 ml-6 flex flex-col sticky top-6 font-sans glass-panel overflow-hidden">
      {/* Top Branding Section */}
      <div className="h-16 flex items-center px-6 border-b border-glass-border bg-white/[0.01]">
        <span className="text-base font-bold tracking-wider text-asset-light flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981] animate-pulse"></span>
          PeoplePay<span className="text-emerald-400">360</span>
        </span>
      </div>

      {/* Main Navigation Menu */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;

          const isActive = location.pathname.startsWith(item.path);
          const IconComponent = item.icon;

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition-all duration-150 border-l-2 ${
                isActive
                  ? 'bg-asset-green/25 text-emerald-300 border-emerald-500 shadow-green-glow'
                  : 'text-stone-400 border-transparent hover:bg-white/5 hover:text-asset-light'
              }`}
            >
              <IconComponent className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-stone-500'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Session Section */}
      <div className="p-4 border-t border-glass-border bg-white/[0.01]">
        {user ? (
          <div className="flex flex-col gap-2">
            <div>
              <p className="text-xs font-semibold text-asset-light truncate">{user.name || user.email}</p>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-white/5 text-emerald-400 border border-emerald-500/20 mt-1 font-mono shadow-accent-glow">
                {user.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="mt-2 w-full text-center h-8 px-3 border border-glass-border rounded-md text-[10px] font-bold text-stone-400 hover:text-asset-light hover:bg-white/5 transition-all duration-150 uppercase tracking-wider active:scale-[0.98] flex items-center justify-center gap-1.5 font-mono"
            >
              <LogOut className="h-3 w-3" />
              Sign Out
            </button>

            {/* Dev role switcher */}
            {import.meta.env.DEV && (
              <div className="mt-2 pt-2 border-t border-glass-border bg-white/[0.01] flex flex-col gap-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-stone-500 mb-0.5 font-mono">
                  DEV: Switch Role
                </label>
                <select
                  value={user.role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-stone-950/80 border border-glass-border rounded-md px-2 py-1 text-[10px] text-stone-300 focus:outline-none focus:border-emerald-500 font-mono"
                >
                  {VALID_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="block w-full text-center h-8 flex items-center justify-center border border-glass-border rounded-md text-[10px] font-bold text-asset-light hover:bg-white/5 transition-all duration-150 uppercase tracking-wider active:scale-[0.98] font-mono"
          >
            Sign In
          </Link>
        )}
      </div>
    </aside>
  );
}
