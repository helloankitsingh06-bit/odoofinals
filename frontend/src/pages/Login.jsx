import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { User, Mail, Lock, Shield } from 'lucide-react';

export default function Login() {
  const { user, login, signup, loginWithGoogle, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState('Admin');

  // Form error messages
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setFormError('');
    setFeedbackMsg('');

    // Validation checks
    if (isSignUp && !name.trim()) {
      setFormError('Name is required');
      return;
    }

    if (!email.trim()) {
      setFormError('Email is required');
      return;
    }

    if (!password) {
      setFormError('Password is required');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signup(email, password, name.trim());
      } else {
        await login(email, password, selectedRole);
      }
    } catch (err) {
      setFormError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError('');
    setFeedbackMsg('');
    setLoading(true);
    try {
      // Trigger the real Google Sign-In pop-up
      await loginWithGoogle(selectedRole);
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setFeedbackMsg('Password reset instructions stub: email sent to ' + (email || 'your address') + '.');
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4 antialiased font-sans select-none">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-stone-850 border-t-emerald-500 animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-ping"></span>
          </div>
        </div>
        <div className="text-center space-y-1.5">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-200">
            Authenticating Secure Node
          </h3>
          <p className="text-[8px] text-stone-600 font-mono tracking-widest uppercase animate-pulse">
            Establishing handshake // Reading security clearance
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-6 font-sans antialiased select-none">
      <div className="w-full max-w-md glass-panel p-6 sm:p-10 space-y-8 border border-glass-border shadow-glass-glow rounded-lg">
        
        {/* Branding header */}
        <div className="text-center space-y-2">
          {/* Status Dot */}
          <div className="relative inline-block">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse"></span>
          </div>
          <h2 className="text-2xl font-bold tracking-[0.25em] text-asset-light uppercase">
            Starter
          </h2>
          <p className="text-[10px] text-stone-500 font-mono tracking-[0.18em] uppercase">
            Hackathon Starter Template
          </p>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-glass-border">
          <button
            onClick={() => {
              setIsSignUp(false);
              setFormError('');
              setFeedbackMsg('');
            }}
            className={`flex-1 pb-3 text-2xs font-bold uppercase tracking-[0.15em] transition-all border-b-2 ${
              !isSignUp ? 'border-emerald-500 text-asset-light drop-shadow-[0_0_8px_rgba(52,211,153,0.2)]' : 'border-transparent text-stone-500 hover:text-stone-400'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setIsSignUp(true);
              setFormError('');
              setFeedbackMsg('');
            }}
            className={`flex-1 pb-3 text-2xs font-bold uppercase tracking-[0.15em] transition-all border-b-2 ${
              isSignUp ? 'border-emerald-500 text-asset-light drop-shadow-[0_0_8px_rgba(52,211,153,0.2)]' : 'border-transparent text-stone-500 hover:text-stone-400'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Notifications Banners */}
        {formError && (
          <div className="bg-red-950/20 border border-red-900/30 text-red-200 px-4 py-2.5 rounded-md text-xs backdrop-blur-md font-mono">
            ⚠️ {formError}
          </div>
        )}

        {feedbackMsg && (
          <div className="bg-white/[0.02] border border-glass-border text-stone-300 px-4 py-2.5 rounded-md text-xs backdrop-blur-md font-mono">
            ℹ️ {feedbackMsg}
          </div>
        )}

        {/* Form contents */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
                Full Name *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-3.5 w-3.5 text-stone-600" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full h-10 bg-white/[0.03] border border-glass-border hover:border-white/20 rounded-md px-3.5 py-2 text-xs text-asset-light placeholder-stone-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all duration-150 pl-10 font-mono"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
              Email Address *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-3.5 w-3.5 text-stone-600" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full h-10 bg-white/[0.03] border border-glass-border hover:border-white/20 rounded-md px-3.5 py-2 text-xs text-asset-light placeholder-stone-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all duration-150 pl-10 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
                Password *
              </label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[9px] text-stone-500 hover:text-stone-300 transition-colors uppercase tracking-[0.1em] font-semibold"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-3.5 w-3.5 text-stone-600" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 bg-white/[0.03] border border-glass-border hover:border-white/20 rounded-md px-3.5 py-2 text-xs text-asset-light placeholder-stone-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all duration-150 pl-10 font-mono"
              />
            </div>
          </div>

          {/* Test Role Picker (only visible during mock sign-in) */}
          {!isSignUp && (
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
                Select System Role (Test Auth)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Shield className="h-3.5 w-3.5 text-stone-600" />
                </span>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full h-10 bg-white/[0.03] border border-glass-border hover:border-white/20 rounded-md px-3.5 py-2 text-xs text-asset-light focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all duration-150 pl-10 font-mono capitalize font-semibold appearance-none"
                >
                  <option value="Admin" className="bg-[#181818] text-stone-300">Admin</option>
                  <option value="Employee" className="bg-[#181818] text-stone-300">Employee</option>
                  <option value="AssetManager" className="bg-[#181818] text-stone-300">AssetManager</option>
                  <option value="DeptHead" className="bg-[#181818] text-stone-300">DeptHead</option>
                </select>
              </div>
            </div>
          )}

          {/* Buttons Stack */}
          <div className="pt-2 space-y-3">
            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-[#1e3427]/80 hover:bg-[#254231] text-[#76c893] border border-[#2d523c]/60 rounded-md font-bold text-xs uppercase tracking-[0.15em] transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="h-3.5 w-3.5 rounded-full border-2 border-transparent border-t-[#76c893] animate-spin"></span>
              ) : isSignUp ? (
                'Create Account'
              ) : (
                'Authenticate'
              )}
            </button>

            {/* Google Sign-in Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-black hover:bg-[#070707] text-stone-300 border border-stone-850 font-bold text-xs uppercase py-3 rounded-md tracking-[0.15em] transition-all duration-150 flex items-center justify-center gap-2.5 shadow-sm"
            >
              {/* Google Brand Icon SVG */}
              <svg className="h-4 w-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                  <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.57h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.68,11.83 21.56,11.4 21.35,11.1z" fill="#4285F4" />
                  <path d="M12,20.6c2.59,0 4.77,-0.86 6.36,-2.33l-3.3,-2.57c-0.91,0.61 -2.08,0.98 -3.06,0.98 -2.35,0 -4.35,-1.59 -5.06,-3.72H3.48v2.66C5.07,18.8 8.35,20.6 12,20.6z" fill="#34A853" />
                  <path d="M6.94,12.97c-0.18,-0.54 -0.28,-1.11 -0.28,-1.7c0,-0.59 0.1,-1.16 0.28,-1.7V6.9H3.48c-0.6,1.2 -0.94,2.56 -0.94,4c0,1.44 0.34,2.8 0.94,4L6.94,12.97z" fill="#FBBC05" />
                  <path d="M12,6.07c1.41,0 2.68,0.49 3.68,1.44l2.76,-2.76C16.77,3.15 14.59,2.3 12,2.3 8.35,2.3 5.07,4.1 3.48,7.22l3.46,2.68C7.65,7.66 9.65,6.07 12,6.07z" fill="#EA4335" />
                </g>
              </svg>
              <span>Sign In with Google</span>
            </button>
          </div>
        </form>

        {/* Footer info text */}
        <div className="text-center">
          <p className="text-[10px] text-stone-600 font-mono tracking-widest">
            STARTER TEMPLATE // AUTH DEMO
          </p>
        </div>
      </div>
    </div>
  );
}
