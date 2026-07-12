import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { user, login } = useAuth();
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
    e.preventDefault();
    setFormError('');
    setFeedbackMsg('');

    // Validation checks
    if (isSignUp) {
      if (!name.trim()) {
        setFormError('Name is required');
        return;
      }
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
        // Sign up creates Employee only
        await login(email, password, 'Employee');
      } else {
        // Sign in passes the selected role from the dropdown
        await login(email, password, selectedRole);
      }
    } catch (err) {
      setFormError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setFeedbackMsg('Password reset instructions stub: email sent to ' + (email || 'your address') + '.');
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md glass-panel p-6 space-y-6 border border-glass-border shadow-glass-glow">
        
        {/* Branding header */}
        <div className="text-center space-y-2">
          <span className="inline-flex h-3 w-3 rounded-full bg-emerald-450 shadow-accent-glow animate-pulse mb-1"></span>
          <h2 className="text-2xl font-bold tracking-widest text-asset-light uppercase">
            AssetFlow
          </h2>
          <p className="text-xs text-stone-500 font-semibold tracking-wider uppercase">
            Enterprise Asset Directory
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
            className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              !isSignUp ? 'border-emerald-500 text-asset-light drop-shadow-[0_0_8px_rgba(52,211,153,0.2)]' : 'border-transparent text-stone-500 hover:text-stone-300'
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
            className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              isSignUp ? 'border-emerald-500 text-asset-light drop-shadow-[0_0_8px_rgba(52,211,153,0.2)]' : 'border-transparent text-stone-500 hover:text-stone-300'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Notifications Banners */}
        {formError && (
          <div className="bg-red-950/20 border border-red-900/30 text-red-200 px-4 py-2.5 rounded-md text-xs backdrop-blur-md">
            ⚠️ {formError}
          </div>
        )}

        {feedbackMsg && (
          <div className="bg-white/[0.02] border border-glass-border text-stone-300 px-4 py-2.5 rounded-md text-xs backdrop-blur-md">
            ℹ️ {feedbackMsg}
          </div>
        )}

        {/* Form contents */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full h-10 bg-white/[0.03] border border-glass-border hover:border-white/20 rounded-md px-3 py-2 text-xs text-asset-light placeholder-stone-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:shadow-green-glow transition-all duration-150"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@assetflow.com"
              className="w-full h-10 bg-white/[0.03] border border-glass-border hover:border-white/20 rounded-md px-3 py-2 text-xs text-asset-light placeholder-stone-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:shadow-green-glow transition-all duration-150"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Password *
              </label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[10px] text-stone-500 hover:text-stone-300 transition-colors uppercase tracking-wider font-semibold"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-10 bg-white/[0.03] border border-glass-border hover:border-white/20 rounded-md px-3 py-2 text-xs text-asset-light placeholder-stone-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:shadow-green-glow transition-all duration-150"
            />
          </div>

          {/* Test Role Picker (only visible during mock sign-in) */}
          {!isSignUp && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                Select System Role (Test Auth)
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full h-10 bg-white/[0.03] border border-glass-border hover:border-white/20 rounded-md px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:shadow-green-glow transition-all duration-150 capitalize font-semibold"
              >
                <option value="Admin">Admin</option>
                <option value="Employee">Employee</option>
                <option value="AssetManager">AssetManager</option>
                <option value="DeptHead">DeptHead</option>
              </select>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-asset-green/35 border border-emerald-500/25 hover:bg-asset-green/45 hover:border-emerald-500/40 text-asset-light font-bold text-xs uppercase rounded-md tracking-wider transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-green-glow disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="h-3 w-3 rounded-full border-2 border-stone-900 border-t-asset-light animate-spin"></span>
              ) : isSignUp ? (
                'Create Account'
              ) : (
                'Authenticate'
              )}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-[10px] text-stone-600 font-mono">
            SECURE TERMINAL CONSOLE // SYSTEM STUB V1.0
          </p>
        </div>
      </div>
    </div>
  );
}
