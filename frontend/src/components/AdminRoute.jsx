import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Route guard that restricts rendering to users with the 'Admin' role.
 * If the user is not an Admin, they are redirected to the Dashboard.
 */
export default function AdminRoute() {
  const { user, loading } = useAuth();

  // If Auth state is still loading, wait (Layout will show the loader)
  if (loading) {
    return null;
  }

  // Redirect non-admins to the dashboard
  if (!user || user.role !== 'Admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
