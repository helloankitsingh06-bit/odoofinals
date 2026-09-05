import React, { useState, useEffect } from 'react';
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

// Only actual Employee-role users land on their personal portal by default.
// Every management role (Admin / HRManager / HRPayrollUser / HRPayrollManager)
// lands on the Dashboard, regardless of whether they have a linked employeeId.
const defaultTabForRole = (role?: string): string =>
  role === 'Employee' ? 'my-profile' : 'dashboard';

// Tabs an Employee-role user is ever allowed to see. Anything else (dashboard,
// employees, payruns, …) is clamped back to their portal so a management page
// never even mounts for them — not even for a single transient render.
const EMPLOYEE_TABS = new Set(['my-profile', 'attendance', 'time-off']);

const resolveTab = (role: string | undefined, tab: string): string => {
  if (role === 'Employee' && !EMPLOYEE_TABS.has(tab)) return 'my-profile';
  return tab;
};

const MainApp: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(defaultTabForRole(user?.role));

  // Reset the landing tab whenever the signed-in user changes (login / role switch),
  // so a stale tab from a previous session never carries over.
  useEffect(() => {
    if (user) setActiveTab(defaultTabForRole(user.role));
  }, [user?.id]);

  // Resolve at render time too, so the correct page renders on the very first
  // paint after the user loads (before the effect above has a chance to run).
  const currentTab = resolveTab(user?.role, activeTab);

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

  return (
    <div className="min-h-screen bg-[#f6f5fa] dark:bg-[#05040a] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-purple-500/30 selection:text-amber-600 dark:selection:text-amber-200 transition-colors duration-300">
      <Navbar activeTab={currentTab} setActiveTab={setActiveTab} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'my-profile' && <MyProfilePage />}
        {currentTab === 'dashboard' && <DashboardPage />}
        {currentTab === 'employees' && <EmployeesPage />}
        {currentTab === 'contracts' && <ContractsPage />}
        {currentTab === 'attendance' && <AttendancePage />}
        {currentTab === 'time-off' && <TimeOffPage />}
        {currentTab === 'salary-structures' && <SalaryStructuresPage />}
        {currentTab === 'payruns' && <PayrunsPage />}
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
