import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  User,
  Calendar,
  DollarSign,
  Briefcase,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { contractService } from '../lib/contractService';
import { employeeService } from '../lib/employeeService';
import { CONTRACT_STATUS, VALID_CONTRACT_STATUSES } from '../constants';
import { useAuth } from '../hooks/useAuth';

export default function Contracts({ defaultEmployeeId }) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const employeeIdParam = defaultEmployeeId || searchParams.get('employeeId') || '';

  const isPayrollOrAdmin = ['Admin', 'HRPayrollUser', 'HRPayrollManager'].includes(
    user?.role
  );

  const [contracts, setContracts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employeeIdParam);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [isOpenEnded, setIsOpenEnded] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: employeeIdParam || '',
    startDate: '',
    endDate: '',
    wage: '',
    salaryStructureId: '',
    department: '',
    jobPosition: '',
    status: CONTRACT_STATUS.DRAFT,
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [overlapConflict, setOverlapConflict] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [contractData, empData] = await Promise.all([
        contractService.list({ employeeId: selectedEmployeeId || undefined }),
        employeeService.list(),
      ]);
      setContracts(
        Array.isArray(contractData) ? contractData : contractData.items || []
      );
      setEmployees(Array.isArray(empData) ? empData : empData.items || []);
    } catch (err) {
      console.error('Error loading contracts:', err);
      setError(err.message || 'Failed to load contracts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedEmployeeId]);

  // Map employees by id
  const employeeMap = useMemo(() => {
    const map = {};
    for (const emp of employees) {
      map[emp.id] = emp;
    }
    return map;
  }, [employees]);

  // Filtered contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      if (selectedStatus && c.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const empName = employeeMap[c.employeeId]?.name || '';
        const matchEmp = empName.toLowerCase().includes(q);
        const matchDept = c.department && c.department.toLowerCase().includes(q);
        const matchPos = c.jobPosition && c.jobPosition.toLowerCase().includes(q);
        if (!matchEmp && !matchDept && !matchPos) return false;
      }
      return true;
    });
  }, [contracts, selectedStatus, searchQuery, employeeMap]);

  // Open Create/Edit modal
  const handleOpenModal = (contract = null) => {
    setFormError('');
    setOverlapConflict(null);

    if (contract) {
      setEditingContract(contract);
      setIsOpenEnded(!contract.endDate);
      setFormData({
        employeeId: contract.employeeId || '',
        startDate: contract.startDate || '',
        endDate: contract.endDate || '',
        wage: contract.wage !== undefined ? contract.wage : '',
        salaryStructureId: contract.salaryStructureId || '',
        department: contract.department || '',
        jobPosition: contract.jobPosition || '',
        status: contract.status || CONTRACT_STATUS.DRAFT,
      });
    } else {
      setEditingContract(null);
      setIsOpenEnded(false);
      const defaultEmp = selectedEmployeeId ? employeeMap[selectedEmployeeId] : null;
      setFormData({
        employeeId: selectedEmployeeId || '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        wage: '',
        salaryStructureId: '',
        department: defaultEmp?.department || '',
        jobPosition: defaultEmp?.jobPosition || '',
        status: CONTRACT_STATUS.DRAFT,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingContract(null);
    setFormError('');
    setOverlapConflict(null);
  };

  // Autofill department and position when selecting employee in form
  const handleEmployeeSelect = (empId) => {
    const emp = employeeMap[empId];
    setFormData((prev) => ({
      ...prev,
      employeeId: empId,
      department: emp?.department || prev.department,
      jobPosition: emp?.jobPosition || prev.jobPosition,
    }));
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');
    setOverlapConflict(null);

    if (!formData.employeeId) {
      setFormError('Please select an employee.');
      return;
    }
    if (!formData.startDate) {
      setFormError('Start date is required.');
      return;
    }

    const payload = {
      ...formData,
      endDate: isOpenEnded ? null : formData.endDate || null,
      wage: formData.wage !== '' ? Number(formData.wage) : 0,
    };

    setFormSubmitting(true);
    try {
      if (editingContract) {
        await contractService.update(editingContract.id, payload);
        setSuccessMsg('Contract updated successfully.');
      } else {
        await contractService.create(payload);
        setSuccessMsg('Contract created successfully.');
      }
      handleCloseModal();
      await fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Contract save error:', err);
      setFormError(err.message || 'Failed to save contract.');
      if (err.conflictingContractId || err.payload?.conflictingContractId) {
        setOverlapConflict({
          id: err.conflictingContractId || err.payload?.conflictingContractId,
          dates: err.conflictingDates || err.payload?.conflictingDates,
        });
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (contract) => {
    if (!window.confirm(`Delete contract (${contract.id})?`)) return;
    try {
      await contractService.remove(contract.id);
      setSuccessMsg('Contract deleted successfully.');
      await fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to delete contract.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5">
        <div>
          <h2 className="text-xl font-bold tracking-wider text-asset-light uppercase flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-emerald-400" />
            Contract Management
          </h2>
          <p className="text-xs text-stone-400 font-mono mt-1">
            Total Contracts: <span className="text-emerald-400 font-bold">{contracts.length}</span> (Active:{' '}
            {contracts.filter((c) => c.status === 'Active').length})
          </p>
        </div>

        {isPayrollOrAdmin && (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-[#1e3427]/90 hover:bg-[#254231] text-[#76c893] border border-[#2d523c] px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] shadow-accent-glow"
          >
            <Plus className="h-4 w-4" />
            New Contract
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 px-4 py-3 rounded-lg text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {successMsg}
        </div>
      )}
      {error && (
        <div className="bg-red-950/30 border border-red-800/40 text-red-300 px-4 py-3 rounded-lg text-xs font-mono flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-400" />
          {error}
        </div>
      )}

      {/* Filters Bar */}
      <div className="glass-panel p-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee, department, or position..."
            className="w-full h-9 bg-black/40 border border-glass-border rounded-md pl-9 pr-3 text-xs text-asset-light placeholder-stone-600 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        {/* Employee Filter */}
        <select
          value={selectedEmployeeId}
          onChange={(e) => {
            setSelectedEmployeeId(e.target.value);
            if (e.target.value) {
              setSearchParams({ employeeId: e.target.value });
            } else {
              setSearchParams({});
            }
          }}
          className="h-9 bg-black/40 border border-glass-border rounded-md px-3 text-xs text-asset-light focus:outline-none focus:border-emerald-500 font-mono max-w-xs"
        >
          <option value="">All Employees</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name} ({emp.department || 'General'})
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="h-9 bg-black/40 border border-glass-border rounded-md px-3 text-xs text-asset-light focus:outline-none focus:border-emerald-500 font-mono"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Draft">Draft</option>
          <option value="Expired">Expired</option>
        </select>

        {(searchQuery || selectedEmployeeId || selectedStatus) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedEmployeeId('');
              setSelectedStatus('');
              setSearchParams({});
            }}
            className="text-xs text-stone-400 hover:text-stone-200 underline font-mono px-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* Contracts List / Table */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center space-y-3 glass-panel">
          <div className="h-8 w-8 rounded-full border-2 border-stone-800 border-t-emerald-500 animate-spin"></div>
          <p className="text-xs text-stone-400 font-mono">Loading contracts...</p>
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className="p-12 text-center glass-panel">
          <FileText className="h-10 w-10 text-stone-600 mx-auto mb-3" />
          <p className="text-sm text-stone-400 font-medium">No contracts found.</p>
          <p className="text-xs text-stone-600 font-mono mt-1">
            Create a contract to get started.
          </p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden border border-glass-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/40 border-b border-glass-border text-[10px] uppercase font-bold tracking-wider text-stone-400 font-mono">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Date Range</th>
                  <th className="px-6 py-3.5">Wage / Rate</th>
                  <th className="px-6 py-3.5">Department & Position</th>
                  <th className="px-6 py-3.5">Salary Structure</th>
                  <th className="px-6 py-3.5">Status</th>
                  {isPayrollOrAdmin && <th className="px-6 py-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {filteredContracts.map((contract) => {
                  const emp = employeeMap[contract.employeeId];
                  const isActive = contract.status === 'Active';

                  return (
                    <tr
                      key={contract.id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        isActive
                          ? 'bg-emerald-950/[0.08] border-l-2 border-emerald-500'
                          : 'border-l-2 border-transparent'
                      }`}
                    >
                      {/* Employee Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <span className="font-semibold text-asset-light block">
                              {emp?.name || contract.employeeId}
                            </span>
                            <span className="text-[10px] text-stone-500 font-mono">
                              ID: {contract.id.substring(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Date Range */}
                      <td className="px-6 py-4 font-mono text-[11px] text-stone-300">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-stone-500" />
                          <span>{contract.startDate}</span>
                          <span className="text-stone-500">→</span>
                          <span>
                            {contract.endDate ? (
                              contract.endDate
                            ) : (
                              <span className="text-emerald-400 font-semibold">Open-ended</span>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Wage */}
                      <td className="px-6 py-4 font-mono text-xs font-bold text-asset-light">
                        ${Number(contract.wage || 0).toLocaleString()}
                      </td>

                      {/* Department / Position */}
                      <td className="px-6 py-4">
                        <span className="text-asset-light block">
                          {contract.jobPosition || emp?.jobPosition || '—'}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {contract.department || emp?.department || '—'}
                        </span>
                      </td>

                      {/* Salary Structure */}
                      <td className="px-6 py-4 font-mono text-[11px] text-stone-400">
                        {contract.salaryStructureId || '—'}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase font-mono tracking-wider border flex items-center gap-1.5 ${
                              contract.status === 'Active'
                                ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(52,211,153,0.25)]'
                                : contract.status === 'Draft'
                                ? 'bg-amber-950/40 text-amber-400 border-amber-500/30'
                                : 'bg-stone-900 text-stone-500 border-stone-800'
                            }`}
                          >
                            {contract.status === 'Active' ? (
                              <ShieldCheck className="h-3 w-3" />
                            ) : (
                              <ShieldAlert className="h-3 w-3" />
                            )}
                            {contract.status}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      {isPayrollOrAdmin && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(contract)}
                              className="p-1 rounded text-stone-400 hover:text-emerald-400 hover:bg-white/5 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(contract)}
                              className="p-1 rounded text-stone-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== CREATE / EDIT MODAL ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel p-6 border border-glass-border shadow-glass-glow rounded-xl space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-glass-border">
              <h3 className="text-base font-bold uppercase tracking-wider text-asset-light flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-400" />
                {editingContract ? 'Edit Contract' : 'New Contract'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 text-stone-400 hover:text-stone-200 rounded-md hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Overlap Error Callout */}
            {overlapConflict && (
              <div className="bg-red-950/40 border border-red-800/60 p-4 rounded-lg space-y-2 text-red-200">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-red-400">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  Active Contract Overlap Detected!
                </div>
                <p className="text-xs font-mono">
                  This employee already has an active contract that overlaps the specified date range.
                </p>
                {overlapConflict.dates && (
                  <div className="bg-black/40 p-2.5 rounded border border-red-900/50 text-[11px] font-mono space-y-1">
                    <div>
                      <span className="text-stone-400">Conflicting Contract ID: </span>
                      <span className="text-red-300 font-bold">{overlapConflict.id}</span>
                    </div>
                    <div>
                      <span className="text-stone-400">Active Dates: </span>
                      <span className="text-red-300">
                        {overlapConflict.dates.startDate} → {overlapConflict.dates.endDate || 'Ongoing'}
                      </span>
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-stone-400">
                  Tip: Adjust the start/end dates, or save this contract in "Draft" status until the existing active contract expires.
                </p>
              </div>
            )}

            {formError && !overlapConflict && (
              <div className="bg-red-950/30 border border-red-800/40 text-red-300 px-4 py-2.5 rounded-md text-xs font-mono">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Employee Picker */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono">
                  Employee *
                </label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={(e) => handleEmployeeSelect(e.target.value)}
                  className="w-full h-9 bg-black/40 border border-glass-border rounded-md px-3 text-xs text-asset-light focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.department || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full h-9 bg-black/40 border border-glass-border rounded-md px-3 text-xs text-asset-light focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono">
                      End Date
                    </label>
                    <label className="flex items-center gap-1.5 text-[10px] text-stone-400 cursor-pointer font-mono">
                      <input
                        type="checkbox"
                        checked={isOpenEnded}
                        onChange={(e) => {
                          setIsOpenEnded(e.target.checked);
                          if (e.target.checked) setFormData({ ...formData, endDate: '' });
                        }}
                        className="rounded border-glass-border bg-black text-emerald-500 focus:ring-0"
                      />
                      Open-ended
                    </label>
                  </div>
                  <input
                    type="date"
                    disabled={isOpenEnded}
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full h-9 bg-black/40 border border-glass-border rounded-md px-3 text-xs text-asset-light focus:outline-none focus:border-emerald-500 font-mono disabled:opacity-30"
                  />
                </div>
              </div>

              {/* Wage & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono">
                    Wage / Base Salary ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.wage}
                    onChange={(e) => setFormData({ ...formData, wage: e.target.value })}
                    placeholder="e.g. 5000"
                    className="w-full h-9 bg-black/40 border border-glass-border rounded-md px-3 text-xs text-asset-light focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full h-9 bg-black/40 border border-glass-border rounded-md px-3 text-xs text-asset-light focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>

              {/* Department & Job Position */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Finance"
                    className="w-full h-9 bg-black/40 border border-glass-border rounded-md px-3 text-xs text-asset-light focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono">
                    Job Position
                  </label>
                  <input
                    type="text"
                    value={formData.jobPosition}
                    onChange={(e) => setFormData({ ...formData, jobPosition: e.target.value })}
                    placeholder="e.g. Financial Analyst"
                    className="w-full h-9 bg-black/40 border border-glass-border rounded-md px-3 text-xs text-asset-light focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Salary Structure Reference (P3) */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono">
                  Salary Structure ID (P3 Reference)
                </label>
                <input
                  type="text"
                  value={formData.salaryStructureId}
                  onChange={(e) =>
                    setFormData({ ...formData, salaryStructureId: e.target.value })
                  }
                  placeholder="e.g. struct_standard_fulltime"
                  className="w-full h-9 bg-black/40 border border-glass-border rounded-md px-3 text-xs text-asset-light focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-glass-border">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-md text-xs font-semibold text-stone-400 hover:text-stone-200 hover:bg-white/5 transition-colors font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="bg-[#1e3427]/90 hover:bg-[#254231] text-[#76c893] border border-[#2d523c] px-5 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-accent-glow"
                >
                  {formSubmitting ? 'Validating & Saving...' : editingContract ? 'Update' : 'Create Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
