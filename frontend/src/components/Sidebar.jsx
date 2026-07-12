import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Sidebar component for AssetFlow.
 * 
 * @component
 * @param {Object} props
 * @param {Object} [props.user] - The active user object. If not provided, it will fallback to the useAuth() hook.
 * @param {string} [props.activeRoute] - The display name of the route currently active.
 */
export default function Sidebar({ user: propUser, activeRoute }) {
  const { user: authUser, logout, setRole } = useAuth();
  
  // Use the passed user prop if provided, else fallback to useAuth() hook user
  const user = propUser !== undefined ? propUser : authUser;
  
  // Only display Organization setup if role is exactly 'Admin'
  const isAdmin = user?.role === 'Admin';

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Organization setup', path: '/org-setup', adminOnly: true },
    { name: 'Assets', path: '/assets' },
    { name: 'Allocation & Transfer', path: '/allocation-transfer' },
    { name: 'Resource Booking', path: '/resource-booking' },
    { name: 'Maintenance', path: '/maintenance' },
    { name: 'Audit', path: '/audit' },
    { name: 'Reports', path: '/reports' },
    { name: 'Notifications', path: '/notifications' },
  ];

  return (
    <aside className="w-64 bg-stone-950 border-r border-stone-850 flex flex-col h-screen sticky top-0 font-sans">
      {/* Top Branding Section */}
      <div className="h-16 flex items-center px-6 border-b border-stone-850">
        <span className="text-lg font-bold tracking-wider text-asset-light flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-asset-green"></span>
          AssetFlow
        </span>
      </div>

      {/* Main Navigation Menu */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          // Gate the 'Organization setup' route
          if (item.adminOnly && !isAdmin) return null;

          const isActive = activeRoute === item.name;

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-4 py-2.5 text-xs font-semibold rounded transition-all duration-150 border-l-2 ${
                isActive
                  ? 'bg-asset-green/10 text-asset-light border-asset-green'
                  : 'text-stone-400 border-transparent hover:bg-stone-900/50 hover:text-asset-light'
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Session Section */}
      <div className="p-4 border-t border-stone-850 bg-stone-900/10">
        {user ? (
          <div className="flex flex-col gap-2">
            <div>
              <p className="text-xs font-semibold text-asset-light truncate">{user.name || user.email}</p>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-stone-900 text-asset-green border border-stone-800 tracking-wide uppercase mt-1">
                {user.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="mt-2 w-full text-center px-3 py-1.5 border border-stone-800 rounded text-[10px] font-bold text-stone-400 hover:text-asset-light hover:bg-stone-900 transition-colors uppercase tracking-wider"
            >
              Sign Out
            </button>
            {/* TEMP DEV ONLY - remove when real auth lands */}
            <div className="mt-2 pt-2 border-t border-stone-850/50 flex flex-col gap-1">
              <label className="text-[9px] font-bold uppercase tracking-wider text-stone-500">DEV: Role</label>
              <select
                value={user.role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-stone-950 border border-stone-850 rounded px-2 py-1.5 text-[10px] text-stone-400 focus:outline-none focus:border-stone-700"
              >
                <option value="Admin">Admin</option>
                <option value="Employee">Employee</option>
                <option value="AssetManager">AssetManager</option>
                <option value="DeptHead">DeptHead</option>
              </select>
            </div>
          </div>
        ) : (
          <Link
            to="/login"
            className="block w-full text-center px-3 py-1.5 border border-stone-800 rounded text-[10px] font-bold text-asset-light hover:bg-stone-900 transition-colors uppercase tracking-wider"
          >
            Sign In
          </Link>
        )}
      </div>
    </aside>
  );
}
