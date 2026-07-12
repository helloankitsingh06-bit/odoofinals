import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OrgSetup from './pages/OrgSetup';
import ActivityLog from './pages/ActivityLog';
import Assets from './pages/Assets';

// Generic placeholder page for unused sidebar links
const PlaceholderPage = ({ title }) => (
  <div className="p-8">
    <h2 className="text-xl font-bold mb-4 text-asset-light">{title}</h2>
    <p className="text-sm text-stone-400">This module is under construction.</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes inside Layout */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/org-setup" element={<OrgSetup />} />
            <Route path="/activity-log" element={<ActivityLog />} />
            
            {/* Additional Sidebar Routes */}
            <Route path="/assets" element={<Assets />} />
            <Route path="/assets/:id" element={<PlaceholderPage title="Asset Detail" />} />
            <Route path="/allocation-transfer" element={<PlaceholderPage title="Allocation & Transfer" />} />
            <Route path="/resource-booking" element={<PlaceholderPage title="Resource Booking" />} />
            <Route path="/maintenance" element={<PlaceholderPage title="Maintenance" />} />
            <Route path="/audit" element={<PlaceholderPage title="Audit" />} />
            <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
            <Route path="/notifications" element={<PlaceholderPage title="Notifications" />} />

            {/* Default Route redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Catch-all wildcard redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
