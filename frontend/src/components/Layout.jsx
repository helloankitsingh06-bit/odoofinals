import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../hooks/useAuth';

/**
 * Layout component for AssetFlow.
 * Wraps page content with a Sidebar, top navigation, and right-hand content area.
 * 
 * @component
 * @param {Object} props
 * @param {React.ReactNode} [props.children] - Page content elements to render. Fallbacks to react-router-dom Outlet.
 */
export default function Layout({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show a loading spinner screen while authentication checks are pending
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4 antialiased font-sans select-none">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-stone-850 border-t-emerald-500 animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-ping"></span>
          </div>
        </div>
        <div className="text-center space-y-1.5">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-200">
            Authenticating Secure Node
          </h3>
          <p className="text-[8px] text-stone-600 font-mono tracking-widest uppercase animate-pulse">
            Establishing handshake // Reading security clearance
          </p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Determine activeRoute display name based on current URL path
  const getActiveRoute = (pathname) => {
    switch (pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/org-setup':
        return 'Organization setup';
      case '/assets':
        return 'Assets';
      case '/allocation-transfer':
        return 'Allocation & Transfer';
      case '/resource-booking':
        return 'Resource Booking';
      case '/maintenance':
        return 'Maintenance';
      case '/audit':
        return 'Audit';
      case '/reports':
        return 'Reports';
      case '/notifications':
        return 'Notifications';
      default:
        return '';
    }
  };

  const activeRoute = getActiveRoute(location.pathname);

  return (
    <div className="flex text-asset-light min-h-screen font-sans">
      {/* Left Sidebar Navigation */}
      <Sidebar user={user} activeRoute={activeRoute} />

      {/* Main Right Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 my-6 mr-6 ml-3 px-8 flex items-center justify-between glass-panel">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-bold tracking-wider uppercase text-asset-light">
              AssetFlow
            </h1>
            <span className="text-xs text-stone-500 font-mono">
              |
            </span>
            <span className="text-xs text-emerald-400 font-bold tracking-wider uppercase drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
              {activeRoute || 'App'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-450 animate-pulse shadow-accent-glow"></span>
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest font-mono">
              ERP Node Online
            </span>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto mr-6 ml-3 mb-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
