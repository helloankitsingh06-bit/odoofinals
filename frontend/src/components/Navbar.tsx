import React, { useState } from 'react';
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
  UserCheck,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  Employee: 'Self-Service',
  HRManager: 'HR Manager',
  HRPayrollUser: 'Payroll Ops',
  HRPayrollManager: 'Payroll Director',
  Admin: 'Administrator'
};

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'my-profile', label: 'My Portal', icon: UserCheck, roles: ['Employee'] },
    { id: 'dashboard', label: 'Dashboard', icon: PieChart, roles: ['HRManager', 'HRPayrollUser', 'HRPayrollManager', 'Admin'] },
    { id: 'employees', label: 'Employees', icon: Users, roles: ['HRManager', 'HRPayrollUser', 'HRPayrollManager', 'Admin'] },
    { id: 'contracts', label: 'Contracts', icon: Briefcase, roles: ['HRManager', 'HRPayrollUser', 'HRPayrollManager', 'Admin'] },
    { id: 'attendance', label: 'Attendance', icon: Clock, roles: ['Employee', 'HRManager', 'HRPayrollUser', 'HRPayrollManager', 'Admin'] },
    { id: 'time-off', label: 'Time Off', icon: Calendar, roles: ['Employee', 'HRManager', 'HRPayrollUser', 'HRPayrollManager', 'Admin'] },
    { id: 'salary-structures', label: 'Salary Rules', icon: Layers, roles: ['HRManager', 'HRPayrollUser', 'HRPayrollManager', 'Admin'] },
    { id: 'payruns', label: 'Payroll & Payslips', icon: DollarSign, roles: ['HRPayrollUser', 'HRPayrollManager', 'Admin'] },
  ];

  const visibleNavItems = navItems.filter(item =>
    !user || item.roles.includes(user.role)
  );

  const userInitials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-[#08070e]/85 backdrop-blur-2xl border-b border-slate-200/80 dark:border-white/[0.07] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-600 p-[1.5px] shadow-sm shadow-purple-500/10">
              <div className="h-full w-full rounded-[10px] bg-[#0c0915] flex items-center justify-center">
                <ShieldCheck className="text-amber-400" size={19} />
              </div>
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-0.5">
                PeoplePay<span className="text-amber-500 dark:text-amber-400 font-black">360</span>
              </span>
              <span className="block text-[9px] font-bold text-slate-400 dark:text-purple-300/50 -mt-1 tracking-widest uppercase">
                ENTERPRISE
              </span>
            </div>
          </div>

          {/* Center Navigation Bar (Desktop) */}
          <nav className="hidden xl:flex items-center p-1 rounded-2xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.05] gap-0.5 shadow-inner">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-white/10 text-slate-950 dark:text-white shadow-sm border border-slate-200/70 dark:border-white/10 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon
                    size={14}
                    className={isActive ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}
                  />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Medium Screen Navigation (Horizontal Scrollable Strip) */}
          <nav className="hidden md:flex xl:hidden items-center overflow-x-auto py-1 gap-1 max-w-[480px] no-scrollbar">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white/10 dark:text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-amber-400' : 'opacity-60'} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2.5 shrink-0">
            <ThemeToggle size="sm" />

            {user && (
              <>
                {/* User Identity Pill */}
                <div className="hidden sm:flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-2xl bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.05]">
                  <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-purple-600 to-amber-500 flex items-center justify-center text-white font-bold text-[11px] shadow-sm">
                    {userInitials}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-900 dark:text-white leading-none">
                      {user.name}
                    </div>
                    <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold tracking-wider uppercase mt-0.5">
                      {ROLE_DISPLAY_NAMES[user.role] || user.role}
                    </div>
                  </div>
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={logout}
                  title="Sign out of your session"
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>

                {/* Mobile Menu Toggle Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.06]"
                >
                  {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Dropdown Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200 dark:border-white/[0.07] grid grid-cols-2 gap-1.5 animate-fadeIn">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white/10 dark:text-white font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon size={15} className={isActive ? 'text-amber-400' : 'opacity-60'} />
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
