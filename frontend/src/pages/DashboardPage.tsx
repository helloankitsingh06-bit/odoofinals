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
  ArrowRight,
  Filter
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
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
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const kpis = metrics?.kpis || {};
  const attendance = metrics?.attendanceSummary || {};
  const charts = metrics?.charts || {};
  const alerts = metrics?.alerts || [];

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/40 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Executive HR & Payroll Analytics</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time live SQL relational aggregations across contracts, attendance logs, and computed payslips.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-lg">
            <Filter size={14} className="text-slate-400" />
            <span className="text-xs text-slate-400">Department:</span>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="bg-transparent text-xs font-semibold text-emerald-400 focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900 text-slate-200">All Departments</option>
              <option value="Engineering" className="bg-slate-900 text-slate-200">Engineering</option>
              <option value="Human Resources" className="bg-slate-900 text-slate-200">Human Resources</option>
              <option value="Finance & Payroll" className="bg-slate-900 text-slate-200">Finance & Payroll</option>
              <option value="Executive" className="bg-slate-900 text-slate-200">Executive</option>
            </select>
          </div>

          <button
            onClick={fetchMetrics}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/20 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Net Salary Paid */}
        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-xl relative overflow-hidden group hover:border-emerald-500/50 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Net Paid</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            ${kpis.totalNetSalaryPaid?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1 font-medium">
            <CheckCircle2 size={12} /> Status: Paid Payslips
          </div>
        </div>

        {/* KPI 2: Payslips Generated */}
        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-xl relative overflow-hidden group hover:border-blue-500/50 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Payslips Created</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <FileCheck2 size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {kpis.payslipsGeneratedCount || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 font-medium">
            Itemized Rule Records
          </div>
        </div>

        {/* KPI 3: Average Salary */}
        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-xl relative overflow-hidden group hover:border-purple-500/50 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Average Take-Home</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            ${kpis.averageSalaryPaid?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-[11px] text-purple-400 mt-2 font-medium">
            Per Paid Employee
          </div>
        </div>

        {/* KPI 4: Approved Time Off */}
        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-xl relative overflow-hidden group hover:border-amber-500/50 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Approved Leave</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Calendar size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {kpis.approvedTimeOffDays || 0} <span className="text-xs font-normal text-slate-400">Days</span>
          </div>
          <div className="text-[11px] text-amber-400 mt-2 font-medium">
            + {kpis.approvedTimeOffHours || 0} Hours (Split Units)
          </div>
        </div>

        {/* KPI 5: Attendance Health */}
        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-xl relative overflow-hidden group hover:border-teal-500/50 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Attendance Health</span>
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <Activity size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {kpis.attendanceHealthScore || 100}%
          </div>
          <div className="text-[11px] text-teal-400 mt-2 font-medium">
            Present & Overtime Ratio
          </div>
        </div>
      </div>

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Salary Bar Chart */}
        <div className="lg:col-span-2 bg-slate-800/40 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 size={18} className="text-emerald-400" />
                Department Payroll Cost Distribution
              </h2>
              <p className="text-xs text-slate-400">Gross vs Net salary allocation by department</p>
            </div>
          </div>

          <div className="h-64">
            {charts.departmentSalaryChart && charts.departmentSalaryChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.departmentSalaryChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="department" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Bar dataKey="grossTotal" name="Gross Pay ($)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="netTotal" name="Net Pay ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No department payrun data available
              </div>
            )}
          </div>
        </div>

        {/* Attendance Activity Breakdown Widget */}
        <div className="bg-slate-800/40 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock size={18} className="text-blue-400" />
                Attendance Log Activity
              </h2>
              <p className="text-xs text-slate-400">Aggregated punch record categories</p>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-xs font-semibold text-emerald-400">Present (On-Time)</span>
              <span className="text-sm font-bold text-white">{attendance.present || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <span className="text-xs font-semibold text-purple-400">Overtime Worked</span>
              <span className="text-sm font-bold text-white">{attendance.overtime || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-xs font-semibold text-amber-400">Late Arrivals</span>
              <span className="text-sm font-bold text-white">{attendance.late || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <span className="text-xs font-semibold text-rose-400">Missing Check-Outs</span>
              <span className="text-sm font-bold text-white">{attendance.missingCheckout || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800 border border-slate-700">
              <span className="text-xs font-semibold text-slate-400">Manual HR Edits</span>
              <span className="text-sm font-bold text-slate-300">{attendance.manualEdits || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Alerts Panel */}
      <div className="bg-slate-800/40 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Live Operational Compliance & System Alerts</h2>
              <p className="text-xs text-slate-400">Audits requiring HR / Payroll action</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {alerts.length} Active Notice{alerts.length === 1 ? '' : 's'}
          </span>
        </div>

        {alerts.length > 0 ? (
          <div className="space-y-2 mt-4">
            {alerts.map((alt: any) => (
              <div
                key={alt.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 hover:border-slate-600 transition"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    alt.category === 'Contract' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                    alt.category === 'Time Off' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                    alt.category === 'Attendance' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {alt.category}
                  </span>
                  <span className="text-xs text-slate-200">{alt.message}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 text-xs">
            ✨ All systems clear — no compliance or operational alerts detected.
          </div>
        )}
      </div>
    </div>
  );
};
