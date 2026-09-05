import React from 'react';
import { useAuth, UserRole } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import {
  Users,
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  PieChart,
  Layers,
  LogOut,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  Employee: 'Employee (Self-Service)',
  HRManager: 'HR Manager',
  HRPayrollUser: 'Payroll Specialist',
  HRPayrollManager: 'Payroll Director',
  Admin: 'System Administrator'
};

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: PieChart, roles: ['HRManager', 'HRPayrollUser', 'HRPayrollManager', 'Admin'] },
    { id: 'employees', label: 'Employees Hub', icon: Users, roles: ['HRManager', 'HRPayrollUser', 'HRPayrollManager', 'Admin'] },
    { id: 'contracts', label: 'Contracts', icon: Briefcase, roles: ['HRManager', 'HRPayrollUser', 'HRPayrollManager', 'Admin'] },
    { id: 'attendance', label: 'Attendance', icon: Clock, roles: ['Employee', 'HRManager', 'HRPayrollUser', 'HRPayrollManager', 'Admin'] },
    { id: 'time-off', label: 'Time Off', icon: Calendar, roles: ['Employee', 'HRManager', 'HRPayrollUser', 'HRPayrollManager', 'Admin'] },
    { id: 'salary-structures', label: 'Salary Rules', icon: Layers, roles: ['HRManager', 'HRPayrollUser', 'HRPayrollManager', 'Admin'] },
    { id: 'payruns', label: 'Payruns & Payslips', icon: DollarSign, roles: ['HRPayrollUser', 'HRPayrollManager', 'Admin'] },
  ];

  const visibleNavItems = navItems.filter(item =>
    !user || item.roles.includes(user.role)
  );

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#08070d]/90 backdrop-blur-2xl border-b border-purple-100 dark:border-purple-900/30 shadow-md dark:shadow-2xl transition-colors duration-300">
      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-purple-500 to-amber-400 rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-100 to-amber-50 dark:from-[#0a0812] dark:to-[#181528] border border-amber-400/40 flex items-center justify-center shadow-lg shadow-amber-500/10">
                <ShieldCheck className="text-amber-500 dark:text-amber-400" size={20} />
              </div>
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-0.5">
                PeoplePay<span className="text-amber-500 dark:text-amber-400 font-black">360</span>
              </span>
              <span className="block text-[9px] text-purple-600/70 dark:text-purple-300/60 -mt-1 font-semibold tracking-wider uppercase">ENTERPRISE HR & PAYROLL</span>
            </div>
          </div>

          <nav className="hidden lg:flex space-x-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-100 to-amber-50 dark:from-purple-500/25 dark:to-amber-500/15 text-purple-900 dark:text-amber-200 border border-purple-300 dark:border-amber-400/40 shadow-sm shadow-purple-500/10 font-bold'
                      : 'text-slate-600 dark:text-purple-200/60 hover:text-slate-950 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-purple-950/30'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-amber-500 dark:text-amber-400' : 'text-purple-500 dark:text-purple-400/70'} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center space-x-3">
            <ThemeToggle size="sm" />
            {user ? (
              <div className="flex items-center gap-3 pl-1">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-800 dark:text-purple-100">{user.name}</div>
                  <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">{ROLE_DISPLAY_NAMES[user.role] || user.role}</div>
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#12101e] border border-slate-200 dark:border-purple-900/40 text-slate-600 dark:text-purple-300 hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-400 dark:hover:border-rose-500/40 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition shadow-sm cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                >
                  <LogOut size={15} />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};

