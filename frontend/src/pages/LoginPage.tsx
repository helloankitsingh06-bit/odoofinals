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
  LogIn,
  Crown
} from 'lucide-react';

interface RoleCard {
  role: UserRole;
  title: string;
  name: string;
  email: string;
  desc: string;
  badge: string;
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
      gradient: 'from-purple-500/20 to-purple-950/10 hover:border-purple-400/60',
      icon: <UserCheck className="text-purple-300" size={18} />
    },
    {
      role: 'HRManager',
      title: 'HR Manager',
      name: 'Marcus Sterling',
      email: 'hrmanager@peoplepay360.com',
      desc: 'Employee directory CRUD, contract management, time-off approvals & schedules',
      badge: 'HR Admin',
      gradient: 'from-amber-500/20 to-yellow-950/10 hover:border-amber-400/60',
      icon: <Sliders className="text-amber-300" size={18} />
    },
    {
      role: 'HRPayrollUser',
      title: 'Payroll Specialist',
      name: 'Jordan Reed',
      email: 'payrolluser@peoplepay360.com',
      desc: 'Execute payruns, compute salary rule lines, inspect attendance audit warnings',
      badge: 'Payroll Ops',
      gradient: 'from-purple-500/20 to-violet-950/10 hover:border-purple-400/60',
      icon: <Calculator className="text-purple-300" size={18} />
    },
    {
      role: 'HRPayrollManager',
      title: 'Payroll Director',
      name: 'Sophia Chen',
      email: 'payrollmgr@peoplepay360.com',
      desc: 'Full payroll lifecycle, structure rules configuration, mark as Paid & PDF dispatch',
      badge: 'Full Payroll',
      gradient: 'from-amber-500/25 to-yellow-950/10 hover:border-amber-400/70',
      icon: <Crown className="text-amber-400" size={18} />
    },
    {
      role: 'Admin',
      title: 'System Administrator',
      name: 'Root Admin',
      email: 'admin@peoplepay360.com',
      desc: 'Unrestricted master access, RBAC management, audit trails & security governance',
      badge: 'SuperAdmin',
      gradient: 'from-purple-600/25 to-amber-500/15 hover:border-purple-400/60',
      icon: <ShieldCheck className="text-amber-300" size={18} />
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#040307] text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">

      {/* ===== PREMIUM ANIMATED BACKGROUND ===== */}
      <div className="absolute inset-0 bg-grid-fine pointer-events-none opacity-40 animate-soft-breathe" />
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none opacity-20" />

      {/* Enhanced Animated Glowing Orbs (Gold and Light Purple) */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none animate-float-reverse" />
      <div className="absolute top-10 right-1/3 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none animate-float-slow animation-delay-500" />
      <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

      {/* Rotating Glow Ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-amber-400/10 animate-sparkle-rotate opacity-30 pointer-events-none" />

      {/* Shimmer Lines */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent animate-shimmer" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent animate-shimmer animation-delay-500" />

      {/* ===== MAIN CONTAINER ===== */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-xl">

        {/* ===== TOP HEADER & BRANDING ===== */}
        <div className="text-center mb-6">
          {/* Logo with Enhanced Ambient Glow & Animation */}
          <div className="relative inline-block mb-3 animate-slide-fade-up animation-delay-200">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-purple-400 to-amber-500 rounded-3xl blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse-glow"></div>
            <div className="relative inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-[#0b0914] via-[#151224] to-[#0b0914] border border-amber-400/40 items-center justify-center shadow-2xl shadow-amber-500/20 hover:scale-110 transition-transform duration-500 hover:rotate-3">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-amber-400/15 to-purple-500/15 pointer-events-none"></div>
              <ShieldCheck className="text-amber-400 drop-shadow-[0_0_14px_rgba(251,191,36,0.7)]" size={34} />
            </div>
          </div>

          {/* Title with Gradient Animation */}
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white animate-slide-fade-up animation-delay-300">
            PeoplePay<span className="animate-gradient-text font-black">360</span>
          </h1>
          <p className="mt-1.5 text-xs text-purple-200/70 max-w-md mx-auto">
            {authMode === 'login' 
              ? 'Enter credentials to access your database account' 
              : 'Register a new user account directly into the database'}
          </p>
        </div>

        {/* ===== AUTH MODE TOGGLE TABS ===== */}
        <div className="mb-4 flex p-1 rounded-2xl bg-[#0b0914]/90 border border-purple-900/40 backdrop-blur-md animate-slide-fade-up animation-delay-400">
          <button
            type="button"
            onClick={() => { setAuthMode('login'); setError(null); setSuccessMessage(null); }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
              authMode === 'login'
                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/25'
                : 'text-purple-300/70 hover:text-white hover:bg-purple-950/40'
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
                ? 'bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600 text-white font-black shadow-lg shadow-purple-500/25'
                : 'text-purple-300/70 hover:text-white hover:bg-purple-950/40'
            }`}
          >
            <UserPlus size={14} />
            Create Account
          </button>
        </div>

        {/* ===== GLASS CARD BOX ===== */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 transition-all duration-500 hover:shadow-amber-500/10 hover:border-purple-700/60 hover:scale-[1.01] animate-slide-fade-up animation-delay-500 relative overflow-hidden bg-[#0a0812]/85 border border-purple-900/40">

          {/* Card Shimmer Effect */}
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/5 to-transparent animate-shimmer" />
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-5 p-3.5 bg-amber-500/15 border border-amber-400/40 rounded-2xl text-amber-300 text-xs flex items-center gap-2.5 animate-slide-fade-up">
              <CheckCircle2 size={16} className="text-amber-400 shrink-0" />
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
                  <label className="block text-purple-200 font-semibold text-xs mb-1.5 flex items-center gap-1.5">
                    <Mail size={14} className="text-amber-400" />
                    Work Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400 group-focus-within:text-amber-400 transition-colors duration-300">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="name@peoplepay360.com"
                      className="w-full bg-[#06050b]/80 border border-purple-900/50 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-purple-400/40 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all duration-300 shadow-inner hover:border-purple-700/60"
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-400/0 via-amber-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  </div>
                </div>

                <div className="animate-slide-fade-up animation-delay-700">
                  <label className="block text-purple-200 font-semibold text-xs mb-1.5 flex items-center gap-1.5">
                    <Lock size={14} className="text-amber-400" />
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400 group-focus-within:text-amber-400 transition-colors duration-300">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-[#06050b]/80 border border-purple-900/50 rounded-2xl pl-10 pr-11 py-3 text-sm text-white placeholder-purple-400/40 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all duration-300 shadow-inner hover:border-purple-700/60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-purple-400 hover:text-amber-300 transition-all duration-300 hover:scale-110"
                      title={showLoginPassword ? "Hide password" : "Show password"}
                    >
                      {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400/0 via-purple-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !!loadingRole}
                  className="relative group overflow-hidden w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 disabled:opacity-60 text-slate-950 rounded-2xl text-xs font-black shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-[0.97] transition-all duration-300 flex items-center justify-center gap-2 mt-2 cursor-pointer animate-slide-fade-up animation-delay-800"
                >
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

                  {isLoading && !loadingRole ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></div>
                      <span>Verifying Database Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span className="relative z-10">Sign In to Platform</span>
                      <ArrowRight size={15} className="relative z-10 group-hover:translate-x-1 transition-transform duration-300 text-slate-950" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Demo Switcher Section */}
              <div className="mt-8 pt-6 border-t border-purple-900/40">
                <div className="flex items-center justify-between mb-3.5 animate-slide-fade-up animation-delay-900">
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    1-Click Evaluator Roles
                  </span>
                  <span className="text-[10px] text-purple-300/60">Pre-seeded accounts</span>
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
                        className={`w-full p-3 rounded-2xl bg-[#07050d]/80 border border-purple-900/40 hover:bg-[#120f20] hover:shadow-lg transition-all duration-500 cursor-pointer group flex items-center justify-between ${d.gradient} animate-slide-fade-up hover:scale-[1.02] active:scale-[0.98]`}
                        style={{ animationDelay: `${delay}ms` }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-xl bg-[#0e0c18] border border-purple-900/40 transition-all duration-500 ${isHovered ? 'scale-110 rotate-6 shadow-lg shadow-amber-500/20 border-amber-400/40' : ''}`}>
                            {d.icon}
                          </div>
                          <div className="min-w-0 text-left">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold text-white transition-all duration-300 ${isHovered ? 'text-amber-300' : ''}`}>
                                {d.title}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#161324] text-purple-200 border border-purple-800/60 font-mono font-medium shrink-0">
                                {d.badge}
                              </span>
                              <span className="text-[11px] text-purple-400/70 truncate hidden sm:inline">
                                • {d.name}
                              </span>
                            </div>
                            <div className="text-[11px] text-purple-300/70 mt-0.5 line-clamp-1">
                              {d.desc}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          {isThisLoading ? (
                            <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></div>
                          ) : (
                            <div className={`h-7 w-7 rounded-xl bg-[#0f0d1a] border border-purple-900/40 flex items-center justify-center text-purple-400 transition-all duration-300 ${isHovered ? 'text-amber-300 border-amber-400/60 bg-amber-500/10 scale-110 shadow-lg shadow-amber-500/20' : ''}`}>
                              <ArrowRight size={13} className={`transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
                            </div>
                          )}
                        </div>
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
                  <label className="block text-purple-200 font-semibold text-xs mb-1.5 flex items-center gap-1.5">
                    <User size={14} className="text-amber-400" />
                    Full Name
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400 group-focus-within:text-amber-400 transition-colors duration-300">
                      <User size={16} />
                    </div>
                    <input
                      type="text"
                      required
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full bg-[#06050b]/80 border border-purple-900/50 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-purple-400/40 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all duration-300 shadow-inner hover:border-purple-700/60"
                    />
                  </div>
                </div>

                {/* Work Email */}
                <div className="animate-slide-fade-up animation-delay-700">
                  <label className="block text-purple-200 font-semibold text-xs mb-1.5 flex items-center gap-1.5">
                    <Mail size={14} className="text-amber-400" />
                    Work Email (Unique in Database)
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400 group-focus-within:text-amber-400 transition-colors duration-300">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="alex.morgan@company.com"
                      className="w-full bg-[#06050b]/80 border border-purple-900/50 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-purple-400/40 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all duration-300 shadow-inner hover:border-purple-700/60"
                    />
                  </div>
                </div>

                {/* Role Selector */}
                <div className="animate-slide-fade-up animation-delay-800">
                  <label className="block text-purple-200 font-semibold text-xs mb-1.5 flex items-center gap-1.5">
                    <Sliders size={14} className="text-amber-400" />
                    Account Role
                  </label>
                  <select
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value as UserRole)}
                    className="w-full bg-[#06050b]/80 border border-purple-900/50 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all duration-300 shadow-inner hover:border-purple-700/60"
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
                    <label className="block text-purple-200 font-semibold text-xs mb-1.5 flex items-center gap-1.5">
                      <Lock size={14} className="text-amber-400" />
                      Password
                    </label>
                    <div className="relative group">
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        required
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#06050b]/80 border border-purple-900/50 rounded-2xl pl-4 pr-10 py-3 text-sm text-white placeholder-purple-400/40 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all duration-300 shadow-inner hover:border-purple-700/60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-400 hover:text-amber-300 transition"
                      >
                        {showSignupPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-purple-200 font-semibold text-xs mb-1.5 flex items-center gap-1.5">
                      <Lock size={14} className="text-amber-400" />
                      Confirm Password
                    </label>
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      required
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#06050b]/80 border border-purple-900/50 rounded-2xl px-4 py-3 text-sm text-white placeholder-purple-400/40 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all duration-300 shadow-inner hover:border-purple-700/60"
                    />
                  </div>
                </div>

                {/* Create Account Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative group overflow-hidden w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600 hover:from-purple-500 hover:to-fuchsia-400 disabled:opacity-60 text-white rounded-2xl text-xs font-black shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 active:scale-[0.97] transition-all duration-300 flex items-center justify-center gap-2 mt-4 cursor-pointer animate-slide-fade-up animation-delay-1000"
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

              <div className="mt-5 text-center text-xs text-purple-300/70">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-amber-400 font-bold hover:underline"
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