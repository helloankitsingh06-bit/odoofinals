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

// P2 Scope Imports
import Attendance from './pages/Attendance';
import TimeOffRequests from './pages/TimeOffRequests';
import Allocations from './pages/Allocations';
import TimeOffTypes from './pages/TimeOffTypes';
import EmployeeAttendanceTab from './components/EmployeeAttendanceTab';

function EmployeeContractsBridge() {
  const { id } = useParams();
  return <Contracts defaultEmployeeId={id} />;
}

function EmployeeAttendanceBridge() {
  const { id } = useParams();
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-asset-light">Employee Attendance History</h2>
          <p className="text-xs text-stone-400 font-mono">Viewing shifts for Employee ID: {id}</p>
        </div>
      </div>
      <EmployeeAttendanceTab employeeId={id} />
    </div>
  );
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
            {/* P1: Employee Master */}
            <Route path="/employees" element={<Employees />} />

            {/* Smart button bridges */}
            <Route path="/employees/:id/contracts" element={<EmployeeContractsBridge />} />
            <Route path="/employees/:id/attendance" element={<EmployeeAttendanceBridge />} />
            <Route
              path="/employees/:id/timeoff"
              element={<TimeOffRequests />}
            />

            {/* P1: Contracts Management */}
            <Route path="/contracts" element={<Contracts />} />

            {/* P1: Working Schedules */}
            <Route path="/schedules" element={<WorkingSchedules />} />

            {/* P2: Attendance & Time Off Console */}
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/time-off-requests" element={<TimeOffRequests />} />
            <Route path="/allocations" element={<Allocations />} />
            <Route path="/time-off-types" element={<TimeOffTypes />} />

            {/* Admin-only branch (P1 Deliverable 1) */}
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
