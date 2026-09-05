import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Layout from './components/Layout';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import Employees from './pages/Employees';
import Contracts from './pages/Contracts';
import WorkingSchedules from './pages/WorkingSchedules';
import UserManagement from './pages/UserManagement';

function EmployeeContractsBridge() {
  const { id } = useParams();
  return <Contracts defaultEmployeeId={id} />;
}

function IntegrationPlaceholder({ title, description, badge }) {
  return (
    <div className="glass-panel p-8 text-center max-w-lg mx-auto mt-12 space-y-4">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-950/40 text-amber-400 border border-amber-500/30">
        {badge || 'Integration In Progress'}
      </div>
      <h2 className="text-xl font-bold tracking-wider text-asset-light uppercase">
        {title}
      </h2>
      <p className="text-xs text-stone-400 font-mono">
        {description || 'This module is linked to Person 2 / Person 3 scope.'}
      </p>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Authenticated Area */}
          <Route element={<Layout />}>
            {/* Employee Master (Deliverable 2 + 5) */}
            <Route path="/employees" element={<Employees />} />

            {/* Smart button bridges */}
            <Route path="/employees/:id/contracts" element={<EmployeeContractsBridge />} />
            <Route
              path="/employees/:id/attendance"
              element={
                <IntegrationPlaceholder
                  title="Attendance Tracking"
                  badge="Person 2 Scope"
                  description="Attendance check-ins, check-outs, and overtime logs (P2 scope)."
                />
              }
            />
            <Route
              path="/employees/:id/timeoff"
              element={
                <IntegrationPlaceholder
                  title="Time Off & Leaves"
                  badge="Person 2 Scope"
                  description="Time off allocation balances and requests (P2 scope)."
                />
              }
            />

            {/* Contracts Management (Deliverable 3 + 5) */}
            <Route path="/contracts" element={<Contracts />} />

            {/* Working Schedules (Deliverable 4 + 5) */}
            <Route path="/schedules" element={<WorkingSchedules />} />

            {/* Admin-only branch (Deliverable 1 + 5) */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
            </Route>

            {/* Default redirect to employees */}
            <Route path="/" element={<Navigate to="/employees" replace />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/employees" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
