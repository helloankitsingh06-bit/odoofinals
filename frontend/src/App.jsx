import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Layout from './components/Layout';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import Items from './pages/Items';

// Placeholder for routes you haven't built yet. Replace per problem statement.
function PlaceholderPage({ title }) {
  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4 text-asset-light">{title}</h2>
      <p className="text-sm text-stone-400">This module is under construction.</p>
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

          {/* Authenticated area (Layout redirects to /login if not signed in) */}
          <Route element={<Layout />}>
            <Route path="/items" element={<Items />} />

            {/* Admin-only branch */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<PlaceholderPage title="Admin" />} />
            </Route>

            <Route path="/" element={<Navigate to="/items" replace />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/items" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
