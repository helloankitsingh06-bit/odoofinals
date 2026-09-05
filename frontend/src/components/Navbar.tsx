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
    { role: 'Employee', label: 'Employee', badgeColor: 'hover:border-emerald-500/50 hover:text-emerald-400' },
    { role: 'HRManager', label: 'HR Manager', badgeColor: 'hover:border-cyan-500/50 hover:text-cyan-400' },
    { role: 'HRPayrollUser', label: 'Payroll Specialist', badgeColor: 'hover:border-amber-500/50 hover:text-amber-400' },
    { role: 'HRPayrollManager', label: 'Payroll Director', badgeColor: 'hover:border-purple-500/50 hover:text-purple-400' },
    { role: 'Admin', label: 'Admin', badgeColor: 'hover:border-rose-500/50 hover:text-rose-400' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
      {/* Top Demo Bar */}
      <div className="bg-slate-950 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between border-b border-slate-900 text-slate-400">
        <div className="flex items-center space-x-2.5">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-emerald-400 tracking-wide">PeoplePay360 Relational Engine</span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400 text-[11px] hidden sm:inline">PostgreSQL / Prisma Relational Architecture</span>
        </div>

        <div className="flex items-center space-x-2 py-0.5">
          <span className="text-slate-400 flex items-center gap-1 font-medium text-[11px]">
            <Zap size={13} className="text-amber-400" /> Switch Role:
          </span>
          <div className="flex items-center gap-1">
            {rolesList.map((r) => (
              <button
                key={r.role}
                onClick={() => switchRoleQuick(r.role)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all border ${
                  user?.role === r.role
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-900/90 text-slate-400 border-slate-800 ' + r.badgeColor
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
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative h-9 w-9 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <ShieldCheck className="text-emerald-400" size={20} />
              </div>
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-white flex items-center gap-0.5">
                PeoplePay<span className="text-emerald-400 font-black">360</span>
              </span>
              <span className="block text-[9px] text-slate-400 -mt-1 font-semibold tracking-wider uppercase">ENTERPRISE HR & PAYROLL</span>
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
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-emerald-400' : 'text-slate-500'} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-200">{user.name}</div>
                  <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">{user.role}</div>
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition shadow-sm"
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
