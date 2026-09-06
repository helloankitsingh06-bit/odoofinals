import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { KeyRound, Lock, Eye, EyeOff, ArrowRight, AlertCircle, LogOut } from 'lucide-react';

/**
 * ISSUE 1B (step 4): mandatory "Change Password" screen shown on first login for
 * admin-created accounts (User.mustChangePassword === true). Nothing else in the
 * app renders until the temporary password has been replaced.
 */
export const ChangePasswordPage: React.FC = () => {
  const { user, changePassword, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please re-enter.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from your temporary password.');
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      // On success the context clears mustChangePassword and the app renders normally.
    } catch (err: any) {
      setError(err.message || 'Could not change password. Check your current password and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#f6f5fa] dark:bg-[#040307] text-slate-900 dark:text-slate-100 flex items-center justify-center px-4 transition-colors duration-300">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle size="md" />
      </div>

      <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-purple-100 dark:border-slate-800/50 shadow-xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-purple-600 flex items-center justify-center shadow-lg text-white shrink-0">
            <KeyRound size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">Set a new password</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user?.email} — you must change your temporary password before continuing.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Temporary password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="The password your admin shared"
                className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 font-medium"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">New password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Confirm new password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {submitting ? 'Updating…' : <>Change password &amp; continue <ArrowRight size={16} /></>}
          </button>
        </form>

        <button
          type="button"
          onClick={logout}
          className="mt-4 w-full py-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <LogOut size={13} /> Sign out instead
        </button>
      </div>
    </div>
  );
};
