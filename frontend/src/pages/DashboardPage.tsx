import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useTheme } from '../context/ThemeContext';
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
  const { isDark } = useTheme();
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
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500 dark:border-amber-400 border-r-purple-600 dark:border-r-purple-400"></div>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 dark:bg-[#0b0914]/80 p-5 rounded-3xl border border-purple-100 dark:border-purple-900/40 backdrop-blur-xl shadow-lg dark:shadow-2xl transition-colors duration-300">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles className="text-amber-500 dark:text-amber-400" size={24} />
            Executive HR & Payroll Analytics
          </h1>
          <p className="text-sm text-slate-600 dark:text-purple-200/60 mt-0.5 font-medium">
            Real-time live SQL relational aggregations across contracts, attendance logs, and computed payslips.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 px-3 py-2 rounded-xl">
            <Filter size={14} className="text-purple-600 dark:text-purple-400" />
            <span className="text-xs text-slate-600 dark:text-purple-300/70 font-medium">Department:</span>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="bg-transparent text-xs font-bold text-amber-600 dark:text-amber-300 focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-white dark:bg-[#0b0914] text-slate-900 dark:text-purple-100">All Departments</option>
              <option value="Engineering" className="bg-white dark:bg-[#0b0914] text-slate-900 dark:text-purple-100">Engineering</option>
              <option value="Human Resources" className="bg-white dark:bg-[#0b0914] text-slate-900 dark:text-purple-100">Human Resources</option>
              <option value="Finance & Payroll" className="bg-white dark:bg-[#0b0914] text-slate-900 dark:text-purple-100">Finance & Payroll</option>
              <option value="Executive" className="bg-white dark:bg-[#0b0914] text-slate-900 dark:text-purple-100">Executive</option>
            </select>
          </div>

          <button
            onClick={fetchMetrics}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Net Salary Paid (Gold) */}
        <div className="bg-white dark:bg-[#0b0914]/80 border border-amber-200 dark:border-amber-500/30 p-5 rounded-2xl relative overflow-hidden group hover:border-amber-400/60 transition shadow-sm hover:shadow-md dark:shadow-xl bg-gradient-to-br from-amber-500/5 dark:from-amber-500/10 to-transparent">
          <div className="flex items-center justify-between text-slate-600 dark:text-purple-200/70 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-300">Total Net Paid</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-400/30">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            ${kpis.totalNetSalaryPaid?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1 font-semibold">
            <CheckCircle2 size={12} /> Status: Paid Payslips
          </div>
        </div>

        {/* KPI 2: Payslips Generated (Purple) */}
        <div className="bg-white dark:bg-[#0b0914]/80 border border-purple-200 dark:border-purple-500/30 p-5 rounded-2xl relative overflow-hidden group hover:border-purple-400/60 transition shadow-sm hover:shadow-md dark:shadow-xl bg-gradient-to-br from-purple-500/5 dark:from-purple-500/10 to-transparent">
          <div className="flex items-center justify-between text-slate-600 dark:text-purple-200/70 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">Payslips Created</span>
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-400/30">
              <FileCheck2 size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {kpis.payslipsGeneratedCount || 0}
          </div>
          <div className="text-[11px] text-purple-700 dark:text-purple-300/80 mt-2 font-semibold">
            Itemized Rule Records
          </div>
        </div>

        {/* KPI 3: Average Salary (Gold) */}
        <div className="bg-white dark:bg-[#0b0914]/80 border border-yellow-200 dark:border-yellow-500/30 p-5 rounded-2xl relative overflow-hidden group hover:border-yellow-400/60 transition shadow-sm hover:shadow-md dark:shadow-xl bg-gradient-to-br from-yellow-500/5 dark:from-yellow-500/10 to-transparent">
          <div className="flex items-center justify-between text-slate-600 dark:text-purple-200/70 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-700 dark:text-yellow-300">Average Take-Home</span>
            <div className="p-2 rounded-xl bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border border-yellow-400/30">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            ${kpis.averageSalaryPaid?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-[11px] text-yellow-700 dark:text-yellow-400 mt-2 font-semibold">
            Per Paid Employee
          </div>
        </div>

        {/* KPI 4: Approved Time Off (Purple) */}
        <div className="bg-white dark:bg-[#0b0914]/80 border border-violet-200 dark:border-violet-500/30 p-5 rounded-2xl relative overflow-hidden group hover:border-violet-400/60 transition shadow-sm hover:shadow-md dark:shadow-xl bg-gradient-to-br from-violet-500/5 dark:from-violet-500/10 to-transparent">
          <div className="flex items-center justify-between text-slate-600 dark:text-purple-200/70 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">Approved Leave</span>
            <div className="p-2 rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-400/30">
              <Calendar size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {kpis.approvedTimeOffDays || 0} <span className="text-xs font-normal text-slate-500 dark:text-purple-300/60">Days</span>
          </div>
          <div className="text-[11px] text-violet-700 dark:text-violet-300 mt-2 font-semibold">
            + {kpis.approvedTimeOffHours || 0} Hours (Split Units)
          </div>
        </div>

        {/* KPI 5: Attendance Health (Gold) */}
        <div className="bg-white dark:bg-[#0b0914]/80 border border-amber-200 dark:border-amber-400/30 p-5 rounded-2xl relative overflow-hidden group hover:border-amber-400/60 transition shadow-sm hover:shadow-md dark:shadow-xl bg-gradient-to-br from-amber-400/5 dark:from-amber-400/10 to-transparent">
          <div className="flex items-center justify-between text-slate-600 dark:text-purple-200/70 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-300">Attendance Health</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-400/30">
              <Activity size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {kpis.attendanceHealthScore || 100}%
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 font-semibold">
            Present & Overtime Ratio
          </div>
        </div>
      </div>

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Salary Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0b0914]/80 border border-purple-100 dark:border-purple-900/40 p-6 rounded-3xl shadow-md dark:shadow-xl transition-colors duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 size={18} className="text-amber-500 dark:text-amber-400" />
                Department Payroll Cost Distribution
              </h2>
              <p className="text-xs text-slate-500 dark:text-purple-300/60 font-medium">Gross vs Net salary allocation by department</p>
            </div>
          </div>

          <div className="h-64">
            {charts.departmentSalaryChart && charts.departmentSalaryChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.departmentSalaryChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1d1730" />
                  <XAxis dataKey="department" stroke="#a78bfa" fontSize={11} />
                  <YAxis stroke="#a78bfa" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0b0914' : '#ffffff',
                      borderColor: isDark ? '#4c1d95' : '#e2e8f0',
                      borderRadius: '12px',
                      color: isDark ? '#f5f3ff' : '#0f172a',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                    }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Bar dataKey="grossTotal" name="Gross Pay ($)" fill="#c084fc" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="netTotal" name="Net Pay ($)" fill="#fbbf24" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-purple-400/50 text-xs font-medium">
                No department payrun data available
              </div>
            )}
          </div>
        </div>

        {/* Attendance Activity Breakdown Widget */}
        <div className="bg-white dark:bg-[#0b0914]/80 border border-purple-100 dark:border-purple-900/40 p-6 rounded-3xl shadow-md dark:shadow-xl transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock size={18} className="text-purple-600 dark:text-purple-400" />
                Attendance Log Activity
              </h2>
              <p className="text-xs text-slate-500 dark:text-purple-300/60 font-medium">Aggregated punch record categories</p>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/30">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Present (On-Time)</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{attendance.present || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/20 dark:border-purple-500/30">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Overtime Worked</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{attendance.overtime || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 dark:border-yellow-500/30">
              <span className="text-xs font-bold text-yellow-700 dark:text-yellow-300">Late Arrivals</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{attendance.late || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 dark:border-rose-500/30">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Missing Check-Outs</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{attendance.missingCheckout || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#0e0c18] border border-slate-200 dark:border-purple-900/40">
              <span className="text-xs font-bold text-slate-600 dark:text-purple-300/70">Manual HR Edits</span>
              <span className="text-sm font-bold text-slate-800 dark:text-purple-200">{attendance.manualEdits || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Alerts Panel */}
      <div className="bg-white dark:bg-[#0b0914]/80 border border-purple-100 dark:border-purple-900/40 p-6 rounded-3xl shadow-md dark:shadow-xl transition-colors duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-400/30">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Live Operational Compliance & System Alerts</h2>
              <p className="text-xs text-slate-500 dark:text-purple-300/60 font-medium">Audits requiring HR / Payroll action</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-sm">
            {alerts.length} Active Notice{alerts.length === 1 ? '' : 's'}
          </span>
        </div>

        {alerts.length > 0 ? (
          <div className="space-y-2.5 mt-4">
            {alerts.map((alt: any) => (
              <div
                key={alt.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#06050b]/90 border border-slate-200 dark:border-purple-900/40 hover:border-amber-400/40 transition"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                    alt.category === 'Contract' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/40' :
                    alt.category === 'Time Off' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40' :
                    alt.category === 'Attendance' ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-500/40' :
                    'bg-purple-100 dark:bg-purple-600/20 text-purple-700 dark:text-purple-200 border border-purple-300 dark:border-purple-600/40'
                  }`}>
                    {alt.category}
                  </span>
                  <span className="text-xs text-slate-800 dark:text-purple-100 font-medium">{alt.message}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 dark:text-purple-300/50 text-xs font-medium">
            ✨ All systems clear — no compliance or operational alerts detected.
          </div>
        )}
      </div>
    </div>
  );
};
