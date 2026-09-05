import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDateIST, toISTDateInputValue } from '../utils/datetime';
import {
  UserCheck,
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  Download,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  FileText,
  Play,
  Square,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  TrendingUp,
  Award,
  ChevronRight,
  ExternalLink,
  Plus,
  Send,
  X,
  Building2,
  CalendarDays,
  Layers,
  ArrowUpRight,
  Zap,
  Info
} from 'lucide-react';

export const MyProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Expected, valid state: the signed-in account has no linked employee record.
  // This is NOT an error condition (an Admin may keep a login active after unlinking).
  const [unlinked, setUnlinked] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'contracts' | 'leave' | 'attendance' | 'payslips' | 'requests'>('contracts');

  // Punch clock states
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [clockLoading, setClockLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);

  // Leave Request Modal state
  const [showLeaveModal, setShowLeaveModal] = useState<boolean>(false);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [submittingLeave, setSubmittingLeave] = useState<boolean>(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [leaveSuccess, setLeaveSuccess] = useState<string | null>(null);
  const [leaveForm, setLeaveForm] = useState({
    timeOffTypeId: '',
    startDate: toISTDateInputValue(),
    endDate: toISTDateInputValue(),
    duration: 1,
    reason: ''
  });

  // Selected Payslip for breakdown modal
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    setUnlinked(false);
    try {
      const data = await apiRequest('/employees/me');
      setProfile(data);

      // Check for active check-in
      if (data.attendances && Array.isArray(data.attendances)) {
        const active = data.attendances.find((a: any) => !a.checkOut);
        setActiveSession(active || null);
      }
    } catch (err: any) {
      const msg: string = err?.message || '';
      // "No employee record linked" is an expected, valid account state — not an
      // error. Show a friendly notice; do NOT log to the console.
      if (/no employee record linked/i.test(msg)) {
        setUnlinked(true);
      } else {
        console.error('Failed to load employee profile:', err);
        setError(msg || 'Failed to load profile details');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const types = await apiRequest('/time-off/types/balances');
      setLeaveTypes(types);
      if (types && types.length > 0 && !leaveForm.timeOffTypeId) {
        setLeaveForm(prev => ({ ...prev, timeOffTypeId: types[0].id }));
      }
    } catch (err) {
      console.error('Failed to load leave types:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchLeaveTypes();
  }, [user]);

  // Handle punch clock actions
  const handleCheckIn = async () => {
    setClockLoading(true);
    try {
      await apiRequest('/attendance/check-in', { method: 'POST', body: JSON.stringify({}) });
      await fetchProfile();
    } catch (err: any) {
      alert(err.message || 'Failed to check in');
    } finally {
      setClockLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setClockLoading(true);
    try {
      await apiRequest('/attendance/check-out', { method: 'POST', body: JSON.stringify({}) });
      await fetchProfile();
    } catch (err: any) {
      alert(err.message || 'Failed to check out');
    } finally {
      setClockLoading(false);
    }
  };

  // Handle Leave Submission
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingLeave(true);
    setLeaveError(null);
    setLeaveSuccess(null);
    try {
      await apiRequest('/time-off/requests', {
        method: 'POST',
        body: JSON.stringify({
          ...leaveForm,
          duration: Number(leaveForm.duration)
        })
      });
      setLeaveSuccess('Leave request submitted successfully for manager review.');
      setTimeout(() => {
        setShowLeaveModal(false);
        setLeaveSuccess(null);
        setLeaveForm({
          timeOffTypeId: leaveTypes[0]?.id || '',
          startDate: toISTDateInputValue(),
          endDate: toISTDateInputValue(),
          duration: 1,
          reason: ''
        });
      }, 1200);
      fetchProfile();
      fetchLeaveTypes();
    } catch (err: any) {
      setLeaveError(err.message || 'Failed to submit leave request');
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleDownloadPdf = async (payslipId: string, employeeName: string) => {
    setDownloadingPdfId(payslipId);
    try {
      const blob = await apiRequest<Blob>(`/payruns/payslips/${payslipId}/pdf`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Payslip_${employeeName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message || 'Failed to download payslip PDF');
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const copyEmail = () => {
    if (profile?.email || user?.email) {
      navigator.clipboard.writeText(profile?.email || user?.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  // Aggregate Metrics Calculations
  const activeContract = useMemo(() => {
    if (!profile?.contracts || profile.contracts.length === 0) return null;
    return profile.contracts.find((c: any) => c.status === 'Active') || profile.contracts[0];
  }, [profile]);

  const totalLeaveAvailable = useMemo(() => {
    if (!profile?.allocations) return 0;
    return profile.allocations.reduce((sum: number, a: any) => sum + (a.remainingAmount || 0), 0);
  }, [profile]);

  const totalHoursLogged = useMemo(() => {
    if (!profile?.attendances) return 0;
    return profile.attendances.reduce((sum: number, a: any) => sum + (a.workedHours || 0), 0);
  }, [profile]);

  const latestPayslip = useMemo(() => {
    if (!profile?.payslips || profile.payslips.length === 0) return null;
    return profile.payslips[0];
  }, [profile]);

  // Active Session Duration Timer
  const activeSessionDuration = useMemo(() => {
    if (!activeSession) return null;
    const start = new Date(activeSession.checkIn).getTime();
    const now = currentTime.getTime();
    const diffMs = Math.max(0, now - start);
    const hrs = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [activeSession, currentTime]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-2 border-indigo-500/20 border-t-amber-400 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles size={20} className="text-amber-400 animate-pulse" />
          </div>
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading your executive workspace...</p>
      </div>
    );
  }

  // Expected state: this login is not linked to an employee record.
  if (unlinked) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 text-center bg-white/80 dark:bg-[#0c0a14]/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-4">
          <UserCheck size={28} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">No linked employee profile</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
          Your account isn't currently linked to an employee record. Contact your HR Administrator to have your
          profile connected — once linked, your contracts, attendance, and payslips will appear here automatically.
        </p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 text-center bg-white/80 dark:bg-[#0c0a14]/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Couldn't load your profile</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
          {error || 'Something went wrong loading your workspace. Please refresh the page or try again shortly.'}
        </p>
      </div>
    );
  }

  const initials = profile.name
    ? profile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'EM';

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* ============================================================ */}
      {/* 🌟 HERO EXECUTIVE PROFILE & LIVE PUNCH CLOCK HEADER */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-[#0b0914]/85 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
        {/* Subtle Ambient Decorative Glows */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-gradient-to-br from-amber-500/10 via-purple-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-gradient-to-tr from-indigo-600/10 via-amber-400/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            {/* Left: Employee Identity & Bio */}
            <div className="flex items-start sm:items-center gap-5">
              {/* Premium Avatar with Glowing Ring */}
              <div className="relative shrink-0">
                <div className="h-20 w-20 sm:h-22 sm:w-22 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-400 p-[2px] shadow-xl shadow-purple-500/15">
                  <div className="h-full w-full rounded-[14px] bg-[#0c0915] flex items-center justify-center text-white font-extrabold text-2xl tracking-wider">
                    {initials}
                  </div>
                </div>
                {/* Active Presence Dot */}
                <div
                  title={activeSession ? 'Clocked In' : 'Checked Out'}
                  className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white dark:border-[#0b0914] flex items-center justify-center ${
                    activeSession ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full bg-white ${activeSession ? 'animate-ping' : ''}`} />
                </div>
              </div>

              {/* Identity Info */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {profile.name}
                  </h1>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                    {profile.status || 'Active'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{profile.jobPosition}</span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-500/20 text-xs">
                    {profile.department}
                  </span>
                  {profile.workingSchedule && (
                    <>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1">
                        <Clock size={13} className="text-amber-500" />
                        {profile.workingSchedule.name}
                      </span>
                    </>
                  )}
                </div>

                {/* Metadata Chips */}
                <div className="pt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <button
                    onClick={copyEmail}
                    className="group inline-flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-300 transition"
                    title="Click to copy email"
                  >
                    <span>{profile.email || user?.email}</span>
                    {copiedEmail ? (
                      <Check size={13} className="text-emerald-500" />
                    ) : (
                      <Copy size={13} className="opacity-40 group-hover:opacity-100 transition" />
                    )}
                  </button>

                  {profile.manager && (
                    <>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-slate-400">Manager:</span>
                        <strong className="font-semibold text-slate-700 dark:text-slate-200">
                          {profile.manager.name}
                        </strong>
                      </span>
                    </>
                  )}

                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                    ID: {profile.id.slice(0, 8)}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Live Punch-Clock Console Widget */}
            <div className="w-full lg:w-auto shrink-0 bg-slate-50/90 dark:bg-[#07060d]/90 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.06] rounded-2xl p-4 sm:p-5 shadow-inner">
              <div className="flex items-center justify-between gap-6 mb-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    Live Punch Clock
                  </span>
                  <div className="text-lg font-mono font-bold text-slate-900 dark:text-white tracking-wider">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Session Status</span>
                  {activeSession ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active ({activeSessionDuration})
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Not Clocked In
                    </span>
                  )}
                </div>
              </div>

              {/* Punch Button Action */}
              <div className="flex items-center gap-2">
                {activeSession ? (
                  <button
                    onClick={handleCheckOut}
                    disabled={clockLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-600 hover:to-amber-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Square size={14} className="fill-current" />
                    {clockLoading ? 'Checking Out...' : 'Punch Out / End Shift'}
                  </button>
                ) : (
                  <button
                    onClick={handleCheckIn}
                    disabled={clockLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Play size={14} className="fill-current" />
                    {clockLoading ? 'Checking In...' : 'Punch In / Start Shift'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 📊 4 EXECUTIVE KPI SUMMARY CARDS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Active Compensation */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-white/70 dark:bg-[#0b0914]/75 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.07] shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Monthly Base Wage</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {activeContract ? `₹${activeContract.wage.toLocaleString('en-IN')}` : 'N/A'}
              <span className="text-xs font-normal text-slate-400 ml-1">/mo</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              <span>Annual CTC: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{activeContract ? `₹${(activeContract.wage * 12).toLocaleString('en-IN')}` : '—'}</strong></span>
              <span className="text-emerald-500 font-medium font-mono text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">Active</span>
            </div>
          </div>
        </div>

        {/* Card 2: Leave & Balance */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-white/70 dark:bg-[#0b0914]/75 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.07] shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Paid Leave Balance</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Calendar size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {totalLeaveAvailable} <span className="text-xs font-normal text-slate-400">days available</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              <span>Allocations: {profile.allocations?.length || 0} categories</span>
              <button
                onClick={() => setShowLeaveModal(true)}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-0.5"
              >
                Request <Plus size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Attendance Activity */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-white/70 dark:bg-[#0b0914]/75 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.07] shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Attendance Logged</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Clock size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {totalHoursLogged.toFixed(1)} <span className="text-xs font-normal text-slate-400">total hrs</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              <span>{profile.attendances?.length || 0} punch entries</span>
              <span className="text-amber-500 font-semibold flex items-center gap-0.5">
                <Sparkles size={11} /> On-Time
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Latest Payslip */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-white/70 dark:bg-[#0b0914]/75 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.07] shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Latest Net Payout</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Award size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
              {latestPayslip ? `₹${latestPayslip.netTotal.toLocaleString('en-IN')}` : '₹0.00'}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              <span className="truncate max-w-[130px]">{latestPayslip?.payrun?.name || 'Latest Payrun'}</span>
              {latestPayslip && (
                <button
                  onClick={() => handleDownloadPdf(latestPayslip.id, profile.name)}
                  disabled={downloadingPdfId === latestPayslip.id}
                  className="text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center gap-0.5"
                >
                  <Download size={11} /> {downloadingPdfId === latestPayslip.id ? '...' : 'PDF'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 🧭 SEGMENTED TAB NAVIGATION */}
      {/* ============================================================ */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="inline-flex p-1.5 rounded-2xl bg-slate-100/90 dark:bg-[#0b0914]/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.07] gap-1 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('contracts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'contracts'
                ? 'bg-white dark:bg-purple-950/60 text-indigo-700 dark:text-purple-200 shadow-sm border border-slate-200/80 dark:border-purple-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Briefcase size={14} className={activeTab === 'contracts' ? 'text-amber-500' : 'opacity-60'} />
            My Contracts
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-white/10">
              {profile.contracts?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('leave')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'leave'
                ? 'bg-white dark:bg-purple-950/60 text-indigo-700 dark:text-purple-200 shadow-sm border border-slate-200/80 dark:border-purple-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar size={14} className={activeTab === 'leave' ? 'text-amber-500' : 'opacity-60'} />
            Leave Balances
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-white/10">
              {profile.allocations?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'bg-white dark:bg-purple-950/60 text-indigo-700 dark:text-purple-200 shadow-sm border border-slate-200/80 dark:border-purple-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock size={14} className={activeTab === 'attendance' ? 'text-amber-500' : 'opacity-60'} />
            Attendance History
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-white/10">
              {profile.attendances?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('payslips')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'payslips'
                ? 'bg-white dark:bg-purple-950/60 text-indigo-700 dark:text-purple-200 shadow-sm border border-slate-200/80 dark:border-purple-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <DollarSign size={14} className={activeTab === 'payslips' ? 'text-amber-500' : 'opacity-60'} />
            Official Payslips
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-white/10">
              {profile.payslips?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'requests'
                ? 'bg-white dark:bg-purple-950/60 text-indigo-700 dark:text-purple-200 shadow-sm border border-slate-200/80 dark:border-purple-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Send size={14} className={activeTab === 'requests' ? 'text-amber-500' : 'opacity-60'} />
            Time Off Requests
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-white/10">
              {profile.timeOffRequests?.length || 0}
            </span>
          </button>
        </div>

        {/* Quick Action Trigger */}
        <button
          onClick={() => setShowLeaveModal(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus size={15} />
          Request Leave
        </button>
      </div>

      {/* ============================================================ */}
      {/* 📄 TAB 1: MY CONTRACTS */}
      {/* ============================================================ */}
      {activeTab === 'contracts' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Briefcase size={16} className="text-amber-500" />
              Compensation & Employment Agreements
            </h2>
            <span className="text-xs text-slate-500">
              {profile.contracts?.length || 0} Agreement{profile.contracts?.length === 1 ? '' : 's'} on record
            </span>
          </div>

          {!profile.contracts || profile.contracts.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/60 dark:bg-[#0b0914]/60 border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 text-sm">
              No contracts filed for this profile yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {profile.contracts.map((c: any) => {
                const isActive = c.status === 'Active';
                return (
                  <div
                    key={c.id}
                    className={`relative overflow-hidden p-6 rounded-3xl backdrop-blur-xl border transition-all ${
                      isActive
                        ? 'bg-white/90 dark:bg-[#0e0c1a]/90 border-purple-300 dark:border-purple-500/40 shadow-lg shadow-purple-500/5'
                        : 'bg-white/60 dark:bg-[#090812]/60 border-slate-200 dark:border-white/[0.06]'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-0 right-0 px-4 py-1 rounded-bl-2xl bg-gradient-to-l from-emerald-500 to-teal-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                        Active Agreement
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                          {c.jobPosition} • {c.department}
                        </span>
                        <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                          ₹{c.wage.toLocaleString('en-IN')}
                          <span className="text-sm font-normal text-slate-400 ml-1">/ month</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50/80 dark:bg-[#06050b]/80 border border-slate-200/60 dark:border-white/[0.04] text-xs mb-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Effective Period</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                          {formatDateIST(c.startDate)} → {c.endDate ? formatDateIST(c.endDate) : 'Indefinite'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Salary Structure</span>
                        <span className="font-semibold text-indigo-600 dark:text-amber-300 flex items-center gap-1">
                          <Layers size={13} />
                          {c.salaryStructure?.name || 'Standard Structure'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-white/[0.04]">
                      <span>Annualized Base: <strong className="text-slate-800 dark:text-slate-200 font-mono">₹{(c.wage * 12).toLocaleString('en-IN')}</strong></span>
                      <span className="text-[11px] font-mono text-slate-400">Ref: {c.id.slice(0, 8)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 🏖️ TAB 2: LEAVE BALANCES */}
      {/* ============================================================ */}
      {activeTab === 'leave' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Calendar size={16} className="text-amber-500" />
              Annual Time-Off Allocations & Real-Time Balances
            </h2>
            <button
              onClick={() => setShowLeaveModal(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 text-xs font-bold hover:bg-indigo-100 transition"
            >
              + Submit New Request
            </button>
          </div>

          {!profile.allocations || profile.allocations.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/60 dark:bg-[#0b0914]/60 border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 text-sm">
              No leave allocations granted yet. Contact HR for your annual quotas.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {profile.allocations.map((alloc: any) => {
                const total = alloc.allocatedAmount || 1;
                const remaining = alloc.remainingAmount || 0;
                const taken = alloc.takenAmount || 0;
                const pct = Math.min(100, Math.max(0, Math.round((remaining / total) * 100)));

                return (
                  <div
                    key={alloc.id}
                    className="p-6 rounded-3xl bg-white/80 dark:bg-[#0b0914]/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.07] shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white block">
                          {alloc.timeOffType?.name}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {alloc.timeOffType?.requiresAllocation ? 'Quota-Managed' : 'Unlimited / Special'}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20">
                        {alloc.timeOffType?.unit}
                      </span>
                    </div>

                    <div className="my-4">
                      <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                        {remaining}
                        <span className="text-xs font-normal text-slate-400 ml-1.5">
                          {alloc.timeOffType?.unit} available
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 dark:bg-[#06050b] h-2 rounded-full overflow-hidden mt-3 border border-slate-200/50 dark:border-white/[0.04]">
                        <div
                          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-white/[0.04]">
                      <span>Used: <strong className="text-slate-700 dark:text-slate-200 font-mono">{taken}</strong></span>
                      <span>Total Quota: <strong className="text-slate-700 dark:text-slate-200 font-mono">{total}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* ⏱️ TAB 3: ATTENDANCE HISTORY */}
      {/* ============================================================ */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Clock size={16} className="text-amber-500" />
              Verified Punch Clock Logs & Shift Records
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              {profile.attendances?.length || 0} Total Entries
            </span>
          </div>

          {!profile.attendances || profile.attendances.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/60 dark:bg-[#0b0914]/60 border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 text-sm">
              No punch activity recorded yet. Use the punch clock widget above to record your shifts.
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl bg-white/80 dark:bg-[#0b0914]/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.07] shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/90 dark:bg-[#07060d]/90 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200/80 dark:border-white/[0.06]">
                    <tr>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5">Check-In</th>
                      <th className="px-6 py-3.5">Check-Out</th>
                      <th className="px-6 py-3.5">Duration</th>
                      <th className="px-6 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-800 dark:text-slate-200">
                    {profile.attendances.map((att: any) => {
                      const isOngoing = !att.checkOut;
                      return (
                        <tr key={att.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition">
                          <td className="px-6 py-4 font-mono font-medium text-slate-900 dark:text-white">
                            {new Date(att.checkIn).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 font-mono">
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono">
                            {att.checkOut ? (
                              <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                {new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-amber-500 font-semibold animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                In Progress...
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-amber-300">
                            {isOngoing ? '—' : `${att.workedHours} hrs`}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isOngoing
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {isOngoing ? 'Active Shift' : (att.status || 'Present')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 💰 TAB 4: OFFICIAL PAYSLIPS */}
      {/* ============================================================ */}
      {activeTab === 'payslips' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <DollarSign size={16} className="text-amber-500" />
              Official Payslips & Itemized Salary Statements
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              {profile.payslips?.length || 0} Statement{profile.payslips?.length === 1 ? '' : 's'}
            </span>
          </div>

          {!profile.payslips || profile.payslips.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/60 dark:bg-[#0b0914]/60 border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 text-sm">
              No payslips generated yet. Once payroll is processed, your itemized statements and official PDFs will appear here.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {profile.payslips.map((p: any) => (
                <div
                  key={p.id}
                  className="p-6 rounded-3xl bg-white/80 dark:bg-[#0b0914]/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.07] shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        {p.payrun?.name || 'Monthly Payroll Cycle'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {p.status || 'Paid'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">
                      Pay Period: {formatDateIST(p.periodStart)} → {formatDateIST(p.periodEnd)}
                    </p>
                    <div className="text-xs text-slate-600 dark:text-slate-400 pt-1 flex items-center gap-3">
                      <span>Worked Days: <strong className="text-slate-800 dark:text-slate-200 font-mono">{p.workedDays} days</strong></span>
                      <span>•</span>
                      <span>Gross: <strong className="text-slate-800 dark:text-slate-200 font-mono">₹{p.grossTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-white/[0.04]">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Net Take-Home Pay</span>
                      <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        ₹{p.netTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedPayslip(p)}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText size={14} />
                        Breakdown
                      </button>

                      <button
                        onClick={() => handleDownloadPdf(p.id, profile.name)}
                        disabled={downloadingPdfId === p.id}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 hover:shadow-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Download size={14} />
                        {downloadingPdfId === p.id ? 'Generating...' : 'Download PDF'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 📨 TAB 5: MY TIME-OFF REQUESTS TRACKER */}
      {/* ============================================================ */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Send size={16} className="text-amber-500" />
              Submitted Leave Requests & Approval Tracker
            </h2>
            <button
              onClick={() => setShowLeaveModal(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition"
            >
              + New Request
            </button>
          </div>

          {!profile.timeOffRequests || profile.timeOffRequests.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/60 dark:bg-[#0b0914]/60 border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 text-sm">
              No leave requests submitted yet. Click "+ New Request" to file for time off.
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl bg-white/80 dark:bg-[#0b0914]/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.07] shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/90 dark:bg-[#07060d]/90 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200/80 dark:border-white/[0.06]">
                    <tr>
                      <th className="px-6 py-3.5">Leave Type</th>
                      <th className="px-6 py-3.5">Dates</th>
                      <th className="px-6 py-3.5">Duration</th>
                      <th className="px-6 py-3.5">Reason</th>
                      <th className="px-6 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-800 dark:text-slate-200">
                    {profile.timeOffRequests.map((req: any) => (
                      <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition">
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                          {req.timeOffType?.name || 'General Leave'}
                        </td>
                        <td className="px-6 py-4 font-mono">
                          {formatDateIST(req.startDate)} → {formatDateIST(req.endDate)}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {req.duration} {req.timeOffType?.unit || 'days'}
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                          {req.reason || '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            req.status === 'Approved'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : req.status === 'Refused'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}>
                            {req.status === 'Approved' && <CheckCircle2 size={11} />}
                            {req.status === 'Refused' && <XCircle size={11} />}
                            {req.status === 'Pending' && <Clock size={11} />}
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 🪟 MODAL 1: REQUEST TIME OFF */}
      {/* ============================================================ */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0e0c1a] border border-slate-200 dark:border-white/[0.1] shadow-2xl">
            <button
              onClick={() => setShowLeaveModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                <Calendar size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Request Time Off</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Submit a leave request for managerial approval.</p>
              </div>
            </div>

            {leaveError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle size={15} />
                {leaveError}
              </div>
            )}

            {leaveSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 size={15} />
                {leaveSuccess}
              </div>
            )}

            <form onSubmit={handleLeaveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Leave Type
                </label>
                <select
                  value={leaveForm.timeOffTypeId}
                  onChange={(e) => setLeaveForm({ ...leaveForm, timeOffTypeId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#07060d] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.remainingBalance !== undefined ? `${t.remainingBalance} ${t.unit} remaining` : t.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#07060d] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#07060d] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Duration (Days / Hours)
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={leaveForm.duration}
                  onChange={(e) => setLeaveForm({ ...leaveForm, duration: parseFloat(e.target.value) || 1 })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#07060d] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Reason / Notes
                </label>
                <textarea
                  rows={2}
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="e.g. Annual family vacation, personal medical leave..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#07060d] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLeave}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingLeave ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 🪟 MODAL 2: PAYSLIP RULE BREAKDOWN VIEWER */}
      {/* ============================================================ */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0e0c1a] border border-slate-200 dark:border-white/[0.1] shadow-2xl max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedPayslip(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <DollarSign size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {selectedPayslip.payrun?.name || 'Payslip Statement'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Period: {formatDateIST(selectedPayslip.periodStart)} → {formatDateIST(selectedPayslip.periodEnd)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDownloadPdf(selectedPayslip.id, profile.name)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black shadow-sm flex items-center gap-1"
              >
                <Download size={13} /> PDF
              </button>
            </div>

            {/* Overview Summary Bar */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#07060d] border border-slate-200/80 dark:border-white/[0.06] mb-6 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Worked Days</span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-200 font-mono">{selectedPayslip.workedDays}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Gross Earnings</span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-200 font-mono">₹{selectedPayslip.grossTotal?.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-500 block">Net Payout</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">₹{selectedPayslip.netTotal?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Computed Rule Lines Table */}
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-400" />
              Engine-Computed Salary Rule Lines
            </h4>

            {selectedPayslip.lines && selectedPayslip.lines.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.06]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#07060d] text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-white/[0.06]">
                    <tr>
                      <th className="px-4 py-2.5">Code</th>
                      <th className="px-4 py-2.5">Rule Name</th>
                      <th className="px-4 py-2.5">Category</th>
                      <th className="px-4 py-2.5 text-right">Computed Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {selectedPayslip.lines.map((l: any) => {
                      const amountVal = l.amount !== undefined ? Number(l.amount) : (Number(l.total) || 0);
                      const isDeduction = l.category?.toLowerCase() === 'deduction';
                      return (
                        <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">{l.code}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">{l.name}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isDeduction
                                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                : l.category === 'Gross' || l.category === 'Net'
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            }`}>
                              {l.category}
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-right font-mono font-bold ${
                            isDeduction ? 'text-rose-500 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                          }`}>
                            {isDeduction ? '-' : ''}₹{Math.abs(amountVal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                Rule line itemization not available for this legacy record.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
