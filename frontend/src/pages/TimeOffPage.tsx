import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Check,
  X,
  Plus,
  AlertCircle,
  Sparkles,
  Trash2,
  Award,
  Clock,
  UserCheck,
  Search,
  ChevronDown,
  User,
  Filter
} from 'lucide-react';

export const TimeOffPage: React.FC = () => {
  const { user } = useAuth();
  const [types, setTypes] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showRequestModal, setShowRequestModal] = useState<boolean>(false);
  const [showAllocationModal, setShowAllocationModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Searchable Employee Select state for Allocation Modal
  const [allocEmpSearch, setAllocEmpSearch] = useState('');
  const [isAllocEmpDropdownOpen, setIsAllocEmpDropdownOpen] = useState(false);
  const allocDropdownRef = useRef<HTMLDivElement>(null);

  // Searchable Employee Select state for Request Modal
  const [reqEmpSearch, setReqEmpSearch] = useState('');
  const [isReqEmpDropdownOpen, setIsReqEmpDropdownOpen] = useState(false);
  const reqDropdownRef = useRef<HTMLDivElement>(null);

  // Requests Table Search & Filter
  const [requestSearch, setRequestSearch] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState('All');

  const [requestForm, setRequestForm] = useState({
    employeeId: '',
    timeOffTypeId: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    duration: 1,
    reason: ''
  });

  const [allocationForm, setAllocationForm] = useState({
    employeeId: '',
    timeOffTypeId: '',
    allocatedAmount: 20,
    validFrom: `${new Date().getFullYear()}-01-01`,
    validTo: `${new Date().getFullYear()}-12-31`,
    status: 'Approved'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tData, aData, rData, eData] = await Promise.all([
        apiRequest('/time-off/types'),
        apiRequest('/time-off/allocations'),
        apiRequest('/time-off/requests'),
        apiRequest('/employees')
      ]);
      setTypes(tData);
      setAllocations(aData);
      setRequests(rData);
      setEmployees(eData);

      if (tData.length > 0 && !requestForm.timeOffTypeId) {
        setRequestForm(prev => ({ ...prev, timeOffTypeId: tData[0].id }));
      }
      if (tData.length > 0 && !allocationForm.timeOffTypeId) {
        setAllocationForm(prev => ({ ...prev, timeOffTypeId: tData[0].id }));
      }
      if (eData.length > 0) {
        if (!requestForm.employeeId) {
          setRequestForm(prev => ({ ...prev, employeeId: user?.employeeId || eData[0].id }));
        }
        if (!allocationForm.employeeId) {
          setAllocationForm(prev => ({ ...prev, employeeId: eData[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load time off data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (allocDropdownRef.current && !allocDropdownRef.current.contains(event.target as Node)) {
        setIsAllocEmpDropdownOpen(false);
      }
      if (reqDropdownRef.current && !reqDropdownRef.current.contains(event.target as Node)) {
        setIsReqEmpDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/time-off/requests', {
        method: 'POST',
        body: JSON.stringify({
          ...requestForm,
          employeeId: requestForm.employeeId || user?.employeeId
        })
      });
      setShowRequestModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit request');
    }
  };

  const handleCreateAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/time-off/allocations', {
        method: 'POST',
        body: JSON.stringify(allocationForm)
      });
      setShowAllocationModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to grant allocation');
    }
  };

  const handleDeleteAllocation = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this leave allocation?')) return;
    try {
      await apiRequest(`/time-off/allocations/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete / cancel this time off request?')) return;
    try {
      await apiRequest(`/time-off/requests/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      await apiRequest(`/time-off/requests/${requestId}/approve`, { method: 'POST' });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRefuse = async (requestId: string) => {
    try {
      await apiRequest(`/time-off/requests/${requestId}/refuse`, { method: 'POST' });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const canManage = user?.role !== 'Employee';

  const filteredAllocEmployees = employees.filter(emp => {
    const q = allocEmpSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      emp.name?.toLowerCase().includes(q) ||
      (emp.department && emp.department.toLowerCase().includes(q)) ||
      (emp.jobPosition && emp.jobPosition.toLowerCase().includes(q))
    );
  });
  const selectedAllocEmployee = employees.find(e => e.id === allocationForm.employeeId);

  const filteredReqEmployees = employees.filter(emp => {
    const q = reqEmpSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      emp.name?.toLowerCase().includes(q) ||
      (emp.department && emp.department.toLowerCase().includes(q)) ||
      (emp.jobPosition && emp.jobPosition.toLowerCase().includes(q))
    );
  });
  const selectedReqEmployee = employees.find(e => e.id === requestForm.employeeId);

  const filteredRequests = requests.filter(req => {
    const q = requestSearch.toLowerCase().trim();
    const empName = (req.employee?.name || '').toLowerCase();
    const leaveType = (req.timeOffType?.name || '').toLowerCase();
    const reason = (req.reason || '').toLowerCase();
    const status = (req.status || '').toLowerCase();

    const matchesSearch = !q || empName.includes(q) || leaveType.includes(q) || reason.includes(q) || status.includes(q);
    const matchesStatus = requestStatusFilter === 'All' || req.status === requestStatusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 dark:bg-[#0b0914]/80 p-5 rounded-3xl border border-purple-100 dark:border-purple-900/40 backdrop-blur-xl shadow-lg dark:shadow-2xl transition-colors duration-300">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Calendar className="text-amber-500 dark:text-amber-400" />
            Time Off & Leave Balances
          </h1>
          <p className="text-sm text-slate-600 dark:text-purple-200/60 font-medium mt-0.5">
            Live leave allocation accounting: approvals automatically decrement remaining balances in real time.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canManage && (
            <button
              onClick={() => {
                setError(null);
                setAllocationForm(prev => ({
                  ...prev,
                  employeeId: prev.employeeId || (employees[0]?.id || '')
                }));
                setShowAllocationModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-900/50 hover:bg-purple-800/60 border border-purple-700/50 text-purple-200 rounded-xl text-xs font-bold transition active:scale-95"
            >
              <Award size={15} className="text-amber-400" /> Grant Leave Allocation
            </button>
          )}

          <button
            onClick={() => { setError(null); setShowRequestModal(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 transition active:scale-95"
          >
            <Plus size={16} /> Request Time Off
          </button>
        </div>
      </div>

      {/* Allocation Cards */}
      <div>
        <h2 className="text-xs font-black text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Sparkles size={13} className="text-purple-400" /> Active Leave Allocations & Balances
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allocations.map((alloc) => (
            <div
              key={alloc.id}
              className="bg-[#0b0914]/80 border border-purple-900/40 hover:border-amber-400/60 p-5 rounded-3xl relative overflow-hidden shadow-xl transition-all duration-300 hover:scale-[1.01]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{alloc.timeOffType?.name}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-200 border border-purple-500/30">
                  {alloc.timeOffType?.unit}
                </span>
              </div>

              <div className="my-3">
                <div className="text-3xl font-black text-amber-300 font-mono">
                  {alloc.remainingAmount} <span className="text-xs font-normal text-purple-300/60">available</span>
                </div>
                <div className="text-xs text-purple-300/70 mt-1">
                  Employee: <strong className="text-white">{alloc.employee?.name}</strong>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#06050b] border border-purple-950 h-2 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-gradient-to-r from-purple-500 via-amber-400 to-yellow-300 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (alloc.remainingAmount / alloc.allocatedAmount) * 100)}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-[10px] text-purple-400/70 mt-2 font-medium">
                <span>Taken: {alloc.takenAmount} {alloc.timeOffType?.unit}</span>
                <span>Total: {alloc.allocatedAmount} {alloc.timeOffType?.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-[#0b0914]/80 border border-purple-100 dark:border-purple-900/40 rounded-3xl overflow-hidden shadow-md dark:shadow-2xl transition-colors duration-300">
        {/* Table Header with Search & Filter */}
        <div className="p-4 bg-purple-50/70 dark:bg-[#06050b] border-b border-purple-100 dark:border-purple-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Time Off Requests Workflow</span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold">
              {filteredRequests.length === requests.length
                ? `${requests.length} Requests`
                : `${filteredRequests.length} of ${requests.length} Requests`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-72">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-purple-400/70 pointer-events-none" />
              <input
                type="text"
                value={requestSearch}
                onChange={(e) => setRequestSearch(e.target.value)}
                placeholder="Search by employee, leave type, reason..."
                className="w-full bg-white dark:bg-[#0e0c18] border border-slate-200 dark:border-purple-900/50 rounded-xl pl-10 pr-9 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-purple-400/50 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
              />
              {requestSearch && (
                <button
                  type="button"
                  onClick={() => setRequestSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <select
              value={requestStatusFilter}
              onChange={(e) => setRequestStatusFilter(e.target.value)}
              className="bg-white dark:bg-[#0e0c18] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-purple-200 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Refused">Refused</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-50/70 dark:bg-[#06050b] text-purple-900 dark:text-purple-300/70 font-bold uppercase tracking-wider text-[10px] border-b border-purple-100 dark:border-purple-900/50">
              <tr>
                <th className="px-5 py-4">Employee</th>
                <th className="px-5 py-4">Leave Type</th>
                <th className="px-5 py-4">Dates</th>
                <th className="px-5 py-4">Duration</th>
                <th className="px-5 py-4">Reason</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100 dark:divide-purple-950 text-slate-800 dark:text-purple-100">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition">
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-purple-600 to-amber-500 text-white flex items-center justify-center font-bold text-[10px] shadow-sm shrink-0">
                          {req.employee?.name ? req.employee.name[0] : 'E'}
                        </div>
                        <div>
                          <div>{req.employee?.name || 'Unknown'}</div>
                          {req.employee?.department && (
                            <div className="text-[10px] text-slate-500 dark:text-purple-400/60 font-normal">
                              {req.employee.department}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-amber-700 dark:text-amber-300 font-bold">
                      {req.timeOffType?.name}
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-600 dark:text-purple-300/80">
                      {new Date(req.startDate).toISOString().slice(0, 10)} → {new Date(req.endDate).toISOString().slice(0, 10)}
                    </td>
                    <td className="px-5 py-4 font-bold font-mono text-slate-900 dark:text-white">
                      {req.duration} {req.timeOffType?.unit}
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-purple-300/70 max-w-xs truncate">
                      {req.reason || '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        req.status === 'Approved' ? 'bg-amber-400/15 text-amber-700 dark:text-amber-300 border border-amber-400/30' :
                        req.status === 'Refused' ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30' :
                        'bg-purple-500/20 text-purple-700 dark:text-purple-200 border border-purple-500/30'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {canManage ? (
                        req.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(req.id)}
                              className="px-3 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl text-[11px] font-black flex items-center gap-1 transition shadow-sm cursor-pointer"
                            >
                              <Check size={13} /> Approve (Deduct)
                            </button>
                            <button
                              onClick={() => handleRefuse(req.id)}
                              className="px-3 py-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <X size={13} /> Refuse
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-purple-400/50 font-mono">Completed</span>
                        )
                      ) : (
                        <span className="text-[10px] text-slate-400 dark:text-purple-400/50 font-mono">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 dark:text-purple-400/60">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search size={24} className="text-slate-300 dark:text-purple-700/50" />
                      <p className="font-semibold text-xs text-slate-600 dark:text-purple-300">No requests found</p>
                      {(requestSearch || requestStatusFilter !== 'All') && (
                        <button
                          type="button"
                          onClick={() => {
                            setRequestSearch('');
                            setRequestStatusFilter('All');
                          }}
                          className="mt-1 px-3 py-1 text-xs rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold hover:bg-purple-200 dark:hover:bg-purple-800/40 cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grant Leave Allocation Modal */}
      {showAllocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div
            className="fixed inset-0"
            onClick={() => setShowAllocationModal(false)}
          />
          <div className="relative bg-white dark:bg-[#090712] border border-purple-200 dark:border-purple-800/60 rounded-3xl w-full max-w-md p-6 shadow-2xl z-10 transition-colors duration-300">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-purple-100 dark:border-purple-900/50">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-400/30">
                  <Award size={16} />
                </div>
                Grant Leave Allocation
              </h2>
              <button
                type="button"
                onClick={() => setShowAllocationModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-purple-950/60 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-purple-300/60 mb-4 font-medium">
              Allocate a quota of paid/unpaid leaves to an employee for a specific date window.
            </p>

            {error && (
              <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 rounded-2xl text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateAllocation} className="space-y-4 text-xs">
              {/* Searchable Employee Combobox */}
              <div className="relative" ref={allocDropdownRef}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-700 dark:text-purple-300/80 font-semibold text-xs flex items-center gap-1.5">
                    <User size={13} className="text-amber-500 dark:text-amber-400" />
                    Employee
                  </label>
                  <span className="text-[10px] text-slate-500 dark:text-purple-400/60">
                    {filteredAllocEmployees.length} of {employees.length} available
                  </span>
                </div>

                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-purple-400/70 pointer-events-none" />
                  <input
                    type="text"
                    value={allocEmpSearch}
                    onChange={(e) => {
                      setAllocEmpSearch(e.target.value);
                      setIsAllocEmpDropdownOpen(true);
                    }}
                    onFocus={() => setIsAllocEmpDropdownOpen(true)}
                    placeholder={selectedAllocEmployee ? `${selectedAllocEmployee.name} (${selectedAllocEmployee.department})` : "Type name or department to search..."}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl pl-10 pr-9 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-purple-300/60 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                  />
                  {allocEmpSearch ? (
                    <button
                      type="button"
                      onClick={() => setAllocEmpSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAllocEmpDropdownOpen(!isAllocEmpDropdownOpen)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                    >
                      <ChevronDown size={14} />
                    </button>
                  )}
                </div>

                {selectedAllocEmployee && !isAllocEmpDropdownOpen && (
                  <div className="mt-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Selected: <strong>{selectedAllocEmployee.name}</strong>
                    </span>
                    <span className="text-slate-500 dark:text-purple-400/60 font-mono text-[10px]">
                      {selectedAllocEmployee.department}
                    </span>
                  </div>
                )}

                {isAllocEmpDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#0e0c18] border border-purple-200 dark:border-purple-800/80 rounded-2xl shadow-2xl max-h-48 overflow-y-auto p-1.5 space-y-1 text-xs">
                    {filteredAllocEmployees.length > 0 ? (
                      filteredAllocEmployees.map((e) => {
                        const isSelected = allocationForm.employeeId === e.id;
                        return (
                          <div
                            key={e.id}
                            onClick={() => {
                              setAllocationForm({ ...allocationForm, employeeId: e.id });
                              setIsAllocEmpDropdownOpen(false);
                            }}
                            className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition ${
                              isSelected
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30'
                                : 'text-slate-800 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-purple-600 to-amber-500 text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
                                {e.name[0]}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white text-xs">{e.name}</div>
                                <div className="text-[10px] text-slate-500 dark:text-purple-400/70 font-normal">
                                  {e.jobPosition ? `${e.jobPosition} • ` : ''}{e.department}
                                </div>
                              </div>
                            </div>
                            {isSelected && <Check size={14} className="text-amber-500 dark:text-amber-400 shrink-0" />}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3 text-center text-slate-400 dark:text-purple-400/60 text-xs">
                        No employees found matching "{allocEmpSearch}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Leave Type</label>
                <select
                  required
                  value={allocationForm.timeOffTypeId}
                  onChange={(e) => setAllocationForm({ ...allocationForm, timeOffTypeId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium cursor-pointer"
                >
                  {types.map(t => (
                    <option key={t.id} value={t.id} className="bg-white dark:bg-[#0b0914] text-slate-900 dark:text-white">{t.name} ({t.unit})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Allocated Amount (Days / Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  value={allocationForm.allocatedAmount}
                  onChange={(e) => setAllocationForm({ ...allocationForm, allocatedAmount: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Valid From</label>
                  <input
                    type="date"
                    required
                    value={allocationForm.validFrom}
                    onChange={(e) => setAllocationForm({ ...allocationForm, validFrom: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Valid To</label>
                  <input
                    type="date"
                    required
                    value={allocationForm.validTo}
                    onChange={(e) => setAllocationForm({ ...allocationForm, validTo: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-purple-100 dark:border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setShowAllocationModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-purple-950/60 border border-slate-200 dark:border-purple-900/50 text-slate-600 dark:text-purple-300 rounded-xl hover:bg-slate-200 dark:hover:bg-purple-900/40 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl font-black shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Grant Quota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-[#090712] border border-purple-200 dark:border-purple-800/60 rounded-3xl w-full max-w-md p-6 shadow-2xl transition-colors duration-300">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500 dark:text-amber-400" />
              Request Time Off
            </h2>
            <p className="text-xs text-slate-500 dark:text-purple-300/60 mb-4 font-medium">
              Submits request for HR approval. Live balance will be deducted upon approval.
            </p>

            {error && (
              <div className="mb-4 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-600 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
              {canManage && (
                <div className="relative" ref={reqDropdownRef}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-700 dark:text-purple-300/80 font-semibold text-xs flex items-center gap-1.5">
                      <User size={13} className="text-amber-500 dark:text-amber-400" />
                      Employee
                    </label>
                    <span className="text-[10px] text-slate-500 dark:text-purple-400/60">
                      {filteredReqEmployees.length} of {employees.length} available
                    </span>
                  </div>

                  <div className="relative">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-purple-400/70 pointer-events-none" />
                    <input
                      type="text"
                      value={reqEmpSearch}
                      onChange={(e) => {
                        setReqEmpSearch(e.target.value);
                        setIsReqEmpDropdownOpen(true);
                      }}
                      onFocus={() => setIsReqEmpDropdownOpen(true)}
                      placeholder={selectedReqEmployee ? `${selectedReqEmployee.name} (${selectedReqEmployee.department})` : "Type name or department to search..."}
                      className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl pl-10 pr-9 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-purple-300/60 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                    />
                    {reqEmpSearch ? (
                      <button
                        type="button"
                        onClick={() => setReqEmpSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsReqEmpDropdownOpen(!isReqEmpDropdownOpen)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                      >
                        <ChevronDown size={14} />
                      </button>
                    )}
                  </div>

                  {selectedReqEmployee && !isReqEmpDropdownOpen && (
                    <div className="mt-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Selected: <strong>{selectedReqEmployee.name}</strong>
                      </span>
                      <span className="text-slate-500 dark:text-purple-400/60 font-mono text-[10px]">
                        {selectedReqEmployee.department}
                      </span>
                    </div>
                  )}

                  {isReqEmpDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#0e0c18] border border-purple-200 dark:border-purple-800/80 rounded-2xl shadow-2xl max-h-48 overflow-y-auto p-1.5 space-y-1 text-xs">
                      {filteredReqEmployees.length > 0 ? (
                        filteredReqEmployees.map((e) => {
                          const isSelected = requestForm.employeeId === e.id;
                          return (
                            <div
                              key={e.id}
                              onClick={() => {
                                setRequestForm({ ...requestForm, employeeId: e.id });
                                setIsReqEmpDropdownOpen(false);
                              }}
                              className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition ${
                                isSelected
                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30'
                                  : 'text-slate-800 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-purple-600 to-amber-500 text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
                                  {e.name[0]}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white text-xs">{e.name}</div>
                                  <div className="text-[10px] text-slate-500 dark:text-purple-400/70 font-normal">
                                    {e.jobPosition ? `${e.jobPosition} • ` : ''}{e.department}
                                  </div>
                                </div>
                              </div>
                              {isSelected && <Check size={14} className="text-amber-500 dark:text-amber-400 shrink-0" />}
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-3 text-center text-slate-400 dark:text-purple-400/60 text-xs">
                          No employees found matching "{reqEmpSearch}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Time Off Type</label>
                <select
                  value={requestForm.timeOffTypeId}
                  onChange={(e) => setRequestForm({ ...requestForm, timeOffTypeId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium cursor-pointer"
                >
                  {types.map(t => (
                    <option key={t.id} value={t.id} className="bg-white dark:bg-[#0b0914] text-slate-900 dark:text-white">{t.name} ({t.unit})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Start Date</label>
                  <input
                    type="date"
                    required
                    value={requestForm.startDate}
                    onChange={(e) => setRequestForm({ ...requestForm, startDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">End Date</label>
                  <input
                    type="date"
                    required
                    value={requestForm.endDate}
                    onChange={(e) => setRequestForm({ ...requestForm, endDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Duration (Days / Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  value={requestForm.duration}
                  onChange={(e) => setRequestForm({ ...requestForm, duration: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Reason / Notes</label>
                <textarea
                  value={requestForm.reason}
                  onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                  placeholder="e.g. Annual summer family vacation"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-purple-100 dark:border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-purple-950/60 border border-slate-200 dark:border-purple-900/50 text-slate-600 dark:text-purple-300 rounded-xl hover:bg-slate-200 dark:hover:bg-purple-900/40 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl font-black shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
