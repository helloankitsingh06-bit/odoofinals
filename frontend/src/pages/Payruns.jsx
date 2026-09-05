import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Calendar, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck,
  Search,
  DollarSign
} from 'lucide-react';
import { payrollService } from '../lib/payrollService';

const STATUS_BADGES = {
  Draft: 'bg-stone-800 text-stone-300 border-stone-700',
  Computed: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  Validated: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
  Paid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
};

export default function Payruns() {
  const [payruns, setPayruns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  async function loadPayruns() {
    setLoading(true);
    setError('');
    try {
      const data = await payrollService.payruns.list();
      setPayruns(data);
    } catch (err) {
      setError(err.message || 'Failed to load payruns');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayruns();
  }, []);

  function formatINR(val) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  }

  const filtered = payruns.filter((p) =>
    (p.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="p-6 glass-panel border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 font-mono">
              Batch Payroll Processing
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">
            Payrun Operations
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">
            Stage, compute, validate, and disburse scheduled payroll batches.
          </p>
        </div>

        <Link
          to="/payruns/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Start Payrun Wizard</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-stone-800/80 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500">Total Batches</span>
          <p className="text-2xl font-black text-white font-mono">{payruns.length}</p>
          <span className="text-[11px] text-stone-500 font-mono">All-time payruns</span>
        </div>
        <div className="p-5 rounded-2xl glass-panel border border-stone-800/80 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500">Active In-Flight</span>
          <p className="text-2xl font-black text-cyan-400 font-mono">
            {payruns.filter((p) => p.status !== 'Paid').length}
          </p>
          <span className="text-[11px] text-stone-500 font-mono">Draft / Computed / Validated</span>
        </div>
        <div className="p-5 rounded-2xl glass-panel border border-stone-800/80 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500">Completed Disbursals</span>
          <p className="text-2xl font-black text-emerald-400 font-mono">
            {payruns.filter((p) => p.status === 'Paid').length}
          </p>
          <span className="text-[11px] text-stone-500 font-mono">Finalized & Paid</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-stone-950/60 border border-stone-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            placeholder="Search payruns by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-stone-900 border border-stone-800 text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>
      </div>

      {/* Payrun Cards / List */}
      {loading ? (
        <div className="py-16 text-center text-stone-500 glass-panel">
          <div className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
            <span className="text-xs">Loading payruns...</span>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-stone-500 glass-panel space-y-3">
          <p className="text-xs">No payruns configured yet.</p>
          <Link
            to="/payruns/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-xs text-emerald-400 hover:bg-stone-800 font-semibold"
          >
            Launch Payrun Wizard <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((payrun) => (
            <div
              key={payrun.id}
              onClick={() => navigate(`/payruns/${payrun.id}`)}
              className="p-5 rounded-2xl glass-panel border border-stone-800/80 hover:border-emerald-500/40 transition duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono border ${
                      STATUS_BADGES[payrun.status] || 'bg-stone-800 text-stone-300'
                    }`}
                  >
                    {payrun.status}
                  </span>
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
                    {payrun.name}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-stone-400 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-500" />
                    {payrun.period?.startDate} to {payrun.period?.endDate}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-stone-500" />
                    {payrun.employeeIds?.length || 0} Employees
                  </span>
                  {payrun.warningSummary?.totalWarnings > 0 && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {payrun.warningSummary.totalWarnings} Warning(s)
                    </span>
                  )}
                </div>
              </div>

              {/* Totals & Next Action */}
              <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-stone-800/50">
                <div className="text-left md:text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 block">
                    Total Net Pay
                  </span>
                  <span className="text-lg font-black font-mono text-emerald-400">
                    {payrun.totalNet ? formatINR(payrun.totalNet) : '—'}
                  </span>
                </div>

                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-stone-300 bg-stone-900 border border-stone-800 group-hover:bg-emerald-500 group-hover:text-stone-950 transition">
                  <span>Process</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
