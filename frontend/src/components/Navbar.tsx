import React from 'react';
import { useAuth, UserRole } from '../context/AuthContext';
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
  Zap,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout, switchRoleQuick } = useAuth();

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

  const rolesList: { role: UserRole; label: string; badgeColor: string }[] = [
    { role: 'Employee', label: 'Employee', badgeColor: 'hover:border-purple-400/50 hover:text-purple-300' },
    { role: 'HRManager', label: 'HR Manager', badgeColor: 'hover:border-amber-400/50 hover:text-amber-300' },
    { role: 'HRPayrollUser', label: 'Payroll Specialist', badgeColor: 'hover:border-purple-400/50 hover:text-purple-300' },
    { role: 'HRPayrollManager', label: 'Payroll Director', badgeColor: 'hover:border-amber-400/50 hover:text-amber-300' },
    { role: 'Admin', label: 'Admin', badgeColor: 'hover:border-purple-400/50 hover:text-purple-300' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#08070d]/90 backdrop-blur-2xl border-b border-purple-900/30 shadow-2xl">
      {/* Top Demo Bar */}
      <div className="bg-[#040307] px-4 py-1.5 text-xs flex flex-wrap items-center justify-between border-b border-purple-950/80 text-slate-400">
        <div className="flex items-center space-x-2.5">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
          </span>
          <span className="font-semibold text-amber-300 tracking-wide flex items-center gap-1">
            <Sparkles size={12} className="text-purple-400" />
            PeoplePay360 Relational Engine
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-purple-300/70 text-[11px] hidden sm:inline">PostgreSQL / Prisma Relational Architecture</span>
        </div>

        <div className="flex items-center space-x-2 py-0.5">
          <span className="text-amber-300/80 flex items-center gap-1 font-medium text-[11px]">
            <Zap size={13} className="text-amber-400" /> Switch Role:
          </span>
          <div className="flex items-center gap-1">
            {rolesList.map((r) => (
              <button
                key={r.role}
                onClick={() => switchRoleQuick(r.role)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all border ${
                  user?.role === r.role
                    ? 'bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-200 border-amber-400/60 shadow-sm shadow-amber-500/20'
                    : 'bg-[#0f0d18] text-slate-400 border-purple-900/40 ' + r.badgeColor
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-purple-500 to-amber-400 rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative h-9 w-9 rounded-xl bg-gradient-to-tr from-[#0a0812] to-[#181528] border border-amber-400/40 flex items-center justify-center shadow-lg shadow-amber-500/10">
                <ShieldCheck className="text-amber-400" size={20} />
              </div>
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-white flex items-center gap-0.5">
                PeoplePay<span className="text-amber-400 font-black">360</span>
              </span>
              <span className="block text-[9px] text-purple-300/60 -mt-1 font-semibold tracking-wider uppercase">ENTERPRISE HR & PAYROLL</span>
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
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-500/25 to-amber-500/15 text-amber-200 border border-amber-400/40 shadow-sm shadow-purple-500/20'
                      : 'text-purple-200/60 hover:text-white hover:bg-purple-950/30'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-amber-400' : 'text-purple-400/70'} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-purple-100">{user.name}</div>
                  <div className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">{user.role}</div>
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-2 rounded-xl bg-[#12101e] border border-purple-900/40 text-purple-300 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition shadow-sm"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
