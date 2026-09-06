import React, { useState } from 'react';
import { useAuth, UserRole } from '../context/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { apiRequest } from '../services/api';
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
  Crown,
  Building2,
  Award,
  Clock,
  Users,
  Sparkles,
  KeyRound,
  X,
  AlertCircle,
  Check
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);

  // Forgot Password state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotStep, setForgotStep] = useState<'form' | 'success'>('form');

  // Handle Forgot Password Open
  const handleOpenForgotPassword = () => {
    setForgotEmail(loginEmail || '');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotError(null);
    setForgotSuccess(null);
    setForgotStep('form');
    setIsForgotModalOpen(true);
  };

  // Handle Forgot Password Submit
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (!forgotEmail.trim()) {
      setForgotError('Please enter your email address.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('New passwords do not match. Please re-enter.');
      return;
    }

    if (forgotNewPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: forgotEmail.trim(),
          newPassword: forgotNewPassword
        })
      });
      setForgotSuccess(res.message || 'Password has been successfully updated in the database!');
      setForgotStep('success');
    } catch (err: any) {
      setForgotError(err.message || 'Failed to reset password. Please verify the email address.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleApplyNewPasswordAndClose = () => {
    if (forgotEmail) setLoginEmail(forgotEmail);
    if (forgotNewPassword) setLoginPassword(forgotNewPassword);
    setIsForgotModalOpen(false);
    setAuthMode('login');
    setSuccessMessage('Password reset complete. You can now sign in.');
  };

  // Handle Sign In
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Sign Up
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

    setIsSubmitting(true);
    try {
      await register(signupName, signupEmail, signupPassword, signupRole);
      setSuccessMessage('Account created successfully in database! Logging you in...');
    } catch (err: any) {
      setError(err.message || 'Registration failed. User may already exist in database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleQuickLogin = async (role: UserRole) => {
    setError(null);
    setSuccessMessage(null);
    setLoadingRole(role);
    try {
      await switchRoleQuick(role);
    } catch (err: any) {
      setError(
        'Database has been reset and this pre-seeded demo user does not exist. Please click the "Register" tab above to create a fresh user account.'
      );
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
      icon: <UserCheck className="text-purple-600 dark:text-purple-300" size={18} />
    },
    {
      role: 'HRManager',
      title: 'HR Manager',
      name: 'Marcus Sterling',
      email: 'hrmanager@peoplepay360.com',
      desc: 'Employee directory CRUD, contract management, time-off approvals & schedules',
      badge: 'HR Admin',
      gradient: 'from-amber-500/20 to-yellow-950/10 hover:border-amber-400/60',
      icon: <Sliders className="text-amber-600 dark:text-amber-300" size={18} />
    },
    {
      role: 'HRPayrollUser',
      title: 'Payroll Specialist',
      name: 'Jordan Reed',
      email: 'payrolluser@peoplepay360.com',
      desc: 'Execute payruns, compute salary rule lines, inspect attendance audit warnings',
      badge: 'Payroll Ops',
      gradient: 'from-purple-500/20 to-violet-950/10 hover:border-purple-400/60',
      icon: <Calculator className="text-purple-600 dark:text-purple-300" size={18} />
    },
    {
      role: 'HRPayrollManager',
      title: 'Payroll Director',
      name: 'Sophia Chen',
      email: 'payrollmgr@peoplepay360.com',
      desc: 'Full payroll lifecycle, structure rules configuration, mark as Paid & PDF dispatch',
      badge: 'Full Payroll',
      gradient: 'from-amber-500/25 to-yellow-950/10 hover:border-amber-400/70',
      icon: <Crown className="text-amber-600 dark:text-amber-400" size={18} />
    },
    {
      role: 'Admin',
      title: 'System Administrator',
      name: 'Root Admin',
      email: 'admin@peoplepay360.com',
      desc: 'Unrestricted master access, RBAC management, audit trails & security governance',
      badge: 'SuperAdmin',
      gradient: 'from-purple-600/25 to-amber-500/15 hover:border-purple-400/60',
      icon: <ShieldCheck className="text-amber-600 dark:text-amber-300" size={18} />
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#f6f5fa] dark:bg-[#040307] text-slate-900 dark:text-slate-100 flex overflow-hidden transition-colors duration-300">

      {/* Floating Theme Switcher at Top Right */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle size="md" />
      </div>

      {/* ===== ANIMATED BACKGROUND ===== */}
      <div className="absolute inset-0 bg-grid-fine pointer-events-none opacity-40 dark:opacity-30" />
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none opacity-20 dark:opacity-10" />

      {/* Ambient Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/15 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-600/20 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none animate-float-reverse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-400/10 dark:bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

      {/* ===== LEFT PANEL - BRANDING ===== */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center items-center px-6 lg:px-10">
        <div className="relative z-10 max-w-lg w-full translate-x-12 lg:translate-x-16 -translate-y-24 lg:-translate-y-32">

          {/* Logo - Centered with flex column */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative inline-block mb-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-purple-600 flex items-center justify-center shadow-2xl shadow-amber-500/30">
                <ShieldCheck className="text-white" size={38} />
              </div>
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-amber-400/30 to-purple-500/30 blur-xl animate-pulse-glow" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                PeoplePay<span className="text-amber-500 dark:text-amber-400 font-black">360</span>
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Enterprise Payroll Platform</p>
            </div>
          </div>

          {/* Stats Grid - Centered */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-900/50 border border-purple-100 dark:border-slate-800/50 hover:border-amber-400/30 transition-all duration-300 shadow-sm hover:shadow-md text-center">
              <div className="text-2xl font-bold text-amber-500 dark:text-amber-400">50K+</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Employees</div>
            </div>
            <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-900/50 border border-purple-100 dark:border-slate-800/50 hover:border-purple-400/30 transition-all duration-300 shadow-sm hover:shadow-md text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">99.9%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Uptime</div>
            </div>
            <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-900/50 border border-purple-100 dark:border-slate-800/50 hover:border-amber-400/30 transition-all duration-300 shadow-sm hover:shadow-md text-center">
              <div className="text-2xl font-bold text-amber-500 dark:text-amber-400">2.5s</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Avg. Payrun</div>
            </div>
          </div>

          {/* Trust Indicators - Centered */}
          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-2">
              <Building2 size={14} className="text-amber-500 dark:text-amber-400/60" />
              Enterprise Ready
            </span>
            <span className="flex items-center gap-2">
              <Award size={14} className="text-purple-600 dark:text-purple-400/60" />
              SOC2 Compliant
            </span>
            <span className="flex items-center gap-2">
              <Clock size={14} className="text-amber-500 dark:text-amber-400/60" />
              24/7 Support
            </span>
          </div>
        </div>
      </div>

      {/* ===== RIGHT PANEL - AUTH ===== */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">

          {/* Tab Switcher */}
          <div className="flex bg-slate-200/60 dark:bg-slate-900/50 rounded-2xl p-1 border border-purple-100 dark:border-slate-800/50 mb-8">
            <button
              onClick={() => { setAuthMode('login'); setError(null); setSuccessMessage(null); }}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${authMode === 'login'
                  ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-lg shadow-amber-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
            >
              <LogIn size={16} />
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode('signup'); setError(null); setSuccessMessage(null); }}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${authMode === 'signup'
                  ? 'bg-gradient-to-r from-purple-600 to-amber-500 text-white shadow-lg shadow-purple-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
            >
              <UserPlus size={16} />
              Register
            </button>
          </div>

          {/* ===== GLASS CARD ===== */}
          <div className="bg-white/90 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-purple-100 dark:border-slate-800/50 shadow-xl dark:shadow-2xl relative overflow-hidden transition-colors duration-300">

            {/* Card Shimmer */}
            <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent animate-shimmer" />
            </div>

            {/* Messages */}
            {successMessage && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-3">
                <CheckCircle2 size={18} className="shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-600 dark:text-rose-400 text-xs sm:text-sm flex items-start gap-3 shadow-sm animate-fadeIn">
                <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1 font-semibold leading-relaxed">{error}</div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 p-0.5 rounded cursor-pointer transition"
                  title="Dismiss"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {/* ===== SIGN IN FORM ===== */}
            {authMode === 'login' ? (
              <div>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome Back</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Sign in to access your dashboard</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60 rounded-xl pl-11 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                        placeholder="you@company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={handleOpenForgotPassword}
                        className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-500 hover:underline font-semibold cursor-pointer transition-colors"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60 rounded-xl pl-11 pr-11 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition cursor-pointer"
                      >
                        {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !!loadingRole}
                    className="relative w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-bold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-md"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>

                {/* Quick Role Access */}
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/50">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Users size={14} className="text-amber-500 dark:text-amber-400" />
                      Quick Access Roles
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Pre-seeded accounts</span>
                  </div>

                  <div className="space-y-2.5">
                    {demoRoles.map((role) => {
                      const isHovered = hoveredRole === role.role;
                      const isThisLoading = loadingRole === role.role;

                      return (
                        <button
                          key={role.role}
                          onClick={() => handleRoleQuickLogin(role.role)}
                          onMouseEnter={() => setHoveredRole(role.role)}
                          onMouseLeave={() => setHoveredRole(null)}
                          className={`w-full p-3 bg-purple-50/50 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900/80 rounded-xl border border-purple-100 dark:border-slate-800/60 hover:border-purple-300 dark:hover:border-slate-700/80 transition-all duration-300 group text-left flex items-center gap-3 cursor-pointer shadow-sm hover:shadow-md ${isHovered ? 'scale-[1.01]' : ''
                            }`}
                        >
                          <div className={`p-2 rounded-lg bg-white dark:bg-slate-800/60 border border-purple-100 dark:border-transparent transition-all duration-300 ${isHovered ? 'scale-110 rotate-6 shadow-sm' : ''
                            }`}>
                            {role.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold transition-colors ${isHovered ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
                                }`}>
                                {role.title}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 dark:bg-slate-800 text-purple-700 dark:text-slate-400 font-mono font-semibold">
                                {role.badge}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                              {role.desc}
                            </p>
                          </div>
                          <div className={`w-8 h-8 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-400 dark:text-slate-500 transition-all duration-300 ${isHovered ? 'text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 scale-110' : ''
                            }`}>
                            {isThisLoading ? (
                              <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                            ) : (
                              <ArrowRight size={14} className={`transition-transform ${isHovered ? 'translate-x-0.5' : ''}`} />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* ===== SIGN UP FORM ===== */
              <div>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create Account</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Register a new user in the database</p>
                </div>

                <form onSubmit={handleSignupSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        type="text"
                        required
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60 rounded-xl pl-11 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60 rounded-xl pl-11 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium"
                        placeholder="john@company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Role
                    </label>
                    <select
                      value={signupRole}
                      onChange={(e) => setSignupRole(e.target.value as UserRole)}
                      className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium cursor-pointer"
                    >
                      <option value="Employee">Employee</option>
                      <option value="HRManager">HR Manager</option>
                      <option value="HRPayrollUser">Payroll Specialist</option>
                      <option value="HRPayrollManager">Payroll Director</option>
                      <option value="Admin">System Administrator</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showSignupPassword ? 'text' : 'password'}
                          required
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 pr-10 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition cursor-pointer"
                        >
                          {showSignupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Confirm
                      </label>
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        required
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="relative w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-bold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-md"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className="text-amber-600 dark:text-amber-400 hover:underline transition font-bold cursor-pointer"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-[10px] text-slate-500 dark:text-slate-600 flex items-center justify-center gap-3 font-medium">
              <span className="flex items-center gap-1">
                <ShieldCheck size={10} className="text-amber-500 dark:text-amber-400/40" />
                Enterprise Grade
              </span>
              <span className="w-px h-3 bg-slate-300 dark:bg-slate-700" />
              <span>JWT Auth</span>
              <span className="w-px h-3 bg-slate-300 dark:bg-slate-700" />
              <span>Prisma ORM</span>
            </p>
          </div>

        </div>
      </div>

      {/* ===== FORGOT PASSWORD MODAL ===== */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="fixed inset-0"
            onClick={() => !forgotLoading && setIsForgotModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-[#0d0c15] border border-amber-500/30 dark:border-amber-500/20 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-900 dark:text-white transition-all overflow-hidden z-10">
            {/* Ambient glows */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/20 rounded-full blur-2xl pointer-events-none" />

            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsForgotModalOpen(false)}
              disabled={forgotLoading}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
            >
              <X size={18} />
            </button>

            {forgotStep === 'form' ? (
              <div>
                {/* Modal Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-purple-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white shrink-0">
                    <KeyRound size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
                      Reset Password
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Update your database credentials
                    </p>
                  </div>
                </div>

                {/* Error Banner */}
                {forgotError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {/* Reset Form */}
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        type={showForgotNewPassword ? 'text' : 'password'}
                        required
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition cursor-pointer"
                      >
                        {showForgotNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Confirm New Password
                      </label>
                      {forgotConfirmPassword && forgotNewPassword && (
                        <span className={`text-[11px] font-semibold flex items-center gap-1 ${forgotNewPassword === forgotConfirmPassword ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                          {forgotNewPassword === forgotConfirmPassword ? (
                            <>
                              <Check size={12} />
                              Passwords match
                            </>
                          ) : (
                            'Passwords do not match'
                          )}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        type={showForgotNewPassword ? 'text' : 'password'}
                        required
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(false)}
                      className="w-1/3 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-2/3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-bold text-sm shadow-md shadow-amber-500/25 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {forgotLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <span>Reset Password</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Success Step */
              <div className="text-center py-3">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto mb-4 animate-bounce-subtle">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Password Updated!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 leading-relaxed max-w-sm mx-auto">
                  {forgotSuccess || 'Your password has been successfully updated in the database.'}
                </p>

                <button
                  type="button"
                  onClick={handleApplyNewPasswordAndClose}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Sign In With New Password</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};