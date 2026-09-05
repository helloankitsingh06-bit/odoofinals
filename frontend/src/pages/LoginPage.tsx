import React, { useState } from 'react';
import { useAuth, UserRole } from '../context/AuthContext';
import { 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  Mail, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Zap, 
  UserCheck, 
  Calculator, 
  Cpu, 
  CheckCircle2,
  FileCheck2,
  Sliders
} from 'lucide-react';

interface RoleCard {
  role: UserRole;
  title: string;
  name: string;
  email: string;
  desc: string;
  badge: string;
  color: string;
  gradient: string;
  icon: React.ReactNode;
}

export const LoginPage: React.FC = () => {
  const { login, switchRoleQuick, isLoading } = useAuth();
  const [email, setEmail] = useState('payrollmgr@peoplepay360.com');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    }
  };

  const handleRoleQuickLogin = async (role: UserRole) => {
    setError(null);
    setLoadingRole(role);
    try {
      await switchRoleQuick(role);
    } catch (err: any) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoadingRole(null);
    }
  };

  const demoRoles: RoleCard[] = [
    { 
      role: 'Employee', 
      title: 'Employee Portal', 
      name: 'Devon Hayes',
      email: 'employee@peoplepay360.com', 
      desc: 'Self-service dashboard, punch clock, time-off requests & personal payslips', 
      badge: 'Self-Service',
      color: 'emerald',
      gradient: 'from-emerald-500/20 to-teal-500/5 hover:border-emerald-500/50',
      icon: <UserCheck className="text-emerald-400" size={18} />
    },
    { 
      role: 'HRManager', 
      title: 'HR Manager', 
      name: 'Marcus Sterling',
      email: 'hrmanager@peoplepay360.com', 
      desc: 'Employee directory CRUD, contract management, time-off approvals & schedules', 
      badge: 'HR Admin',
      color: 'cyan',
      gradient: 'from-cyan-500/20 to-blue-500/5 hover:border-cyan-500/50',
      icon: <Sliders className="text-cyan-400" size={18} />
    },
    { 
      role: 'HRPayrollUser', 
      title: 'Payroll Specialist', 
      name: 'Jordan Reed',
      email: 'payrolluser@peoplepay360.com', 
      desc: 'Execute payruns, compute salary rule lines, inspect attendance audit warnings', 
      badge: 'Payroll Ops',
      color: 'amber',
      gradient: 'from-amber-500/20 to-yellow-500/5 hover:border-amber-500/50',
      icon: <Calculator className="text-amber-400" size={18} />
    },
    { 
      role: 'HRPayrollManager', 
      title: 'Payroll Director', 
      name: 'Sophia Chen',
      email: 'payrollmgr@peoplepay360.com', 
      desc: 'Full payroll lifecycle, structure rules configuration, mark as Paid & PDF dispatch', 
      badge: 'Full Payroll',
      color: 'purple',
      gradient: 'from-purple-500/20 to-indigo-500/5 hover:border-purple-500/50',
      icon: <Zap className="text-purple-400" size={18} />
    },
    { 
      role: 'Admin', 
      title: 'System Administrator', 
      name: 'Root Admin',
      email: 'admin@peoplepay360.com', 
      desc: 'Unrestricted master access, RBAC management, audit trails & security governance', 
      badge: 'SuperAdmin',
      color: 'rose',
      gradient: 'from-rose-500/20 to-red-500/5 hover:border-rose-500/50',
      icon: <ShieldCheck className="text-rose-400" size={18} />
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Animated Ambient Lights & Grid */}
      <div className="absolute inset-0 bg-grid-fine pointer-events-none opacity-40"></div>
      
      {/* Animated Glowing Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none animate-float-slow"></div>
      <div className="absolute top-10 right-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-float-reverse"></div>

      {/* Main Container */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-xl">
        
        {/* Top Header & Branding */}
        <div className="text-center mb-8">
          {/* Glowing Status Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs font-medium text-slate-300 mb-4 shadow-inner backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="tracking-wide">Deterministic Payroll Engine v2.4 Active</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Sparkles size={12} /> Hackathon Ready
            </span>
          </div>

          {/* Logo with Ambient Glow */}
          <div className="relative inline-block mb-3">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-3xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-emerald-500/30 items-center justify-center shadow-2xl shadow-emerald-500/20">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-transparent pointer-events-none"></div>
              <ShieldCheck className="text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]" size={34} />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            PeoplePay<span className="animate-gradient-text font-black">360</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
            Next-Gen Non-Firebase Relational HR & Enterprise Payroll Engine
          </p>

          {/* Feature Highlight Badges */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400">
            <span className="px-2.5 py-0.5 rounded-md bg-slate-900/60 border border-slate-800 text-slate-300 flex items-center gap-1">
              <Cpu size={12} className="text-teal-400" /> Pure AST Parser
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-slate-900/60 border border-slate-800 text-slate-300 flex items-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-400" /> Relational RBAC
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-slate-900/60 border border-slate-800 text-slate-300 flex items-center gap-1">
              <FileCheck2 size={12} className="text-indigo-400" /> Instant PDF Engine
            </span>
          </div>
        </div>

        {/* Glass Card Box */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 transition-all duration-300 hover:shadow-emerald-500/5 hover:border-slate-700/80">
          
          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn">
              <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0"></div>
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-300 font-semibold text-xs mb-1.5 flex items-center justify-between">
                <span>Work Email</span>
                <span className="text-[10px] text-slate-500 font-normal">Pre-seeded accounts available</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@peoplepay360.com"
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold text-xs mb-1.5 flex items-center justify-between">
                <span>Password</span>
                <span className="text-[10px] text-slate-400 font-mono">Password123!</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl pl-10 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !!loadingRole}
              className="relative group overflow-hidden w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-60 text-white rounded-2xl text-xs font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              {isLoading && !loadingRole ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Authenticating Session...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Platform</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher Section */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap size={13} className="text-amber-400" />
                1-Click Evaluator Roles (Pre-Seeded)
              </span>
              <span className="text-[10px] text-slate-500">Tap to instantly switch</span>
            </div>

            <div className="space-y-2.5">
              {demoRoles.map((d) => {
                const isThisLoading = loadingRole === d.role;
                return (
                  <div
                    key={d.role}
                    onClick={() => handleRoleQuickLogin(d.role)}
                    role="button"
                    tabIndex={0}
                    className={`w-full p-3 rounded-2xl bg-slate-950/60 border border-slate-800/90 hover:bg-slate-900/80 hover:shadow-lg transition-all duration-200 cursor-pointer group flex items-center justify-between ${d.gradient}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 group-hover:scale-105 transition-transform shrink-0">
                        {d.icon}
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition truncate">
                            {d.title}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700 font-mono font-medium shrink-0">
                            {d.badge}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate hidden sm:inline">
                            • {d.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {d.desc}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {isThisLoading ? (
                        <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></div>
                      ) : (
                        <div className="h-7 w-7 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-emerald-400 group-hover:border-emerald-500/40 group-hover:bg-emerald-500/10 transition-all">
                          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Security & Architecture Footer */}
          <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>PostgreSQL & Prisma Relational Integrity</span>
            </div>
            <span>JWT Session Auth</span>
          </div>

        </div>

      </div>
    </div>
  );
};
