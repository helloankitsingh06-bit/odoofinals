import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Calculator, 
  CheckCircle2, 
  CreditCard, 
  Send, 
  RotateCcw, 
  AlertTriangle, 
  Eye, 
  Calendar, 
  Users, 
  Building2, 
  ArrowLeft,
  AlertCircle,
  Clock,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { payrollService } from '../lib/payrollService';
import PayslipDetailModal from '../components/PayslipDetailModal';

const STATUS_STEPS = ['Draft', 'Computed', 'Validated', 'Paid'];

export default function PayrunProcessing() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [payrun, setPayrun] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Selected payslip for modal
  const [activePayslip, setActivePayslip] = useState(null);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [payrunData, payslipsData] = await Promise.all([
        payrollService.payruns.get(id),
        payrollService.payruns.getPayslips(id),
      ]);
      setPayrun(payrunData);
      setPayslips(payslipsData);
    } catch (err) {
      setError(err.message || 'Failed to load payrun details');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  // Action Handlers
  async function handleCompute() {
    setActionLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await payrollService.payruns.compute(id);
      setSuccessMessage('Payrun computed successfully across all employees.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Computation failed');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleValidate() {
    setActionLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const validated = await payrollService.payruns.validate(id);
      setSuccessMessage('Payrun validated. Audit warnings compiled for review.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Validation failed');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMarkPaid() {
    if (!window.confirm('Confirm disbursement: This will finalize all employee payslips and record payment timestamps. Proceed?')) {
      return;
    }
    setActionLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await payrollService.payruns.markPaid(id);
      setSuccessMessage('Payrun successfully marked as Paid. Funds disbursed.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Mark Paid failed');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReopen() {
    if (!window.confirm('Reopen this payrun back to Draft status to recalculate or add employees?')) {
      return;
    }
    setActionLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await payrollService.payruns.reopen(id);
      setSuccessMessage('Payrun reverted back to Draft status.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Reopen failed');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSendPayslips() {
    setActionLoading(true);
    setError('');
    try {
      // Send for each payslip
      await Promise.all(payslips.map((p) => payrollService.payslips.send(p.id)));
      setSuccessMessage(`Official payslips dispatched via email to all ${payslips.length} employees.`);
    } catch (err) {
      setError(err.message || 'Failed to dispatch payslips');
    } finally {
      setActionLoading(false);
    }
  }

  function formatINR(val) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val || 0);
  }

  if (loading) {
    return (
      <div className="py-24 text-center text-stone-500 glass-panel">
        <div className="flex items-center justify-center gap-2">
          <div className="h-5 w-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
          <span className="text-sm">Loading payrun workspace...</span>
        </div>
      </div>
    );
  }

  if (!payrun) {
    return (
      <div className="p-8 text-center glass-panel space-y-3">
        <AlertCircle className="w-8 h-8 mx-auto text-rose-400" />
        <p className="text-white text-sm font-bold">Payrun Not Found</p>
        <Link to="/payruns" className="text-xs text-emerald-400 hover:underline">
          Return to Payruns List
        </Link>
      </div>
    );
  }

  const currentStatus = payrun.status;
  const isDraft = currentStatus === 'Draft';
  const isComputed = currentStatus === 'Computed';
  const isValidated = currentStatus === 'Validated';
  const isPaid = currentStatus === 'Paid';

  const currentStepIdx = STATUS_STEPS.indexOf(currentStatus);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Top Header Card */}
      <div className="p-6 glass-panel border border-stone-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/payruns')}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 font-mono">
                    Batch ID: {payrun.id}
                  </span>
                </div>
                <h1 className="text-2xl font-black tracking-tight text-white mt-0.5">
                  {payrun.name}
                </h1>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-stone-300">
              <Calendar className="w-4 h-4 text-emerald-400" />
              {payrun.period?.startDate} to {payrun.period?.endDate}
            </span>
            <span className="flex items-center gap-1.5 text-stone-300">
              <Users className="w-4 h-4 text-emerald-400" />
              {payrun.totalEmployees || payrun.employeeIds?.length || 0} Employees
            </span>
          </div>
        </div>

        {/* State Machine Pipeline Progress Bar */}
        <div className="pt-4 border-t border-stone-800/80">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-stone-800 -translate-y-1/2 z-0"></div>
            <div
              className="absolute top-1/2 left-0 h-0.5 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-500"
              style={{
                width: `${(currentStepIdx / (STATUS_STEPS.length - 1)) * 100}%`,
              }}
            ></div>

            {STATUS_STEPS.map((step, idx) => {
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <div key={step} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition duration-300 ${
                      isCurrent
                        ? 'bg-emerald-500 text-stone-950 ring-4 ring-emerald-500/20 shadow-lg'
                        : isPast
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/60'
                        : 'bg-stone-900 text-stone-600 border border-stone-800'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider mt-1.5 font-bold ${
                      isCurrent
                        ? 'text-emerald-400'
                        : isPast
                        ? 'text-stone-300'
                        : 'text-stone-600'
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* STATE MACHINE ACTION BAR */}
      <div className="p-4 rounded-2xl glass-panel border border-stone-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold">
            Actions Pipeline:
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-stone-900 border border-stone-700 text-stone-200">
            Current: {currentStatus}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Action 1: Compute (Allowed in Draft or Re-compute in Computed) */}
          <button
            type="button"
            disabled={(!isDraft && !isComputed) || actionLoading}
            onClick={handleCompute}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              isDraft || isComputed
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                : 'bg-stone-900/60 text-stone-600 border border-stone-800 cursor-not-allowed'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>{isComputed ? 'Re-Compute' : 'Compute'}</span>
          </button>

          {/* Action 2: Validate (Strictly in Computed) */}
          <button
            type="button"
            disabled={!isComputed || actionLoading}
            onClick={handleValidate}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              isComputed
                ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-[0_0_15px_rgba(20,184,166,0.3)]'
                : 'bg-stone-900/60 text-stone-600 border border-stone-800 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Validate Pre-Checks</span>
          </button>

          {/* Action 3: Mark Paid (Strictly in Validated) */}
          <button
            type="button"
            disabled={!isValidated || actionLoading}
            onClick={handleMarkPaid}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              isValidated
                ? 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                : 'bg-stone-900/60 text-stone-600 border border-stone-800 cursor-not-allowed'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Disburse & Mark Paid</span>
          </button>

          {/* Action 4: Send Payslips (Strictly when Paid) */}
          <button
            type="button"
            disabled={!isPaid || actionLoading}
            onClick={handleSendPayslips}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              isPaid
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]'
                : 'bg-stone-900/60 text-stone-600 border border-stone-800 cursor-not-allowed'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Payslips</span>
          </button>

          {/* Reopen Action (Only in Computed or Validated) */}
          {(isComputed || isValidated) && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleReopen}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-400 hover:text-white bg-stone-900 border border-stone-800 hover:bg-stone-800 transition"
              title="Revert back to Draft"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reopen</span>
            </button>
          )}
        </div>
      </div>

      {/* PROMINENT AUDIT & WARNINGS ROLL-UP BANNER */}
      {payrun.warningSummary?.totalWarnings > 0 && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-200 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Pre-Finalization Audit: {payrun.warningSummary.totalWarnings} Warning(s) Flagged Across {payrun.warningSummary.countWithWarnings} Employee(s)
                </h3>
                <p className="text-[11px] text-amber-300/80">
                  These are soft warnings detected by the engine (e.g. MissingCheckout attendance or unbanked status). They will not block finalization unless overriden.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-amber-500/20 text-xs">
            {payrun.warningSummary.warnings?.map((item, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-stone-950/60 border border-amber-500/20 space-y-1">
                <span className="font-mono text-[10px] text-amber-400 font-bold block">
                  Employee: {item.employeeId}
                </span>
                <ul className="text-[11px] text-stone-300 list-disc list-inside space-y-0.5">
                  {item.warnings.map((msg, wIdx) => (
                    <li key={wIdx}>{msg}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-stone-800/80 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500">Gross Total</span>
          <p className="text-2xl font-black text-white font-mono">
            {payrun.totalGross ? formatINR(payrun.totalGross) : '—'}
          </p>
          <span className="text-[11px] text-stone-500 font-mono">Total earnings & allowances</span>
        </div>
        <div className="p-5 rounded-2xl glass-panel border border-stone-800/80 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500">Net Payable Total</span>
          <p className="text-2xl font-black text-emerald-400 font-mono">
            {payrun.totalNet ? formatINR(payrun.totalNet) : '—'}
          </p>
          <span className="text-[11px] text-stone-500 font-mono">Net disbursement obligation</span>
        </div>
        <div className="p-5 rounded-2xl glass-panel border border-stone-800/80 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500">Total Deductions</span>
          <p className="text-2xl font-black text-rose-400 font-mono">
            {payrun.totalGross && payrun.totalNet
              ? formatINR(payrun.totalGross - payrun.totalNet)
              : '—'}
          </p>
          <span className="text-[11px] text-stone-500 font-mono">Statutory & voluntary withholdings</span>
        </div>
      </div>

      {/* Generated Payslips Table */}
      <div className="glass-panel border border-stone-800 overflow-hidden space-y-4">
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Employee Payslip Line Items ({payslips.length})
            </h3>
          </div>
          <span className="text-xs text-stone-500 font-mono">
            Click &ldquo;View Payslip&rdquo; to inspect structured breakdown
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-800/80 bg-stone-900/40 text-[10px] font-mono uppercase tracking-widest text-stone-400">
                <th className="py-3 px-4 font-semibold">Employee ID</th>
                <th className="py-3 px-4 font-semibold">Worked Days</th>
                <th className="py-3 px-4 font-semibold">Gross Pay</th>
                <th className="py-3 px-4 font-semibold">Net Pay</th>
                <th className="py-3 px-4 font-semibold">Audit Warnings</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/40 text-xs">
              {payslips.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-stone-500">
                    No payslips computed yet. Click the &ldquo;Compute&rdquo; button above to generate payslips.
                  </td>
                </tr>
              ) : (
                payslips.map((ps) => {
                  const hasWarnings = ps.warnings && ps.warnings.length > 0;

                  return (
                    <tr key={ps.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        <div>{ps.employee?.name || ps.employeeId}</div>
                        <span className="text-[10px] font-normal text-stone-500">
                          ID: {ps.employeeId}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-stone-300">
                        {ps.workedDays} / {ps.scheduledDays || 22}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-stone-200">
                        {formatINR(ps.grossTotal)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        {formatINR(ps.netTotal)}
                      </td>
                      <td className="py-3.5 px-4">
                        {hasWarnings ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            {ps.warnings.length} warning(s)
                          </span>
                        ) : (
                          <span className="text-[11px] text-stone-500 font-mono">Clean</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-stone-900 border border-stone-800 text-stone-300">
                          {ps.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setActivePayslip(ps)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Payslip</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payslip Modal View */}
      {activePayslip && (
        <PayslipDetailModal
          payslip={activePayslip}
          onClose={() => setActivePayslip(null)}
        />
      )}

    </div>
  );
}
