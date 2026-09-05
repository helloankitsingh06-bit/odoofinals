import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  FileText, 
  Users, 
  Calendar, 
  Activity, 
  Building2, 
  TrendingUp, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  RefreshCw,
  Clock,
  Layers,
  Percent,
  Plus
} from 'lucide-react';
import { payrollService } from '../lib/payrollService';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all'); // 'all', 'current-month', 'prev-month'

  async function loadMetrics(filter = periodFilter) {
    setLoading(true);
    setError('');

    let params = {};
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    if (filter === 'current-month') {
      const start = new Date(y, m, 1).toISOString().split('T')[0];
      const end = new Date(y, m + 1, 0).toISOString().split('T')[0];
      params = { startDate: start, endDate: end };
    } else if (filter === 'prev-month') {
      const start = new Date(y, m - 1, 1).toISOString().split('T')[0];
      const end = new Date(y, m, 0).toISOString().split('T')[0];
      params = { startDate: start, endDate: end };
    }

    try {
      const data = await payrollService.dashboard.getMetrics(params);
      setMetrics(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMetrics(periodFilter);
  }, [periodFilter]);

  function formatINR(val) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  }

  const kpis = metrics?.kpis || {};
  const charts = metrics?.charts || {};
  const departmentCosts = charts.salaryCostByDepartment || [];
  const monthlyTrends = charts.monthlyTrends || [];

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      
      {/* Executive Welcome & Period Filter Bar */}
      <div className="p-6 glass-panel border border-stone-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 font-mono">
              Live Firestore Payroll Intelligence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Payroll Operations Dashboard
          </h1>
          <p className="text-xs text-stone-400">
            Real-time aggregate KPIs, department allocation, and attendance health.
          </p>
        </div>

        {/* Period Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-stone-900/80 p-1 rounded-xl border border-stone-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setPeriodFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition uppercase tracking-wider text-[11px] ${
                periodFilter === 'all'
                  ? 'bg-emerald-500 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter('current-month')}
              className={`px-3 py-1.5 rounded-lg transition uppercase tracking-wider text-[11px] ${
                periodFilter === 'current-month'
                  ? 'bg-emerald-500 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter('prev-month')}
              className={`px-3 py-1.5 rounded-lg transition uppercase tracking-wider text-[11px] ${
                periodFilter === 'prev-month'
                  ? 'bg-emerald-500 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Last Month
            </button>
          </div>

          <button
            onClick={() => loadMetrics(periodFilter)}
            className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-white transition"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <Link
            to="/payruns/new"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-stone-950 transition shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            <Plus className="w-4 h-4" />
            <span>New Payrun</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 5 CORE KPI CARDS (Live Firestore Aggregation) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* KPI 1: Total Net Salary Paid */}
        <div className="p-5 rounded-2xl glass-panel border border-stone-800/80 space-y-3 hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 font-bold">
              Disbursed
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black font-mono text-white">
              {formatINR(kpis.totalNetSalaryPaid)}
            </h3>
            <p className="text-[11px] text-stone-400 mt-1">
              Total Net Salary Paid
            </p>
          </div>
          <div className="pt-2 border-t border-stone-800/60 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{kpis.paidPayslipsCount || 0} paid payslips</span>
          </div>
        </div>

        {/* KPI 2: Payslips Generated */}
        <div className="p-5 rounded-2xl glass-panel border border-stone-800/80 space-y-3 hover:border-blue-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 font-bold">
              Volume
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black font-mono text-white">
              {kpis.payslipsGenerated || 0}
            </h3>
            <p className="text-[11px] text-stone-400 mt-1">
              Payslips Generated
            </p>
          </div>
          <div className="pt-2 border-t border-stone-800/60 text-[10px] font-mono text-stone-400 flex items-center justify-between">
            <span>{kpis.pendingPayslipsCount || 0} in pipeline</span>
            <span className="text-blue-400 font-bold">{kpis.paidPayslipsCount || 0} settled</span>
          </div>
        </div>

        {/* KPI 3: Average Salary */}
        <div className="p-5 rounded-2xl glass-panel border border-stone-800/80 space-y-3 hover:border-cyan-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 font-bold">
              Compensation
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black font-mono text-white">
              {formatINR(kpis.averageSalary)}
            </h3>
            <p className="text-[11px] text-stone-400 mt-1">
              Average Net Salary
            </p>
          </div>
          <div className="pt-2 border-t border-stone-800/60 text-[10px] font-mono text-stone-400">
            Per paid employee in period
          </div>
        </div>

        {/* KPI 4: Approved Time Off (Units: Days vs Hours) */}
        <div className="p-5 rounded-2xl glass-panel border border-stone-800/80 space-y-3 hover:border-purple-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 font-bold">
              Leaves
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black font-mono text-white">
              {kpis.approvedTimeOff?.summary || '0 Days'}
            </h3>
            <p className="text-[11px] text-stone-400 mt-1">
              Approved Time Off
            </p>
          </div>
          <div className="pt-2 border-t border-stone-800/60 text-[10px] font-mono text-purple-400 flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>{kpis.approvedTimeOff?.totalRequests || 0} approved request(s)</span>
          </div>
        </div>

        {/* KPI 5: Attendance Health Ratio */}
        <div className="p-5 rounded-2xl glass-panel border border-stone-800/80 space-y-3 hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 font-bold">
              Punctuality
            </span>
            <div
              className={`p-2 rounded-xl border ${
                (kpis.attendanceHealth?.score ?? 100) >= 90
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black font-mono text-white flex items-center gap-1">
              <span>{kpis.attendanceHealth?.score ?? 100}%</span>
            </h3>
            <p className="text-[11px] text-stone-400 mt-1">
              Attendance Health
            </p>
          </div>
          <div className="pt-2 border-t border-stone-800/60 text-[10px] font-mono text-stone-400 truncate">
            {kpis.attendanceHealth?.totalRecords > 0
              ? `${kpis.attendanceHealth.present} Pres, ${kpis.attendanceHealth.missingCheckout || 0} MissCheck`
              : '100% (No infractions recorded)'}
          </div>
        </div>

      </div>

      {/* CHARTS ROW (Responsive, resilient with sparse 1-2 month data) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART 1: Salary Cost by Department */}
        <div className="p-6 rounded-2xl glass-panel border border-stone-800 space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Salary Cost by Department
                </h3>
              </div>
              <p className="text-xs text-stone-400">
                Primary source: <span className="font-mono text-emerald-400">employees.department</span> with fallback to contract snapshot.
              </p>
            </div>
          </div>

          {departmentCosts.length === 0 ? (
            <div className="py-16 text-center text-stone-500 text-xs italic">
              No departmental compensation data available for selected period.
            </div>
          ) : (
            <div className="space-y-4">
              {departmentCosts.map((dept, idx) => (
                <div key={dept.department || idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">
                      {dept.department}
                    </span>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-stone-400">{dept.employeeCount} staff</span>
                      <span className="font-bold text-emerald-400">
                        {formatINR(dept.netTotal)} ({dept.percentage}%)
                      </span>
                    </div>
                  </div>
                  
                  {/* Visual Progress Meter */}
                  <div className="h-2.5 w-full bg-stone-900 rounded-full overflow-hidden border border-stone-800 p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(8, dept.percentage)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CHART 2: Monthly Trends */}
        <div className="p-6 rounded-2xl glass-panel border border-stone-800 space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Monthly Payrun Trends
                </h3>
              </div>
              <p className="text-xs text-stone-400">
                Total Net Salary Paid across payruns over time.
              </p>
            </div>
          </div>

          {monthlyTrends.length === 0 ? (
            <div className="py-16 text-center text-stone-500 text-xs italic">
              No historical payrun trends available. Launch a payrun to seed trend data.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Visual Column Chart */}
              <div className="h-32 flex items-end justify-around gap-3 px-3 pt-6 border-b border-stone-800/80 pb-2">
                {monthlyTrends.map((trend, idx) => {
                  const maxVal = Math.max(...monthlyTrends.map((t) => t.netTotal || 1));
                  const barHeightPct = Math.max(15, Math.round(((trend.netTotal || 0) / maxVal) * 100));

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <span className="text-[9px] font-mono font-bold text-emerald-400 opacity-0 group-hover:opacity-100 transition">
                        {formatINR(trend.netTotal)}
                      </span>
                      <div
                        className="w-full max-w-[56px] rounded-t-lg bg-gradient-to-t from-cyan-600/80 to-emerald-400 transition-all duration-500 shadow-[0_0_12px_rgba(16,185,129,0.2)] group-hover:brightness-125"
                        style={{ height: `${barHeightPct}%` }}
                      ></div>
                      <span className="text-[10px] font-mono text-stone-400 truncate max-w-[70px]">
                        {trend.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Itemized Trend List */}
              <div className="space-y-3">
                {monthlyTrends.map((trend, idx) => (
                  <div
                    key={trend.payrunId || idx}
                    className="p-3.5 rounded-xl bg-stone-900/40 border border-stone-800 flex items-center justify-between hover:border-cyan-500/40 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">
                          {trend.name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-stone-800 text-cyan-400 border border-stone-700">
                          {trend.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono block">
                        Period: {trend.period?.startDate} to {trend.period?.endDate} • {trend.employeeCount} staff
                      </span>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-sm font-black text-emerald-400 block">
                        {formatINR(trend.netTotal)}
                      </span>
                      <span className="text-[10px] text-stone-500">Gross: {formatINR(trend.grossTotal)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* QUICK SYSTEM SHORTCUTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/payruns"
          className="p-5 rounded-2xl glass-panel border border-stone-800 hover:border-emerald-500/40 transition group space-y-2 block"
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-400 group-hover:text-emerald-400">
            <span>Payrun Operations</span>
            <ArrowRight className="w-4 h-4" />
          </div>
          <p className="text-sm font-bold text-white">
            Manage Payruns & Disbursals
          </p>
          <p className="text-xs text-stone-400">
            Execute batch computations, review audit warnings, and finalize payslips.
          </p>
        </Link>

        <Link
          to="/salary-structures"
          className="p-5 rounded-2xl glass-panel border border-stone-800 hover:border-teal-500/40 transition group space-y-2 block"
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-400 group-hover:text-teal-400">
            <span>Compensation Tiers</span>
            <ArrowRight className="w-4 h-4" />
          </div>
          <p className="text-sm font-bold text-white">
            Salary Structures
          </p>
          <p className="text-xs text-stone-400">
            Configure ordered rule sets with automated dry-validation against forward references.
          </p>
        </Link>

        <Link
          to="/salary-rules"
          className="p-5 rounded-2xl glass-panel border border-stone-800 hover:border-purple-500/40 transition group space-y-2 block"
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-400 group-hover:text-purple-400">
            <span>Calculation Logic</span>
            <ArrowRight className="w-4 h-4" />
          </div>
          <p className="text-sm font-bold text-white">
            Salary Rules Master
          </p>
          <p className="text-xs text-stone-400">
            Build Fixed amounts, Percentage of upstream rules, and zero-eval math Formulas.
          </p>
        </Link>
      </div>

    </div>
  );
}
