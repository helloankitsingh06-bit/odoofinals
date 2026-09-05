import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Layout from './components/Layout';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import Items from './pages/Items';
import Dashboard from './pages/Dashboard';
import SalaryRules from './pages/SalaryRules';
import SalaryStructures from './pages/SalaryStructures';
import Payruns from './pages/Payruns';
import PayrunWizard from './pages/PayrunWizard';
import PayrunProcessing from './pages/PayrunProcessing';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Authenticated area */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/payruns" element={<Payruns />} />
            <Route path="/payruns/new" element={<PayrunWizard />} />
            <Route path="/payruns/:id" element={<PayrunProcessing />} />
            <Route path="/salary-structures" element={<SalaryStructures />} />
            <Route path="/salary-rules" element={<SalaryRules />} />
            <Route path="/items" element={<Items />} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
