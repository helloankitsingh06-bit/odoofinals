import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { ContractsPage } from './pages/ContractsPage';
import { AttendancePage } from './pages/AttendancePage';
import { TimeOffPage } from './pages/TimeOffPage';
import { SalaryStructuresPage } from './pages/SalaryStructuresPage';
import { PayrunsPage } from './pages/PayrunsPage';
import { MyProfilePage } from './pages/MyProfilePage';

const MainApp: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f6f5fa] dark:bg-[#05040a] flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-600 dark:border-purple-400 border-r-amber-500 dark:border-r-amber-400"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // ISSUE 1B: admin-created accounts must replace their temporary password before
  // they can reach any other screen.
  if (user.mustChangePassword) {
    return <ChangePasswordPage />;
  }

  // If Employee role, redirect default tab away from Dashboard to My Details
  if (user.role === 'Employee' && activeTab === 'dashboard') {
    setActiveTab('my-profile');
  }

  return (
    <div className="min-h-screen bg-[#f6f5fa] dark:bg-[#05040a] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-purple-500/30 selection:text-amber-600 dark:selection:text-amber-200 transition-colors duration-300">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'my-profile' && <MyProfilePage />}
        {activeTab === 'dashboard' && <DashboardPage />}
        {activeTab === 'employees' && <EmployeesPage />}
        {activeTab === 'contracts' && <ContractsPage />}
        {activeTab === 'attendance' && <AttendancePage />}
        {activeTab === 'time-off' && <TimeOffPage />}
        {activeTab === 'salary-structures' && <SalaryStructuresPage />}
        {activeTab === 'payruns' && <PayrunsPage />}
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
