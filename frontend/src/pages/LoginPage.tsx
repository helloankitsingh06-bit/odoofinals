import React, { useState } from 'react';
import { useAuth, UserRole } from '../context/AuthContext';
import {
  ShieldCheck,
  ArrowRight,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  UserCheck,
  Calculator,
  Sliders,
  Zap,
  CheckCircle2,
  UserPlus,
  LogIn
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
  const { login, register, switchRoleQuick, isLoading } = useAuth();
  
  // Tab state: 'login' | 'signup'
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('payrollmgr@peoplepay360.com');
  const [loginPassword, setLoginPassword] = useState('Password123!');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Sign up form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('Employee');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);

  // Handle Sign In (Strictly database verified)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    try {
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      setError(err.message || 'Login failed. Only registered database users can log in.');
    }
  };

  // Handle Sign Up (Saves directly to Database via Prisma)
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (signupPassword !== signupConfirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      await register(signupName, signupEmail, signupPassword, signupRole);
      setSuccessMessage('Account created successfully in database!');
    } catch (err: any) {
      setError(err.message || 'Registration failed. User may already exist in database.');
    }
  };

  const handleRoleQuickLogin = async (role: UserRole) => {
    setError(null);
    setSuccessMessage(null);
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

      {/* ===== PREMIUM ANIMATED BACKGROUND ===== */}
      <div className="absolute inset-0 bg-grid-fine pointer-events-none opacity-40 animate-soft-breathe" />
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none opacity-20" />

      {/* Enhanced Animated Glowing Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none animate-float-reverse" />
      <div className="absolute top-10 right-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-float-slow animation-delay-500" />
      <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

      {/* Rotating Glow Ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-white/5 animate-sparkle-rotate opacity-20 pointer-events-none" />

      {/* Shimmer Lines */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent animate-shimmer" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent animate-shimmer animation-delay-500" />

      {/* ===== MAIN CONTAINER ===== */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-xl">

        {/* ===== TOP HEADER & BRANDING ===== */}
        <div className="text-center mb-6">
          {/* Logo with Enhanced Ambient Glow & Animation */}
          <div className="relative inline-block mb-3 animate-slide-fade-up animation-delay-200">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-3xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse-glow"></div>
            <div className="relative inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-emerald-500/30 items-center justify-center shadow-2xl shadow-emerald-500/20 hover:scale-110 transition-transform duration-500 hover:rotate-3">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-transparent pointer-events-none"></div>
              <ShieldCheck className="text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]" size={34} />
            </div>
          </div>

          {/* Title with Gradient Animation */}
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white animate-slide-fade-up animation-delay-300">
            PeoplePay<span className="animate-gradient-text font-black">360</span>
          </h1>
          <p className="mt-1.5 text-xs text-slate-400 max-w-md mx-auto">
            {authMode === 'login' 
              ? 'Enter credentials to access your database account' 
              : 'Register a new user account directly into the database'}
          </p>
        </div>

        {/* ===== AUTH MODE TOGGLE TABS ===== */}
        <div className="mb-4 flex p-1 rounded-2xl bg-slate-950/80 border border-slate-800/90 backdrop-blur-md animate-slide-fade-up animation-delay-400">
          <button
            type="button"
            onClick={() => { setAuthMode('login'); setError(null); setSuccessMessage(null); }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
              authMode === 'login'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <LogIn size={14} />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('signup'); setError(null); setSuccessMessage(null); }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
              authMode === 'signup'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <UserPlus size={14} />
            Create Account
          </button>
        </div>

        {/* ===== GLASS CARD BOX ===== */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 transition-all duration-500 hover:shadow-emerald-500/5 hover:border-slate-700/80 hover:scale-[1.01] animate-slide-fade-up animation-delay-500 relative overflow-hidden">

          {/* Card Shimmer Effect */}
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-5 p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs flex items-center gap-2.5 animate-slide-fade-up">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Message with Slide Animation */}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center gap-2.5 animate-slide-fade-up">
              <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0 animate-pulse-glow"></div>
              <span>{error}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 1: SIGN IN FORM (Only DB users allowed) */}
          {/* ======================================================== */}
          {authMode === 'login' ? (
            <div>
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="animate-slide-fade-up animation-delay-600">
                  <label className="block text-slate-300 font-semibold text-xs mb-1.5 flex items-center gap-1.5">
                    <Mail size={14} className="text-emerald-400" />
                    Work Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors duration-300">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="name@peoplepay360.com"
                      className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-300 shadow-inner hover:border-slate-600"
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400/0 via-emerald-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  </div>
                </div>

                <div className="animate-slide-fade-up animation-delay-700">
                  <label className="block text-slate-300 font-semibold text-xs mb-1.5 flex items-center gap-1.5">
                    <Lock size={14} className="text-emerald-400" />
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors duration-300">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl pl-10 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-300 shadow-inner hover:border-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-all duration-300 hover:scale-110"
                      title={showLoginPassword ? "Hide password" : "Show password"}
                    >
                      {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/0 via-cyan-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !!loadingRole}
                  className="relative group overflow-hidden w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-60 text-white rounded-2xl text-xs font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-[0.97] transition-all duration-300 flex items-center justify-center gap-2 mt-2 cursor-pointer animate-slide-fade-up animation-delay-800"
                >
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-white/10 to-teal-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />

                  {isLoading && !loadingRole ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Verifying Database Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span className="relative z-10">Sign In to Platform</span>
                      <ArrowRight size={15} className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Demo Switcher Section */}
              <div className="mt-8 pt-6 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-3.5 animate-slide-fade-up animation-delay-900">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    1-Click Evaluator Roles
                  </span>
                  <span className="text-[10px] text-slate-500">Pre-seeded accounts</span>
                </div>

                <div className="space-y-2.5">
                  {demoRoles.map((d, index) => {
                    const isThisLoading = loadingRole === d.role;
                    const isHovered = hoveredRole === d.role;
                    const delay = 900 + (index * 100);

                    return (
                      <div
                        key={d.role}
                        onClick={() => handleRoleQuickLogin(d.role)}
                        onMouseEnter={() => setHoveredRole(d.role)}
                        onMouseLeave={() => setHoveredRole(null)}
                        role="button"
                        tabIndex={0}
                        className={`w-full p-3 rounded-2xl bg-slate-950/60 border border-slate-800/90 hover:bg-slate-900/80 hover:shadow-lg transition-all duration-500 cursor-pointer group flex items-center justify-between ${d.gradient} animate-slide-fade-up hover:scale-[1.02] active:scale-[0.98]`}
                        style={{ animationDelay: `${delay}ms` }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-xl bg-slate-900 border border-slate-800 transition-all duration-500 ${isHovered ? 'scale-110 rotate-6 shadow-lg shadow-emerald-500/20' : ''}`}>
                            {d.icon}
                          </div>
                          <div className="min-w-0 text-left">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold text-white transition-all duration-300 ${isHovered ? 'text-emerald-400' : ''}`}>
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
                            <div className={`h-7 w-7 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-500 transition-all duration-300 ${isHovered ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10 scale-110 shadow-lg shadow-emerald-500/20' : ''}`}>
                              <ArrowRight size={13} className={`transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
                            </div>
                          )}
                        </div>

                        {/* Role Card Glow Effect on Hover */}
                        {isHovered && (
                          <div className="absolute inset-0 rounded-2xl pointer-events-none">
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400/0 via-emerald-400/5 to-cyan-400/0 animate-shimmer" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* TAB 2: SIGN UP FORM (Direct Database Persistence) */
            /* ======================================================== */
            <div>
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                
                {/* Full Name */}
                <div className="animate-slide-fade-up animation-delay-600">
                  <label className="block text-slate-300 font-semibold text-xs mb-1.5 flex items-center gap-1.5">
                    <User size={14} className="text-emerald-400" />
                    Full Name
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors duration-300">
                      <User size={16} />
                    </div>
                    <input
                      type="text"
                      required
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-300 shadow-inner hover:border-slate-600"
                    />
                  </div>
                </div>

                {/* Work Email */}
                <div className="animate-slide-fade-up animation-delay-700">
                  <label className="block text-slate-300 font-semibold text-xs mb-1.5 flex items-center gap-1.5">
                    <Mail size={14} className="text-emerald-400" />
                    Work Email (Unique in Database)
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors duration-300">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="alex.morgan@company.com"
                      className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-300 shadow-inner hover:border-slate-600"
                    />
                  </div>
                </div>

                {/* Role Selector */}
                <div className="animate-slide-fade-up animation-delay-800">
                  <label className="block text-slate-300 font-semibold text-xs mb-1.5 flex items-center gap-1.5">
                    <Sliders size={14} className="text-emerald-400" />
                    Account Role
                  </label>
                  <select
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value as UserRole)}
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-300 shadow-inner hover:border-slate-600"
                  >
                    <option value="Employee">Employee (Self-Service Attendance & Leave)</option>
                    <option value="HRManager">HR Manager (Employee CRUD & Contracts)</option>
                    <option value="HRPayrollUser">Payroll Specialist (Payruns & Calculations)</option>
                    <option value="HRPayrollManager">Payroll Director (Salary Rules & Payouts)</option>
                    <option value="Admin">System Administrator (Full Platform Access)</option>
                  </select>
                </div>

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-slide-fade-up animation-delay-900">
                  <div>
                    <label className="block text-slate-300 font-semibold text-xs mb-1.5 flex items-center gap-1.5">
                      <Lock size={14} className="text-emerald-400" />
                      Password
                    </label>
                    <div className="relative group">
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        required
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl pl-4 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-300 shadow-inner hover:border-slate-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition"
                      >
                        {showSignupPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold text-xs mb-1.5 flex items-center gap-1.5">
                      <Lock size={14} className="text-emerald-400" />
                      Confirm Password
                    </label>
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      required
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-300 shadow-inner hover:border-slate-600"
                    />
                  </div>
                </div>

                {/* Create Account Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative group overflow-hidden w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-60 text-white rounded-2xl text-xs font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-[0.97] transition-all duration-300 flex items-center justify-center gap-2 mt-4 cursor-pointer animate-slide-fade-up animation-delay-1000"
                >
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Registering in Database...</span>
                    </>
                  ) : (
                    <>
                      <span className="relative z-10">Register & Create Database Account</span>
                      <ArrowRight size={15} className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 text-center text-xs text-slate-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-emerald-400 font-bold hover:underline"
                >
                  Sign In here
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};