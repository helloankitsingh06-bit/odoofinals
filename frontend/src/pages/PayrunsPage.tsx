import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Download,
  ChevronRight,
  Plus,
  RefreshCw,
  X,
  Check,
  Sparkles
} from 'lucide-react';

export const PayrunsPage: React.FC = () => {
  const { user } = useAuth();
  const [payruns, setPayruns] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [selectedPayrun, setSelectedPayrun] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // 2-Step Wizard State
  const [showWizard, setShowWizard] = useState<boolean>(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [wizardData, setWizardData] = useState({
    name: '',
    salaryStructureId: '',
    periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10),
    selectedEmployeeIds: [] as string[]
  });
  const [previewResult, setPreviewResult] = useState<any | null>(null);

  // Payslip Detail Modal
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pData, sData] = await Promise.all([
        apiRequest('/payruns'),
        apiRequest('/salary-structures/structures')
      ]);
      setPayruns(pData);
      setStructures(sData);

      if (sData.length > 0 && !wizardData.salaryStructureId) {
        setWizardData(prev => ({
          ...prev,
          salaryStructureId: sData[0].id,
          name: `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()} Payroll`
        }));
      }

      // If active payrun selected, refresh detail
      if (selectedPayrun) {
        const fresh = await apiRequest(`/payruns/${selectedPayrun.id}`);
        setSelectedPayrun(fresh);
      }
    } catch (err) {
      console.error('Failed to load payruns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openPayrunDetail = async (pr: any) => {
    try {
      const fullPr = await apiRequest(`/payruns/${pr.id}`);
      setSelectedPayrun(fullPr);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Step 1: Preview Eligible Employees
  const handleWizardStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await apiRequest('/payruns/preview', {
        method: 'POST',
        body: JSON.stringify({
          salaryStructureId: wizardData.salaryStructureId,
          periodStart: wizardData.periodStart,
          periodEnd: wizardData.periodEnd
        })
      });
      setPreviewResult(res);
      setWizardData(prev => ({
        ...prev,
        selectedEmployeeIds: res.eligibleEmployees.map((e: any) => e.employeeId)
      }));
      setWizardStep(2);
    } catch (err: any) {
      alert(err.message || 'Failed to preview eligible employees');
    } finally {
      setActionLoading(false);
    }
  };

  // Step 2: Confirm Creation
  const handleWizardConfirm = async () => {
    setActionLoading(true);
    try {
      const newPayrun = await apiRequest('/payruns', {
        method: 'POST',
        body: JSON.stringify({
          name: wizardData.name,
          salaryStructureId: wizardData.salaryStructureId,
          periodStart: wizardData.periodStart,
          periodEnd: wizardData.periodEnd,
          employeeIds: wizardData.selectedEmployeeIds
        })
      });
      setShowWizard(false);
      setWizardStep(1);
      setPreviewResult(null);
      await fetchData();
      openPayrunDetail(newPayrun);
    } catch (err: any) {
      alert(err.message || 'Failed to create payrun');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Compute
  const handleCompute = async () => {
    if (!selectedPayrun) return;
    setActionLoading(true);
    try {
      await apiRequest(`/payruns/${selectedPayrun.id}/compute`, { method: 'POST' });
      const fresh = await apiRequest(`/payruns/${selectedPayrun.id}`);
      setSelectedPayrun(fresh);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Validate
  const handleValidate = async () => {
    if (!selectedPayrun) return;
    setActionLoading(true);
    try {
      const res = await apiRequest(`/payruns/${selectedPayrun.id}/validate`, { method: 'POST' });
      const fresh = await apiRequest(`/payruns/${selectedPayrun.id}`);
      setSelectedPayrun(fresh);
      fetchData();
      if (res.warningsCount > 0) {
        alert(`Validation Complete: ${res.warningsCount} warnings logged (non-blocking).`);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Mark Paid
  const handleMarkPaid = async () => {
    if (!selectedPayrun) return;
    setActionLoading(true);
    try {
      await apiRequest(`/payruns/${selectedPayrun.id}/mark-paid`, { method: 'POST' });
      const fresh = await apiRequest(`/payruns/${selectedPayrun.id}`);
      setSelectedPayrun(fresh);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Send Payslips
  const handleSendPayslips = async () => {
    if (!selectedPayrun) return;
    setActionLoading(true);
    try {
      const res = await apiRequest(`/payruns/${selectedPayrun.id}/send-payslips`, { method: 'POST' });
      alert(`Success: ${res.message}`);
      const fresh = await apiRequest(`/payruns/${selectedPayrun.id}`);
      setSelectedPayrun(fresh);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Download PDF
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
      alert(err.message);
    }
  };

  const isPayrollManagerOrAdmin = user?.role === 'HRPayrollManager' || user?.role === 'Admin';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0b0914]/80 p-5 rounded-3xl border border-purple-900/40 backdrop-blur-xl shadow-2xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <DollarSign className="text-amber-400" />
            Payroll Processing Engine & Payruns
          </h1>
          <p className="text-sm text-purple-200/60">
            Lifecycle: 2-Step Staged Wizard → Pure Engine Compute → Rule Validation → Mark Paid → Email/PDF Dispatch.
          </p>
        </div>

        <button
          onClick={() => { setShowWizard(true); setWizardStep(1); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 transition active:scale-95"
        >
          <Plus size={16} /> Launch Payrun Wizard
        </button>
      </div>

      {/* Main Grid: Payrun List & Active Payrun Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Payrun List */}
        <div className="space-y-3">
          <h2 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={13} className="text-purple-400" /> Payroll History
          </h2>
          <div className="space-y-2.5 max-h-[75vh] overflow-y-auto pr-1">
            {payruns.map((pr) => {
              const isSelected = selectedPayrun?.id === pr.id;
              return (
                <div
                  key={pr.id}
                  onClick={() => openPayrunDetail(pr)}
                  className={`p-4 rounded-3xl border cursor-pointer transition-all duration-300 ${
                    isSelected
                      ? 'bg-[#151126] border-amber-400/60 shadow-xl shadow-amber-500/10 scale-[1.01]'
                      : 'bg-[#0b0914]/80 border-purple-900/40 hover:border-purple-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      pr.status === 'Paid' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' :
                      pr.status === 'Validated' ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30' :
                      pr.status === 'Computed' ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30' :
                      'bg-purple-950 text-purple-400 border border-purple-900/40'
                    }`}>
                      {pr.status}
                    </span>
                    <span className="text-[10px] text-purple-400/60 font-mono font-medium">
                      {pr.employees?.length || 0} Employees
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-sm">{pr.name}</h3>
                  <div className="text-[11px] text-purple-300/70 mt-1 font-mono">
                    {new Date(pr.periodStart).toISOString().slice(0, 10)} to {new Date(pr.periodEnd).toISOString().slice(0, 10)}
                  </div>
                  <div className="text-[10px] text-amber-300 font-semibold mt-1">
                    Structure: {pr.salaryStructure?.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Payrun Processing Workbench */}
        <div className="lg:col-span-2">
          {selectedPayrun ? (
            <div className="bg-[#0b0914]/80 border border-purple-900/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
              {/* Payrun Banner & Actions */}
              <div className="p-6 bg-[#0e0c1a] border-b border-purple-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{selectedPayrun.name}</h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedPayrun.status === 'Paid' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' :
                      selectedPayrun.status === 'Validated' ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30' :
                      selectedPayrun.status === 'Computed' ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30' :
                      'bg-purple-950 text-purple-400 border border-purple-900/40'
                    }`}>
                      {selectedPayrun.status}
                    </span>
                  </div>
                  <p className="text-xs text-purple-300/70 mt-1">
                    Structure: <strong className="text-amber-300">{selectedPayrun.salaryStructure?.name}</strong> • Period: <span className="font-mono">{new Date(selectedPayrun.periodStart).toISOString().slice(0, 10)} to {new Date(selectedPayrun.periodEnd).toISOString().slice(0, 10)}</span>
                  </p>
                </div>

                {/* Processing State Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {selectedPayrun.status !== 'Paid' && (
                    <button
                      onClick={handleCompute}
                      disabled={actionLoading}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition active:scale-95"
                    >
                      <RefreshCw size={13} className={actionLoading ? 'animate-spin' : ''} />
                      {selectedPayrun.status === 'Draft' ? 'Run Engine Compute' : 'Re-Compute'}
                    </button>
                  )}

                  {selectedPayrun.status === 'Computed' && (
                    <button
                      onClick={handleValidate}
                      disabled={actionLoading}
                      className="px-3.5 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition active:scale-95"
                    >
                      <CheckCircle2 size={13} className="text-amber-300" /> Validate Warnings
                    </button>
                  )}

                  {selectedPayrun.status === 'Validated' && isPayrollManagerOrAdmin && (
                    <button
                      onClick={handleMarkPaid}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/25 transition active:scale-95"
                    >
                      <DollarSign size={13} /> Mark as Paid
                    </button>
                  )}

                  {selectedPayrun.status === 'Paid' && (
                    <button
                      onClick={handleSendPayslips}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-gradient-to-r from-purple-700 via-purple-600 to-amber-600 hover:from-purple-600 hover:to-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-600/20 transition active:scale-95"
                    >
                      <Mail size={13} className="text-amber-300" /> Dispatch Emails & PDFs
                    </button>
                  )}
                </div>
              </div>

              {/* Payslips Table */}
              <div className="p-5 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                  <span className="text-xs font-bold text-amber-300">Itemized Employee Payslips</span>
                  <span className="text-xs text-purple-300/70 font-mono">
                    Total Gross: ₹{selectedPayrun.payslips?.reduce((s: number, p: any) => s + p.grossTotal, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} | Total Net: <strong className="text-amber-300">₹{selectedPayrun.payslips?.reduce((s: number, p: any) => s + p.netTotal, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </span>
                </div>

                <div className="border border-purple-900/40 rounded-2xl overflow-hidden bg-[#06050b]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0b0914] text-purple-300/70 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-4 py-3.5">Employee</th>
                        <th className="px-4 py-3.5">Worked Days</th>
                        <th className="px-4 py-3.5">Gross Salary</th>
                        <th className="px-4 py-3.5">Net Take-Home</th>
                        <th className="px-4 py-3.5">Audit Warnings</th>
                        <th className="px-4 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-950 text-purple-100">
                      {selectedPayrun.payslips?.map((p: any) => (
                        <tr key={p.id} className="hover:bg-purple-950/20 transition">
                          <td className="px-4 py-3.5 font-bold text-white">
                            <div>{p.employee?.name}</div>
                            <div className="text-[10px] text-purple-400/60 font-normal">{p.employee?.jobPosition}</div>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-purple-300">{p.workedDays} days</td>
                          <td className="px-4 py-3.5 font-mono font-semibold text-purple-200">₹{p.grossTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="px-4 py-3.5 font-mono font-black text-amber-300 text-sm">
                            ₹{p.netTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3.5">
                            {p.warnings && p.warnings.length > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-max">
                                <AlertTriangle size={11} /> {p.warnings.length} Warning(s)
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-300/90 flex items-center gap-1 font-semibold">
                                <Check size={12} className="text-amber-400" /> Clean
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right space-x-2">
                            <button
                              onClick={() => setSelectedPayslip(p)}
                              className="px-2.5 py-1 rounded-xl bg-purple-950/60 border border-purple-900/50 hover:bg-purple-900/60 text-purple-200 font-bold text-[11px] transition"
                            >
                              Rule Lines
                            </button>
                            <button
                              onClick={() => handleDownloadPdf(p.id, p.employee.name)}
                              className="p-1.5 rounded-xl bg-purple-950/60 border border-purple-900/50 hover:border-amber-400/50 hover:bg-amber-400/15 text-amber-300 inline-block align-middle transition"
                              title="Download PDF Payslip"
                            >
                              <Download size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-purple-900/50 rounded-3xl text-purple-400/50 text-xs bg-[#0b0914]/40">
              <DollarSign size={32} className="mb-2 text-amber-400/40" />
              Select a payrun from history or launch the Wizard to process new payroll.
            </div>
          )}
        </div>
      </div>

      {/* 2-Step Payrun Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#090712] border border-purple-800/60 rounded-3xl w-full max-w-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-400" />
                  Payrun Creation Wizard
                </h2>
                <p className="text-xs text-purple-300/60">Step {wizardStep} of 2 • {wizardStep === 1 ? 'Configure Staged Parameters (No DB write)' : 'Review & Confirm Eligible Employees'}</p>
              </div>
              <button onClick={() => setShowWizard(false)} className="text-purple-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Step 1: Configuration Form */}
            {wizardStep === 1 && (
              <form onSubmit={handleWizardStep1} className="space-y-4 text-xs">
                <div>
                  <label className="block text-purple-300/80 mb-1 font-semibold">Payrun Name</label>
                  <input
                    type="text"
                    required
                    value={wizardData.name}
                    onChange={(e) => setWizardData({ ...wizardData, name: e.target.value })}
                    className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-purple-300/80 mb-1 font-semibold">Target Salary Structure</label>
                  <select
                    value={wizardData.salaryStructureId}
                    onChange={(e) => setWizardData({ ...wizardData, salaryStructureId: e.target.value })}
                    className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  >
                    {structures.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-purple-300/80 mb-1 font-semibold">Period Start</label>
                    <input
                      type="date"
                      required
                      value={wizardData.periodStart}
                      onChange={(e) => setWizardData({ ...wizardData, periodStart: e.target.value })}
                      className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-300/80 mb-1 font-semibold">Period End</label>
                    <input
                      type="date"
                      required
                      value={wizardData.periodEnd}
                      onChange={(e) => setWizardData({ ...wizardData, periodEnd: e.target.value })}
                      className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-purple-900/40">
                  <button
                    type="button"
                    onClick={() => setShowWizard(false)}
                    className="px-4 py-2 bg-purple-950/60 border border-purple-900/50 text-purple-300 rounded-xl hover:bg-purple-900/40 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                  >
                    Next: Filter Eligible Employees <ChevronRight size={14} />
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Confirmation & Employee Selection */}
            {wizardStep === 2 && previewResult && (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-[#06050b] border border-purple-900/50 rounded-2xl space-y-1">
                  <div className="text-white font-bold">{wizardData.name}</div>
                  <div className="text-purple-300/70 text-[11px]">
                    Found <strong className="text-amber-300">{previewResult.eligibleCount}</strong> eligible employees with active contracts. ({previewResult.excludedCount} excluded due to existing payslip).
                  </div>
                </div>

                <div>
                  <label className="block text-purple-300/80 mb-1 font-semibold">Select Employees to Include:</label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto p-2.5 bg-[#06050b] border border-purple-900/50 rounded-2xl">
                    {previewResult.eligibleEmployees.map((emp: any) => {
                      const isSelected = wizardData.selectedEmployeeIds.includes(emp.employeeId);
                      return (
                        <label
                          key={emp.employeeId}
                          className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                            isSelected ? 'bg-purple-950/60 border border-amber-400/40 shadow-sm' : 'bg-[#08070e] opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setWizardData(prev => ({ ...prev, selectedEmployeeIds: [...prev.selectedEmployeeIds, emp.employeeId] }));
                                } else {
                                  setWizardData(prev => ({ ...prev, selectedEmployeeIds: prev.selectedEmployeeIds.filter(id => id !== emp.employeeId) }));
                                }
                              }}
                              className="rounded text-amber-500"
                            />
                            <span className="font-bold text-white">{emp.name}</span>
                            <span className="text-[10px] text-purple-400/70">({emp.jobPosition})</span>
                          </div>
                          <span className="text-[10px] font-mono text-amber-300 font-bold">₹{emp.wage.toLocaleString('en-IN')}/mo</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between gap-2 pt-4 border-t border-purple-900/40">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2 bg-purple-950/60 border border-purple-900/50 text-purple-300 rounded-xl hover:bg-purple-900/40 font-bold"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleWizardConfirm}
                    disabled={wizardData.selectedEmployeeIds.length === 0 || actionLoading}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl font-black shadow-lg shadow-amber-500/20"
                  >
                    {actionLoading ? 'Creating...' : `Confirm & Create Draft Payrun (${wizardData.selectedEmployeeIds.length})`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Itemized Payslip Rule Breakdown Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#090712] border border-purple-800/60 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-purple-900/50 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <Sparkles size={16} className="text-amber-400" />
                  {selectedPayslip.employee?.name} — Itemized Payslip
                </h3>
                <p className="text-xs text-purple-300/70">Worked Days: {selectedPayslip.workedDays} • Status: {selectedPayslip.status}</p>
              </div>
              <button onClick={() => setSelectedPayslip(null)} className="text-purple-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedPayslip.lines?.map((l: any) => {
                const isDeduction = l.category.toLowerCase() === 'deduction';
                return (
                  <div key={l.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#06050b] border border-purple-900/40 text-xs">
                    <div>
                      <span className="font-bold text-white">{l.name}</span>
                      <span className="text-[10px] text-purple-400/60 font-mono ml-2">[{l.code}]</span>
                    </div>
                    <span className={`font-mono font-black ${isDeduction ? 'text-rose-400' : 'text-amber-300'}`}>
                      {isDeduction ? '-' : ''}₹{Math.abs(l.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="p-3.5 bg-[#06050b] border border-purple-900/50 rounded-2xl space-y-1 text-xs">
              <div className="flex justify-between text-purple-300/70">
                <span>Gross Earnings:</span>
                <span className="font-mono font-bold text-white">₹{selectedPayslip.grossTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-amber-300 font-black text-sm pt-1.5 border-t border-purple-950">
                <span>Net Take-Home Pay:</span>
                <span className="font-mono">₹{selectedPayslip.netTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => handleDownloadPdf(selectedPayslip.id, selectedPayslip.employee.name)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
              >
                <Download size={14} /> Download Official PDF
              </button>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="px-4 py-2 bg-purple-950/60 border border-purple-900/50 text-purple-300 rounded-xl text-xs font-bold hover:bg-purple-900/40"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
