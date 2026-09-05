import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import {
  DollarSign,
  FileCheck2,
  TrendingUp,
  Calendar,
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Filter,
  Sparkles
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [department, setDepartment] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const query = department !== 'All' ? `?department=${encodeURIComponent(department)}` : '';
      const data = await apiRequest(`/dashboard/metrics${query}`);
      setMetrics(data);
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [department]);

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-400 border-r-purple-400"></div>
      </div>
    );
  }

  const kpis = metrics?.kpis || {};
  const attendance = metrics?.attendanceSummary || {};
  const charts = metrics?.charts || {};
  const alerts = metrics?.alerts || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0b0914]/80 p-5 rounded-3xl border border-purple-900/40 backdrop-blur-xl shadow-2xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="text-amber-400" size={24} />
            Executive HR & Payroll Analytics
          </h1>
          <p className="text-sm text-purple-200/60 mt-0.5">
            Real-time live SQL relational aggregations across contracts, attendance logs, and computed payslips.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#06050b] border border-purple-900/50 px-3 py-2 rounded-xl">
            <Filter size={14} className="text-purple-400" />
            <span className="text-xs text-purple-300/70">Department:</span>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="bg-transparent text-xs font-semibold text-amber-300 focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-[#0b0914] text-purple-100">All Departments</option>
              <option value="Engineering" className="bg-[#0b0914] text-purple-100">Engineering</option>
              <option value="Human Resources" className="bg-[#0b0914] text-purple-100">Human Resources</option>
              <option value="Finance & Payroll" className="bg-[#0b0914] text-purple-100">Finance & Payroll</option>
              <option value="Executive" className="bg-[#0b0914] text-purple-100">Executive</option>
            </select>
          </div>

          <button
            onClick={fetchMetrics}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition active:scale-95"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Net Salary Paid (Gold) */}
        <div className="bg-[#0b0914]/80 border border-amber-500/30 p-5 rounded-2xl relative overflow-hidden group hover:border-amber-400/60 transition shadow-xl bg-gradient-to-br from-amber-500/10 to-transparent">
          <div className="flex items-center justify-between text-purple-200/70 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">Total Net Paid</span>
            <div className="p-2 rounded-xl bg-amber-400/15 text-amber-400 border border-amber-400/30">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            ₹{kpis.totalNetSalaryPaid?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-[11px] text-amber-400 mt-2 flex items-center gap-1 font-medium">
            <CheckCircle2 size={12} /> Status: Paid Payslips
          </div>
        </div>

        {/* KPI 2: Payslips Generated (Purple) */}
        <div className="bg-[#0b0914]/80 border border-purple-500/30 p-5 rounded-2xl relative overflow-hidden group hover:border-purple-400/60 transition shadow-xl bg-gradient-to-br from-purple-500/10 to-transparent">
          <div className="flex items-center justify-between text-purple-200/70 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">Payslips Created</span>
            <div className="p-2 rounded-xl bg-purple-400/15 text-purple-400 border border-purple-400/30">
              <FileCheck2 size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {kpis.payslipsGeneratedCount || 0}
          </div>
          <div className="text-[11px] text-purple-300/80 mt-2 font-medium">
            Itemized Rule Records
          </div>
        </div>

        {/* KPI 3: Average Salary (Gold) */}
        <div className="bg-[#0b0914]/80 border border-yellow-500/30 p-5 rounded-2xl relative overflow-hidden group hover:border-yellow-400/60 transition shadow-xl bg-gradient-to-br from-yellow-500/10 to-transparent">
          <div className="flex items-center justify-between text-purple-200/70 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-yellow-300">Average Take-Home</span>
            <div className="p-2 rounded-xl bg-yellow-400/15 text-yellow-400 border border-yellow-400/30">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            ₹{kpis.averageSalaryPaid?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-[11px] text-yellow-400 mt-2 font-medium">
            Per Paid Employee
          </div>
        </div>

        {/* KPI 4: Approved Time Off (Purple) */}
        <div className="bg-[#0b0914]/80 border border-violet-500/30 p-5 rounded-2xl relative overflow-hidden group hover:border-violet-400/60 transition shadow-xl bg-gradient-to-br from-violet-500/10 to-transparent">
          <div className="flex items-center justify-between text-purple-200/70 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-300">Approved Leave</span>
            <div className="p-2 rounded-xl bg-violet-400/15 text-violet-400 border border-violet-400/30">
              <Calendar size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {kpis.approvedTimeOffDays || 0} <span className="text-xs font-normal text-purple-300/60">Days</span>
          </div>
          <div className="text-[11px] text-violet-300 mt-2 font-medium">
            + {kpis.approvedTimeOffHours || 0} Hours (Split Units)
          </div>
        </div>

        {/* KPI 5: Attendance Health (Gold) */}
        <div className="bg-[#0b0914]/80 border border-amber-400/30 p-5 rounded-2xl relative overflow-hidden group hover:border-amber-400/60 transition shadow-xl bg-gradient-to-br from-amber-400/10 to-transparent">
          <div className="flex items-center justify-between text-purple-200/70 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">Attendance Health</span>
            <div className="p-2 rounded-xl bg-amber-400/15 text-amber-400 border border-amber-400/30">
              <Activity size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {kpis.attendanceHealthScore || 100}%
          </div>
          <div className="text-[11px] text-amber-400 mt-2 font-medium">
            Present & Overtime Ratio
          </div>
        </div>
      </div>

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Salary Bar Chart */}
        <div className="lg:col-span-2 bg-[#0b0914]/80 border border-purple-900/40 p-6 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 size={18} className="text-amber-400" />
                Department Payroll Cost Distribution
              </h2>
              <p className="text-xs text-purple-300/60">Gross vs Net salary allocation by department</p>
            </div>
          </div>

          <div className="h-64">
            {charts.departmentSalaryChart && charts.departmentSalaryChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.departmentSalaryChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1d1730" />
                  <XAxis dataKey="department" stroke="#a78bfa" fontSize={11} />
                  <YAxis stroke="#a78bfa" fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0b0914', borderColor: '#4c1d95', borderRadius: '12px', color: '#f5f3ff' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Bar dataKey="grossTotal" name="Gross Pay (₹)" fill="#c084fc" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="netTotal" name="Net Pay (₹)" fill="#fbbf24" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-purple-400/50 text-xs">
                No department payrun data available
              </div>
            )}
          </div>
        </div>

        {/* Attendance Activity Breakdown Widget */}
        <div className="bg-[#0b0914]/80 border border-purple-900/40 p-6 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock size={18} className="text-purple-400" />
                Attendance Log Activity
              </h2>
              <p className="text-xs text-purple-300/60">Aggregated punch record categories</p>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <span className="text-xs font-semibold text-amber-300">Present (On-Time)</span>
              <span className="text-sm font-bold text-white">{attendance.present || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/15 border border-purple-500/30">
              <span className="text-xs font-semibold text-purple-300">Overtime Worked</span>
              <span className="text-sm font-bold text-white">{attendance.overtime || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
              <span className="text-xs font-semibold text-yellow-300">Late Arrivals</span>
              <span className="text-sm font-bold text-white">{attendance.late || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
              <span className="text-xs font-semibold text-rose-400">Missing Check-Outs</span>
              <span className="text-sm font-bold text-white">{attendance.missingCheckout || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0e0c18] border border-purple-900/40">
              <span className="text-xs font-semibold text-purple-300/70">Manual HR Edits</span>
              <span className="text-sm font-bold text-purple-200">{attendance.manualEdits || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Alerts Panel */}
      <div className="bg-[#0b0914]/80 border border-purple-900/40 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-400/30">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Live Operational Compliance & System Alerts</h2>
              <p className="text-xs text-purple-300/60">Audits requiring HR / Payroll action</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
            {alerts.length} Active Notice{alerts.length === 1 ? '' : 's'}
          </span>
        </div>

        {alerts.length > 0 ? (
          <div className="space-y-2.5 mt-4">
            {alerts.map((alt: any) => (
              <div
                key={alt.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#06050b]/90 border border-purple-900/40 hover:border-amber-400/40 transition"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                    alt.category === 'Contract' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                    alt.category === 'Time Off' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                    alt.category === 'Attendance' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40' :
                    'bg-purple-600/20 text-purple-200 border border-purple-600/40'
                  }`}>
                    {alt.category}
                  </span>
                  <span className="text-xs text-purple-100">{alt.message}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-purple-300/50 text-xs">
            ✨ All systems clear — no compliance or operational alerts detected.
          </div>
        )}
      </div>
    </div>
  );
};
