import React from 'react';
import { 
  X, 
  Printer, 
  Building2, 
  Calendar, 
  User, 
  CreditCard, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

export default function PayslipDetailModal({ payslip, onClose }) {
  if (!payslip) return null;

  const earnings = (payslip.ruleBreakdown || []).filter(
    (r) => r.category === 'Basic' || r.category === 'Allowance' || r.category === 'Gross'
  );
  const deductions = (payslip.ruleBreakdown || []).filter(
    (r) => r.category === 'Deduction'
  );

  const totalEarnings = earnings
    .filter((r) => r.category !== 'Gross')
    .reduce((acc, r) => acc + (r.amount || 0), 0);

  const totalDeductions = deductions.reduce((acc, r) => acc + (r.amount || 0), 0);

  function formatINR(val) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val || 0);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl my-8 bg-stone-950 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:my-0 print:max-w-full">
        
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-900/50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-300">
              Official Payroll Document
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
              {payslip.status || 'Computed'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-300 bg-stone-800 hover:bg-stone-700 transition"
              title="Print Payslip"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Payslip Document Body */}
        <div className="p-8 sm:p-10 space-y-8 bg-stone-950 text-stone-200 print:p-6 print:bg-white print:text-black">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-stone-800 print:border-stone-300">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 print:bg-stone-100 print:text-black">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-white print:text-black">
                    AssetFlow Technologies
                  </h2>
                  <p className="text-xs text-stone-400 print:text-stone-600 font-mono">
                    Enterprise Payroll & Asset Disbursement Unit
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right sm:text-right space-y-1">
              <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-400 font-bold print:text-stone-700">
                Payslip Reference
              </span>
              <p className="text-sm font-mono font-bold text-white print:text-black truncate max-w-xs">
                {payslip.id}
              </p>
              <p className="text-xs text-stone-400 print:text-stone-600">
                Period: {payslip.period?.startDate} to {payslip.period?.endDate}
              </p>
            </div>
          </div>

          {/* Employee & Attendance Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-xl bg-stone-900/40 border border-stone-800/80 print:bg-stone-50 print:border-stone-200">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 flex items-center gap-1.5">
                <User className="w-3 h-3 text-emerald-400" /> Employee ID
              </span>
              <p className="text-sm font-semibold text-stone-200 print:text-black truncate">
                {payslip.employee?.name || payslip.employeeId}
              </p>
              <p className="text-[11px] font-mono text-stone-400 print:text-stone-600">
                ID: {payslip.employeeId}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-emerald-400" /> Contract Ref
              </span>
              <p className="text-sm font-semibold text-stone-200 print:text-black truncate">
                {payslip.contractId || 'Active Contract'}
              </p>
              <p className="text-[11px] font-mono text-emerald-400/90 print:text-stone-600">
                Structure: {payslip.salaryStructureId}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-emerald-400" /> Attendance Ratio
              </span>
              <p className="text-sm font-semibold text-stone-200 print:text-black">
                {payslip.workedDays} / {payslip.scheduledDays || 22} Days
              </p>
              <p className="text-[11px] font-mono text-stone-400 print:text-stone-600">
                {payslip.workedDays < (payslip.scheduledDays || 22) ? 'Prorated' : 'Full Attendance'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 flex items-center gap-1.5">
                <CreditCard className="w-3 h-3 text-emerald-400" /> Bank Account
              </span>
              <p className="text-sm font-mono font-semibold text-stone-200 print:text-black">
                {payslip.employee?.bankAccount || payslip.employee?.bankAccountNumber || 'Not on File'}
              </p>
              <p className="text-[11px] text-stone-400 print:text-stone-600">
                Disbursement: Direct Deposit
              </p>
            </div>
          </div>

          {/* Warnings Banner if any */}
          {payslip.warnings && payslip.warnings.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1 print:bg-stone-100 print:text-amber-800">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Audit & Compliance Notice</span>
              </div>
              <ul className="text-xs list-disc list-inside space-y-0.5 text-amber-300/90 print:text-stone-700">
                {payslip.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Breakdown Table: Side-by-Side Earnings & Deductions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Earnings Column */}
            <div className="rounded-xl border border-stone-800 bg-stone-900/30 overflow-hidden print:border-stone-300 print:bg-transparent">
              <div className="px-5 py-3 border-b border-stone-800 bg-stone-900/60 flex items-center justify-between print:border-stone-300 print:bg-stone-100">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white print:text-black">
                    Earnings & Allowances
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-stone-400">Rate / Amount</span>
              </div>

              <div className="p-4 space-y-2.5">
                {earnings.map((rule) => (
                  <div
                    key={rule.ruleId || rule.code}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-stone-800/40 last:border-0 print:border-stone-200"
                  >
                    <div>
                      <span className="font-semibold text-stone-200 print:text-black">
                        {rule.name}
                      </span>
                      <span className="ml-2 font-mono text-[10px] text-emerald-400/80 uppercase">
                        [{rule.code}]
                      </span>
                    </div>
                    <span className="font-mono font-medium text-white print:text-black">
                      {formatINR(rule.amount)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 border-t border-stone-800 bg-stone-900/40 flex items-center justify-between text-xs font-bold print:border-stone-300 print:bg-stone-50">
                <span className="uppercase tracking-wider text-stone-300 print:text-black">
                  Gross Earnings
                </span>
                <span className="font-mono text-emerald-400 print:text-black text-sm">
                  {formatINR(payslip.grossTotal)}
                </span>
              </div>
            </div>

            {/* Deductions Column */}
            <div className="rounded-xl border border-stone-800 bg-stone-900/30 overflow-hidden print:border-stone-300 print:bg-transparent">
              <div className="px-5 py-3 border-b border-stone-800 bg-stone-900/60 flex items-center justify-between print:border-stone-300 print:bg-stone-100">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white print:text-black">
                    Statutory & Voluntary Deductions
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-stone-400">Amount</span>
              </div>

              <div className="p-4 space-y-2.5">
                {deductions.length === 0 ? (
                  <p className="text-xs text-stone-500 italic py-4 text-center">
                    No statutory deductions recorded for this pay cycle.
                  </p>
                ) : (
                  deductions.map((rule) => (
                    <div
                      key={rule.ruleId || rule.code}
                      className="flex items-center justify-between text-xs py-1.5 border-b border-stone-800/40 last:border-0 print:border-stone-200"
                    >
                      <div>
                        <span className="font-semibold text-stone-200 print:text-black">
                          {rule.name}
                        </span>
                        <span className="ml-2 font-mono text-[10px] text-rose-400/80 uppercase">
                          [{rule.code}]
                        </span>
                      </div>
                      <span className="font-mono font-medium text-rose-300 print:text-black">
                        - {formatINR(rule.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="px-5 py-3 border-t border-stone-800 bg-stone-900/40 flex items-center justify-between text-xs font-bold print:border-stone-300 print:bg-stone-50">
                <span className="uppercase tracking-wider text-stone-300 print:text-black">
                  Total Deductions
                </span>
                <span className="font-mono text-rose-400 print:text-black text-sm">
                  {formatINR(totalDeductions)}
                </span>
              </div>
            </div>

          </div>

          {/* Net Payable Highlight Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-stone-900 to-emerald-950/60 border-2 border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl print:bg-stone-100 print:border-stone-400">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-300 print:text-black">
                  Net Salary Payable
                </span>
              </div>
              <p className="text-[11px] text-stone-400 print:text-stone-600 mt-1">
                Net Pay = Gross Earnings ({formatINR(payslip.grossTotal)}) − Total Deductions ({formatINR(totalDeductions)})
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white print:text-black drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                {formatINR(payslip.netTotal)}
              </span>
            </div>
          </div>

          {/* Footer & Signature Block */}
          <div className="pt-6 border-t border-stone-800/80 flex flex-col sm:flex-row justify-between items-end gap-6 text-[10px] text-stone-500 font-mono print:border-stone-300 print:text-stone-600">
            <div>
              <p>CONFIDENTIAL & PROPRIETARY — SYSTEM GENERATED PAYSLIP</p>
              <p>Generated by AssetFlow Payroll Engine v2.0 • Zero-Eval AST Architecture</p>
            </div>
            <div className="text-center sm:text-right border-t border-stone-700 sm:border-0 pt-3 sm:pt-0">
              <div className="h-8 border-b border-dashed border-stone-700 w-48 mb-1"></div>
              <p className="uppercase tracking-wider">Authorized Officer Signature</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
