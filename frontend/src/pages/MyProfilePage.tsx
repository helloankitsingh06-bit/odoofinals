import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDateIST, formatTimeIST } from '../utils/datetime';
import {
  UserCheck,
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  Building2,
  Download,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  FileText
} from 'lucide-react';

export const MyProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'contract' | 'attendance' | 'timeoff' | 'payslips'>('contract');

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/employees/me');
      setProfile(data);
    } catch (err: any) {
      console.error('Failed to load my profile:', err);
      setError(err.message || 'Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleDownloadPdf = async (payslipId: string, employeeName: string) => {
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
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500 border-r-amber-400"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#0b0914]/80 border border-purple-100 dark:border-purple-900/40 rounded-3xl text-purple-600 dark:text-purple-300">
        <AlertCircle size={32} className="mx-auto text-amber-500 mb-2" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Profile Pending Linkage</h2>
        <p className="text-xs text-slate-500 dark:text-purple-300/70 mt-1 max-w-md mx-auto">
          {error || 'No employee record is linked to your user account. Once HR adds your employee details with your matching email, your contracts, attendance, and leave data will display here automatically.'}
        </p>
      </div>
    );
  }

  const activeContract = profile.contracts?.find((c: any) => c.status === 'Active') || profile.contracts?.[0];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Profile Overview Header Card */}
      <div className="bg-white dark:bg-[#0b0914]/80 p-6 rounded-3xl border border-purple-100 dark:border-purple-900/40 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-amber-400 flex items-center justify-center text-white dark:text-slate-950 font-black text-2xl shadow-lg">
              {profile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{profile.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  {profile.status}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-purple-200/70 font-medium mt-0.5">
                {profile.jobPosition} • <span className="text-amber-600 dark:text-amber-300 font-bold">{profile.department}</span>
              </p>
              <div className="text-[11px] text-slate-500 dark:text-purple-400/60 mt-1 flex items-center gap-3">
                <span>Email: <strong className="text-slate-700 dark:text-purple-200 font-normal">{profile.email || user?.email}</strong></span>
                {profile.manager && (
                  <span>Manager: <strong className="text-slate-700 dark:text-purple-200 font-normal">{profile.manager.name}</strong></span>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-[#06050b] border border-purple-100 dark:border-purple-900/40 rounded-2xl flex items-center gap-6">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-purple-400/70 uppercase font-semibold block">Active Wage</span>
              <span className="text-xl font-extrabold text-amber-600 dark:text-amber-300 font-mono">
                {activeContract ? `₹${activeContract.wage.toLocaleString('en-IN')}/mo` : 'N/A'}
              </span>
            </div>
            <div className="border-l border-purple-200 dark:border-purple-900/50 pl-6">
              <span className="text-[10px] text-slate-500 dark:text-purple-400/70 uppercase font-semibold block">Schedule</span>
              <span className="text-xs font-bold text-slate-800 dark:text-purple-200">
                {profile.workingSchedule ? `${profile.workingSchedule.name} (${profile.workingSchedule.totalWeeklyHours}h)` : 'Standard (40h)'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-purple-100 dark:border-purple-900/50 mt-6 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('contract')}
            className={`py-2 px-3.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition ${
              activeTab === 'contract'
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                : 'text-slate-600 dark:text-purple-300/70 hover:text-white hover:bg-purple-950/40'
            }`}
          >
            <Briefcase size={14} /> My Contracts ({profile.contracts?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('timeoff')}
            className={`py-2 px-3.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition ${
              activeTab === 'timeoff'
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                : 'text-slate-600 dark:text-purple-300/70 hover:text-white hover:bg-purple-950/40'
            }`}
          >
            <Calendar size={14} /> Leave Balances ({profile.allocations?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-2 px-3.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition ${
              activeTab === 'attendance'
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                : 'text-slate-600 dark:text-purple-300/70 hover:text-white hover:bg-purple-950/40'
            }`}
          >
            <Clock size={14} /> Attendance History ({profile.attendances?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('payslips')}
            className={`py-2 px-3.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition ${
              activeTab === 'payslips'
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                : 'text-slate-600 dark:text-purple-300/70 hover:text-white hover:bg-purple-950/40'
            }`}
          >
            <DollarSign size={14} /> My Payslips ({profile.payslips?.length || 0})
          </button>
        </div>
      </div>

      {/* Tab 1: Contracts */}
      {activeTab === 'contract' && (
        <div className="space-y-4">
          <h2 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={13} className="text-purple-400" /> Active & Historical Compensation Agreements
          </h2>
          {profile.contracts?.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-[#0b0914]/80 border border-purple-100 dark:border-purple-900/40 rounded-3xl text-purple-400/60 text-xs">
              No contracts filed for this employee profile yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.contracts?.map((c: any) => (
                <div
                  key={c.id}
                  className="bg-white dark:bg-[#0b0914]/80 border border-purple-100 dark:border-purple-900/40 p-5 rounded-3xl shadow-md space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white text-base">
                        ₹{c.wage.toLocaleString('en-IN')}<span className="text-xs text-purple-400 font-normal">/month</span>
                      </span>
                      <p className="text-xs text-slate-600 dark:text-purple-300/70">{c.jobPosition} • {c.department}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      c.status === 'Active' ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30' : 'bg-purple-900/30 text-purple-300'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-purple-100 dark:border-purple-900/40 text-xs space-y-1">
                    <div className="flex justify-between text-slate-600 dark:text-purple-300/70">
                      <span>Period:</span>
                      <span className="font-mono text-slate-900 dark:text-purple-200">
                        {formatDateIST(c.startDate)} → {c.endDate ? formatDateIST(c.endDate) : 'Open-Ended'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-purple-300/70">
                      <span>Salary Structure:</span>
                      <span className="font-semibold text-amber-600 dark:text-amber-300">{c.salaryStructure?.name || 'Standard Structure'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Leave Balances & Allocations */}
      {activeTab === 'timeoff' && (
        <div className="space-y-4">
          <h2 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={13} className="text-purple-400" /> Active Leave Allocations & Balances
          </h2>
          {profile.allocations?.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-[#0b0914]/80 border border-purple-100 dark:border-purple-900/40 rounded-3xl text-purple-400/60 text-xs">
              No leave allocations granted yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {profile.allocations?.map((alloc: any) => (
                <div
                  key={alloc.id}
                  className="bg-white dark:bg-[#0b0914]/80 border border-purple-100 dark:border-purple-900/40 p-5 rounded-3xl shadow-md"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{alloc.timeOffType?.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300">
                      {alloc.timeOffType?.unit}
                    </span>
                  </div>
                  <div className="text-3xl font-black text-amber-600 dark:text-amber-300 font-mono my-2">
                    {alloc.remainingAmount} <span className="text-xs font-normal text-purple-400/70">available</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-[#06050b] h-2 rounded-full overflow-hidden mt-3">
                    <div
                      className="bg-gradient-to-r from-purple-500 via-amber-400 to-yellow-300 h-full rounded-full"
                      style={{ width: `${Math.min(100, (alloc.remainingAmount / (alloc.allocatedAmount || 1)) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 dark:text-purple-400/70 mt-2">
                    <span>Taken: {alloc.takenAmount} {alloc.timeOffType?.unit}</span>
                    <span>Total: {alloc.allocatedAmount} {alloc.timeOffType?.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Attendance History */}
      {activeTab === 'attendance' && (
        <div className="bg-white dark:bg-[#0b0914]/80 border border-purple-100 dark:border-purple-900/40 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-50 dark:bg-[#06050b] border-b border-purple-100 dark:border-purple-900/50 flex justify-between items-center">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-300">My Recent Punch Activity</span>
            <span className="text-xs text-purple-400/70">{profile.attendances?.length || 0} Total Records</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#06050b] text-purple-400/70 uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Check-In</th>
                <th className="px-5 py-3">Check-Out</th>
                <th className="px-5 py-3">Worked Hours</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100 dark:divide-purple-950 text-slate-800 dark:text-purple-100">
              {profile.attendances?.map((att: any) => (
                <tr key={att.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-950/20">
                  <td className="px-5 py-3 font-mono">{formatDateIST(att.checkIn)}</td>
                  <td className="px-5 py-3 font-mono text-purple-300">{formatTimeIST(att.checkIn)}</td>
                  <td className="px-5 py-3 font-mono text-purple-300">{att.checkOut ? formatTimeIST(att.checkOut) : '—'}</td>
                  <td className="px-5 py-3 font-bold font-mono text-amber-300">{att.workedHours}h</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">
                      {att.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Payslips */}
      {activeTab === 'payslips' && (
        <div className="bg-white dark:bg-[#0b0914]/80 border border-purple-100 dark:border-purple-900/40 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-50 dark:bg-[#06050b] border-b border-purple-100 dark:border-purple-900/50 flex justify-between items-center">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-300">My Official Payslips & Statements</span>
            <span className="text-xs text-purple-400/70">{profile.payslips?.length || 0} Total Records</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#06050b] text-purple-400/70 uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3">Period</th>
                <th className="px-5 py-3">Worked Days</th>
                <th className="px-5 py-3">Gross Salary</th>
                <th className="px-5 py-3">Net Take-Home</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100 dark:divide-purple-950 text-slate-800 dark:text-purple-100">
              {profile.payslips?.map((p: any) => (
                <tr key={p.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-950/20">
                  <td className="px-5 py-3 font-medium">
                    <div>{p.payrun?.name || 'Monthly Payrun'}</div>
                    <div className="text-[10px] text-purple-400/70 font-mono">
                      {formatDateIST(p.periodStart)} → {formatDateIST(p.periodEnd)}
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono">{p.workedDays} days</td>
                  <td className="px-5 py-3 font-mono font-semibold">₹{p.grossTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="px-5 py-3 font-mono font-black text-amber-300 text-sm">
                    ₹{p.netTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleDownloadPdf(p.id, profile.name)}
                      className="px-3 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl text-[11px] font-black inline-flex items-center gap-1 shadow-sm"
                    >
                      <Download size={13} /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
