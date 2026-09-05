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
  Sparkles,
  Search
} from 'lucide-react';

export const PayrunsPage: React.FC = () => {
  const { user } = useAuth();
  const [payruns, setPayruns] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [selectedPayrun, setSelectedPayrun] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Payrun Creation Wizard State
  const [showWizard, setShowWizard] = useState<boolean>(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [showExcluded, setShowExcluded] = useState<boolean>(false);
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

  const fetchPreview = async (structureId: string, start: string, end: string) => {
    if (!structureId || !start || !end) return;
    setPreviewLoading(true);
    try {
      const res = await apiRequest('/payruns/preview', {
        method: 'POST',
        body: JSON.stringify({
          salaryStructureId: structureId,
          periodStart: start,
          periodEnd: end
        })
      });
      setPreviewResult(res);
      setWizardData(prev => ({
        ...prev,
        selectedEmployeeIds: res.eligibleEmployees ? res.eligibleEmployees.map((e: any) => e.employeeId) : []
      }));
    } catch (err: any) {
      console.error('Failed to preview eligible employees:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Automatically fetch eligible preview when wizard opens or parameters change
  useEffect(() => {
    if (showWizard && wizardData.salaryStructureId && wizardData.periodStart && wizardData.periodEnd) {
      fetchPreview(wizardData.salaryStructureId, wizardData.periodStart, wizardData.periodEnd);
    }
  }, [showWizard, wizardData.salaryStructureId, wizardData.periodStart, wizardData.periodEnd]);

  // Fetch initial payruns & salary structures
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

      // If active payrun selected, refresh detail; otherwise auto-select latest payrun
      if (selectedPayrun) {
        const fresh = await apiRequest(`/payruns/${selectedPayrun.id}`);
        setSelectedPayrun(fresh);
      } else if (pData && pData.length > 0) {
        const fullFirst = await apiRequest(`/payruns/${pData[0].id}`);
        setSelectedPayrun(fullFirst);
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

  // Confirm Payrun Creation
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
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 dark:bg-[#0b0914]/80 p-5 rounded-3xl border border-slate-200/80 dark:border-purple-900/40 backdrop-blur-xl shadow-lg dark:shadow-2xl transition-colors duration-300">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/20 font-black">
            <DollarSign size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Payroll Processing & Payruns
            </h1>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-purple-300/70 font-medium">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Engine Ready
              </span>
              <span>•</span>
              <span>{payruns.length} {payruns.length === 1 ? 'Cycle' : 'Cycles'} on record</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-2xl text-xs font-black shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 transition active:scale-95 cursor-pointer"
        >
          <Plus size={16} /> Launch Payrun Wizard
        </button>
      </div>

      {/* Main Grid: Payrun List & Active Payrun Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Payrun List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} className="text-purple-600 dark:text-purple-400" /> Payroll History
            </h2>
            <span className="text-[11px] font-mono text-slate-400 font-semibold">{payruns.length} total</span>
          </div>

          {payruns.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-white/60 dark:bg-[#0b0914]/60 border border-dashed border-slate-200 dark:border-purple-900/40 text-slate-500 text-xs">
              No payruns created yet. Click "Launch Payrun Wizard" to start.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[75vh] overflow-y-auto pr-1">
              {payruns.map((pr) => {
                const isSelected = selectedPayrun?.id === pr.id;
                return (
                  <div
                    key={pr.id}
                    onClick={() => openPayrunDetail(pr)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-purple-50/90 dark:bg-[#141024] border-amber-500/60 dark:border-amber-400/60 shadow-md dark:shadow-xl shadow-amber-500/10 border-l-4 border-l-amber-500'
                        : 'bg-white dark:bg-[#0b0914]/80 border-slate-200/80 dark:border-purple-900/30 hover:border-purple-300 dark:hover:border-purple-700/60 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                        pr.status === 'Paid' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' :
                        pr.status === 'Validated' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-500/30' :
                        pr.status === 'Computed' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-500/30' :
                        'bg-slate-100 dark:bg-purple-950 text-slate-600 dark:text-purple-400 border border-slate-200 dark:border-purple-900/40'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          pr.status === 'Paid' ? 'bg-emerald-500' :
                          pr.status === 'Validated' ? 'bg-purple-500' :
                          pr.status === 'Computed' ? 'bg-indigo-500' : 'bg-slate-400'
                        }`}></span>
                        {pr.status}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-purple-400/70 font-mono font-semibold">
                        {pr.employees?.length || 0} Staff
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">{pr.name}</h3>
                    <div className="text-[11px] text-slate-500 dark:text-purple-300/70 mt-1 font-mono flex items-center gap-1">
                      <span>{new Date(pr.periodStart).toLocaleDateString()}</span>
                      <span>→</span>
                      <span>{new Date(pr.periodEnd).toLocaleDateString()}</span>
                    </div>
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1.5 truncate">
                      {pr.salaryStructure?.name}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Selected Payrun Processing Workbench */}
        <div className="lg:col-span-2">
          {selectedPayrun ? (
            <div className="bg-white dark:bg-[#0b0914]/80 border border-slate-200/80 dark:border-purple-900/40 rounded-3xl overflow-hidden shadow-lg dark:shadow-2xl flex flex-col transition-colors duration-300">
              {/* Payrun Banner & Actions */}
              <div className="p-5 sm:p-6 bg-slate-50/80 dark:bg-[#0e0c1a] border-b border-slate-200/80 dark:border-purple-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{selectedPayrun.name}</h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedPayrun.status === 'Paid' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' :
                      selectedPayrun.status === 'Validated' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-500/30' :
                      selectedPayrun.status === 'Computed' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-500/30' :
                      'bg-slate-100 dark:bg-purple-950 text-slate-600 dark:text-purple-400 border border-slate-200 dark:border-purple-900/40'
                    }`}>
                      {selectedPayrun.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-purple-300/70 mt-1 font-medium">
                    Structure: <strong className="text-slate-800 dark:text-amber-300">{selectedPayrun.salaryStructure?.name}</strong> • Period: <span className="font-mono">{new Date(selectedPayrun.periodStart).toLocaleDateString()} → {new Date(selectedPayrun.periodEnd).toLocaleDateString()}</span>
                  </p>
                </div>

                {/* Processing State Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {selectedPayrun.status !== 'Paid' && (
                    <button
                      onClick={handleCompute}
                      disabled={actionLoading}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-purple-600/20 transition active:scale-95 cursor-pointer"
                    >
                      <RefreshCw size={13} className={actionLoading ? 'animate-spin' : ''} />
                      {selectedPayrun.status === 'Draft' ? 'Run Engine Compute' : 'Re-Compute'}
                    </button>
                  )}

                  {selectedPayrun.status === 'Computed' && (
                    <button
                      onClick={handleValidate}
                      disabled={actionLoading}
                      className="px-3.5 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 size={13} className="text-amber-300" /> Validate Warnings
                    </button>
                  )}

                  {selectedPayrun.status === 'Validated' && isPayrollManagerOrAdmin && (
                    <button
                      onClick={handleMarkPaid}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/25 transition active:scale-95 cursor-pointer"
                    >
                      <DollarSign size={13} /> Mark as Paid
                    </button>
                  )}

                  {selectedPayrun.status === 'Paid' && (
                    <button
                      onClick={handleSendPayslips}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-gradient-to-r from-purple-700 via-purple-600 to-amber-600 hover:from-purple-600 hover:to-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition active:scale-95 cursor-pointer"
                    >
                      <Mail size={13} className="text-amber-300" /> Dispatch Emails & PDFs
                    </button>
                  )}
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5 pb-0">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#07060d] border border-slate-200/80 dark:border-white/[0.06]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Enrolled Staff</span>
                  <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
                    {selectedPayrun.payslips?.length || 0} <span className="text-xs font-normal text-slate-400">Employees</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#07060d] border border-slate-200/80 dark:border-white/[0.06]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Gross Disbursed</span>
                  <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
                    ₹{selectedPayrun.payslips?.reduce((s: number, p: any) => s + (p.grossTotal || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-500/20">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">Net Payout</span>
                  <div className="text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                    ₹{selectedPayrun.payslips?.reduce((s: number, p: any) => s + (p.netTotal || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Itemized Payslips Table */}
              <div className="p-5 flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-amber-300 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-500" /> Itemized Employee Payslips
                  </span>
                </div>

                <div className="border border-slate-200/80 dark:border-purple-900/40 rounded-2xl overflow-hidden bg-slate-50 dark:bg-[#06050b]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 dark:bg-[#0b0914] text-slate-600 dark:text-purple-300/70 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-purple-900/50">
                      <tr>
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Attendance</th>
                        <th className="px-4 py-3">Gross Salary</th>
                        <th className="px-4 py-3">Net Take-Home</th>
                        <th className="px-4 py-3">Audit</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-purple-950 text-slate-800 dark:text-purple-100 font-medium">
                      {selectedPayrun.payslips?.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-100/50 dark:hover:bg-purple-950/20 transition">
                          <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                                {p.employee?.name ? p.employee.name.charAt(0).toUpperCase() : 'E'}
                              </div>
                              <div>
                                <div className="text-xs">{p.employee?.name}</div>
                                <div className="text-[10px] text-slate-500 dark:text-purple-400/60 font-normal">{p.employee?.jobPosition}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold font-mono text-[10px]">
                              {p.workedDays} days
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold text-slate-700 dark:text-purple-200">
                            ₹{p.grossTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 font-mono font-black text-emerald-700 dark:text-amber-300 text-sm">
                            ₹{p.netTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3">
                            {p.warnings && p.warnings.length > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1 w-max">
                                <AlertTriangle size={11} /> {p.warnings.length} Warning(s)
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                                <Check size={12} /> Clean
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right space-x-1.5">
                            <button
                              onClick={() => setSelectedPayslip(p)}
                              className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-800 dark:text-purple-200 font-bold text-[11px] transition cursor-pointer"
                            >
                              Rule Lines
                            </button>
                            <button
                              onClick={() => handleDownloadPdf(p.id, p.employee.name)}
                              className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900/50 hover:border-amber-400/50 hover:bg-amber-50 dark:hover:bg-amber-400/15 text-amber-600 dark:text-amber-300 inline-block align-middle transition cursor-pointer"
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
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-purple-900/50 rounded-3xl text-slate-500 dark:text-purple-400/50 text-xs bg-white dark:bg-[#0b0914]/40">
              <DollarSign size={32} className="mb-2 text-amber-500/40 dark:text-amber-400/40" />
              Select a payrun from history or launch the Wizard to process new payroll.
            </div>
          )}
        </div>
      </div>

      {/* Payrun Creation Wizard Modal with Searchable Eligible Employee Checklist */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#090712] border border-purple-200 dark:border-purple-800/60 rounded-3xl w-full max-w-2xl p-6 shadow-2xl transition-colors duration-300 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-purple-100 dark:border-purple-900/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500 dark:text-amber-400" />
                  Payrun Creation Wizard
                </h2>
                <p className="text-xs text-slate-500 dark:text-purple-300/60 font-medium">
                  Configure cycle parameters & select eligible employees (only active staff with office attendance this month).
                </p>
              </div>
              <button
                onClick={() => { setShowWizard(false); setEmployeeSearchQuery(''); }}
                className="text-slate-400 dark:text-purple-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-purple-950/50 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Scrollable */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
              {/* Payrun Name */}
              <div>
                <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Payrun Name</label>
                <input
                  type="text"
                  required
                  value={wizardData.name}
                  onChange={(e) => setWizardData({ ...wizardData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium text-xs"
                  placeholder="e.g. September 2026 Payroll"
                />
              </div>

              {/* Salary Structure & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Target Salary Structure</label>
                  <select
                    value={wizardData.salaryStructureId}
                    onChange={(e) => setWizardData({ ...wizardData, salaryStructureId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium cursor-pointer text-xs truncate"
                  >
                    {structures.map(s => (
                      <option key={s.id} value={s.id} className="bg-white dark:bg-[#0b0914] text-slate-900 dark:text-white">{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Period Start</label>
                  <input
                    type="date"
                    required
                    value={wizardData.periodStart}
                    onChange={(e) => setWizardData({ ...wizardData, periodStart: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Period End</label>
                  <input
                    type="date"
                    required
                    value={wizardData.periodEnd}
                    onChange={(e) => setWizardData({ ...wizardData, periodEnd: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium text-xs"
                  />
                </div>
              </div>

              {/* Eligible Employees Checklist Section */}
              <div className="space-y-2.5 pt-2 border-t border-purple-100 dark:border-purple-900/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-slate-800 dark:text-purple-200 font-bold flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      Eligible Employees Checklist
                    </label>
                    {previewResult && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                        {previewResult.eligibleCount || 0} Eligible
                      </span>
                    )}
                    {previewResult && previewResult.excludedCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium text-[10px]">
                        {previewResult.excludedCount} Excluded
                      </span>
                    )}
                  </div>

                  {previewResult && previewResult.eligibleEmployees && previewResult.eligibleEmployees.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const filtered = previewResult.eligibleEmployees.filter((emp: any) =>
                          emp.name.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
                          emp.jobPosition?.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
                          emp.department?.toLowerCase().includes(employeeSearchQuery.toLowerCase())
                        );
                        const allFilteredSelected = filtered.every((e: any) => wizardData.selectedEmployeeIds.includes(e.employeeId));
                        if (allFilteredSelected) {
                          const filteredIds = new Set(filtered.map((e: any) => e.employeeId));
                          setWizardData(prev => ({
                            ...prev,
                            selectedEmployeeIds: prev.selectedEmployeeIds.filter(id => !filteredIds.has(id))
                          }));
                        } else {
                          const newIds = new Set([...wizardData.selectedEmployeeIds, ...filtered.map((e: any) => e.employeeId)]);
                          setWizardData(prev => ({ ...prev, selectedEmployeeIds: Array.from(newIds) }));
                        }
                      }}
                      className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      {previewResult.eligibleEmployees
                        .filter((emp: any) =>
                          emp.name.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
                          emp.jobPosition?.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
                          emp.department?.toLowerCase().includes(employeeSearchQuery.toLowerCase())
                        )
                        .every((e: any) => wizardData.selectedEmployeeIds.includes(e.employeeId))
                        ? 'Deselect All'
                        : 'Select All'}
                    </button>
                  )}
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-purple-400" />
                  <input
                    type="text"
                    value={employeeSearchQuery}
                    onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                    placeholder="Search eligible employees by name (e.g. Krish), role, or department..."
                    className="w-full pl-8 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                  {employeeSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setEmployeeSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Checklist List Container */}
                {previewLoading ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/40 rounded-2xl space-y-2">
                    <RefreshCw size={20} className="animate-spin text-amber-500 mx-auto" />
                    <p className="text-slate-500 dark:text-purple-300/70 text-xs font-medium">Checking employee eligibility & attendance...</p>
                  </div>
                ) : !previewResult || previewResult.eligibleCount === 0 ? (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle size={14} />
                      No employees currently eligible for this cycle
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-purple-200/70">
                      Employees must have a contract starting on or before <strong>{new Date(wizardData.periodStart).toLocaleDateString()}</strong> and active attendance logged in the office during this period.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto p-2 bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-2xl">
                    {(() => {
                      const filtered = previewResult.eligibleEmployees.filter((emp: any) =>
                        emp.name.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
                        emp.jobPosition?.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
                        emp.department?.toLowerCase().includes(employeeSearchQuery.toLowerCase())
                      );

                      if (filtered.length === 0) {
                        return (
                          <div className="py-6 text-center text-slate-400 text-xs">
                            No eligible employees match "<span className="font-semibold text-slate-600 dark:text-slate-200">{employeeSearchQuery}</span>"
                          </div>
                        );
                      }

                      return filtered.map((emp: any) => {
                        const isSelected = wizardData.selectedEmployeeIds.includes(emp.employeeId);
                        return (
                          <label
                            key={emp.employeeId}
                            className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition select-none ${
                              isSelected
                                ? 'bg-purple-100/90 dark:bg-purple-950/70 border border-amber-500/50 dark:border-amber-400/50 shadow-sm'
                                : 'bg-white dark:bg-[#0c0a15] opacity-60 border border-slate-200 dark:border-white/[0.04] hover:opacity-90'
                            }`}
                          >
                            <div className="flex items-center gap-3">
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
                                className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                              />
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black flex items-center justify-center text-xs shadow-sm">
                                {emp.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 dark:text-white text-xs">{emp.name}</span>
                                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold font-mono text-[9px]">
                                    ✓ {emp.workedDays || 0} days present
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-500 dark:text-purple-300/70 font-medium">
                                  {emp.jobPosition} • {emp.department}
                                </span>
                              </div>
                            </div>
                            <span className="text-[11px] font-mono text-amber-600 dark:text-amber-300 font-bold">
                              ₹{emp.wage.toLocaleString('en-IN')}/mo
                            </span>
                          </label>
                        );
                      });
                    })()}
                  </div>
                )}

                {/* Excluded Employees Breakdown Toggle */}
                {previewResult && previewResult.excludedEmployees && previewResult.excludedEmployees.length > 0 && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowExcluded(!showExcluded)}
                      className="text-[11px] font-bold text-slate-500 dark:text-purple-400/80 hover:text-slate-800 dark:hover:text-purple-200 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{showExcluded ? '▼ Hide' : '▶ Show'} Excluded Employees ({previewResult.excludedEmployees.length})</span>
                    </button>

                    {showExcluded && (
                      <div className="mt-1.5 space-y-1 max-h-32 overflow-y-auto p-2 rounded-xl bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05]">
                        {previewResult.excludedEmployees.map((ex: any) => (
                          <div key={ex.employeeId} className="p-2 rounded-lg bg-white/70 dark:bg-[#0c0a15] border border-slate-200/60 dark:border-white/[0.04] text-[11px]">
                            <div className="flex justify-between items-center font-semibold text-slate-800 dark:text-slate-200">
                              <span>{ex.name}</span>
                              <span className="text-[10px] text-rose-500 font-semibold">Not Eligible</span>
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{ex.reason}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-purple-100 dark:border-purple-900/40">
              <button
                type="button"
                onClick={() => { setShowWizard(false); setEmployeeSearchQuery(''); }}
                className="px-4 py-2 bg-slate-100 dark:bg-purple-950/60 border border-slate-200 dark:border-purple-900/50 text-slate-600 dark:text-purple-300 rounded-xl hover:bg-slate-200 dark:hover:bg-purple-900/40 font-bold cursor-pointer text-xs"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleWizardConfirm}
                disabled={!wizardData.selectedEmployeeIds || wizardData.selectedEmployeeIds.length === 0 || actionLoading}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl font-black shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-xs flex items-center gap-1.5 transition active:scale-95"
              >
                {actionLoading ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" /> Creating Payrun...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} /> Confirm & Launch Draft Payrun ({wizardData.selectedEmployeeIds?.length || 0})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Itemized Payslip Rule Breakdown Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-[#090712] border border-purple-200 dark:border-purple-800/60 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 transition-colors duration-300">
            <div className="flex items-center justify-between border-b border-purple-100 dark:border-purple-900/50 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles size={16} className="text-amber-500 dark:text-amber-400" />
                  {selectedPayslip.employee?.name} — Itemized Payslip
                </h3>
                <p className="text-xs text-slate-500 dark:text-purple-300/70 font-medium">Worked Days: {selectedPayslip.workedDays} • Status: {selectedPayslip.status}</p>
              </div>
              <button onClick={() => setSelectedPayslip(null)} className="text-slate-400 dark:text-purple-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedPayslip.lines?.map((l: any) => {
                const isDeduction = l.category.toLowerCase() === 'deduction';
                return (
                  <div key={l.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/40 text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{l.name}</span>
                      <span className="text-[10px] text-slate-500 dark:text-purple-400/60 font-mono ml-2">[{l.code}]</span>
                    </div>
                    <span className={`font-mono font-black ${isDeduction ? 'text-rose-400' : 'text-amber-300'}`}>
                      {isDeduction ? '-' : ''}₹{Math.abs(l.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-2xl space-y-1 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-purple-300/70 font-medium">
                <span>Gross Earnings:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">₹{selectedPayslip.grossTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-amber-700 dark:text-amber-300 font-black text-sm pt-1.5 border-t border-purple-100 dark:border-purple-950">
                <span>Net Take-Home Pay:</span>
                <span className="font-mono">₹{selectedPayslip.netTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => handleDownloadPdf(selectedPayslip.id, selectedPayslip.employee.name)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Download size={14} /> Download Official PDF
              </button>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-purple-950/60 border border-slate-200 dark:border-purple-900/50 text-slate-600 dark:text-purple-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-purple-900/40 cursor-pointer"
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
