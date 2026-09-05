import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { timeOffRequestService } from '../lib/timeOffRequestService';
import { timeOffTypeService } from '../lib/timeOffTypeService';
import { allocationService } from '../lib/allocationService';

export default function TimeOffRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // New Request Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTypeBalance, setSelectedTypeBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [form, setForm] = useState({
    employeeId: user?.employeeId || (user?.role === 'Employee' ? 'emp-001' : 'emp-admin'),
    timeOffTypeId: '',
    startDate: '',
    endDate: '',
    duration: 1,
    reason: '',
  });

  // Refuse Modal
  const [showRefuseModal, setShowRefuseModal] = useState(false);
  const [refuseRequestId, setRefuseRequestId] = useState(null);
  const [refuseReason, setRefuseReason] = useState('');

  const isHR = ['HRManager', 'HRPayrollManager', 'Admin'].includes(user?.role);
  const currentEmployeeId = user?.employeeId || (user?.role === 'Employee' ? 'emp-001' : 'emp-admin');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqData, typeData] = await Promise.all([
        timeOffRequestService.list(),
        timeOffTypeService.list(),
      ]);
      setRequests(reqData);
      setTypes(typeData);
      if (typeData.length > 0 && !form.timeOffTypeId) {
        setForm((prev) => ({ ...prev, timeOffTypeId: typeData[0].id }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [form.timeOffTypeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // When selected timeOffType changes, check live available balance
  useEffect(() => {
    if (!form.timeOffTypeId || !form.employeeId) return;
    const selectedType = types.find((t) => t.id === form.timeOffTypeId);
    if (!selectedType || !selectedType.requiresAllocation) {
      setSelectedTypeBalance(null);
      return;
    }

    setBalanceLoading(true);
    allocationService
      .getBalance(form.employeeId, form.timeOffTypeId, form.startDate || undefined)
      .then((res) => setSelectedTypeBalance(res))
      .catch(() => setSelectedTypeBalance({ totalAvailable: 0 }))
      .finally(() => setBalanceLoading(false));
  }, [form.timeOffTypeId, form.employeeId, form.startDate, types]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    setSuccessMsg('');
    try {
      await timeOffRequestService.create({
        employeeId: form.employeeId,
        timeOffTypeId: form.timeOffTypeId,
        startDate: form.startDate,
        endDate: form.endDate,
        duration: Number(form.duration),
        reason: form.reason,
      });
      setSuccessMsg('Time Off Request submitted successfully (Status: Pending).');
      setShowCreateModal(false);
      setForm({
        employeeId: currentEmployeeId,
        timeOffTypeId: types[0]?.id || '',
        startDate: '',
        endDate: '',
        duration: 1,
        reason: '',
      });
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    setActionLoading(true);
    setError(null);
    setSuccessMsg('');
    try {
      const result = await timeOffRequestService.approve(requestId);
      if (result.allocation) {
        setSuccessMsg(
          `Request approved! Atomically deducted ${result.request.duration} from allocation. Remaining balance: ${result.allocation.remainingAmount}.`
        );
      } else {
        setSuccessMsg('Request approved successfully.');
      }
      await loadData();
    } catch (err) {
      setError(err.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const openRefuseModal = (requestId) => {
    setRefuseRequestId(requestId);
    setRefuseReason('');
    setShowRefuseModal(true);
  };

  const handleRefuseSubmit = async (e) => {
    e.preventDefault();
    if (!refuseRequestId) return;
    setActionLoading(true);
    setError(null);
    try {
      await timeOffRequestService.refuse(refuseRequestId, refuseReason);
      setSuccessMsg('Request marked as Refused. Allocation balance unaffected.');
      setShowRefuseModal(false);
      await loadData();
    } catch (err) {
      setError(err.message || 'Refusal failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Refused':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'Pending':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-white/5 text-stone-400 border-white/10';
    }
  };

  const typeMap = types.reduce((acc, t) => {
    acc[t.id] = t;
    return acc;
  }, {});

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-asset-light flex items-center gap-3">
            <span>Time Off Requests</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Core Differentiator
            </span>
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Request submission, available balance validation & atomic allocation deduction transactions on approval.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition active:scale-[0.98] shadow-green-glow flex items-center gap-2 self-start sm:self-auto"
        >
          <span>+</span>
          <span>Request Time Off</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex justify-between items-center">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Requests Table */}
      <div className="glass-panel border border-glass-border overflow-hidden">
        <div className="p-4 border-b border-glass-border flex justify-between items-center bg-white/[0.01]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-asset-light">
            All Time Off Requests
          </h3>
          <button
            onClick={loadData}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-stone-300 hover:text-white border border-glass-border"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-stone-400">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-400">
            No time off requests found. Submit a request above!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-glass-border text-stone-400 text-[10px] uppercase font-bold bg-white/[0.01]">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">End Date</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reason</th>
                  {isHR && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {requests.map((req) => {
                  const type = typeMap[req.timeOffTypeId];
                  const isPending = req.status === 'Pending';

                  return (
                    <tr key={req.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3 px-4 font-mono font-semibold text-asset-light">
                        {req.employeeId}
                      </td>
                      <td className="py-3 px-4 font-medium text-stone-200">
                        {type ? type.name : req.timeOffTypeId}
                      </td>
                      <td className="py-3 px-4 text-stone-300">
                        {req.startDate ? new Date(req.startDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-stone-300">
                        {req.endDate ? new Date(req.endDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-asset-light">
                        {req.duration} {type ? type.unit : 'Days'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(req.status)}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-400 truncate max-w-xs">
                        {req.reason || '—'}
                        {req.refusalReason && (
                          <span className="block text-[10px] text-rose-400 mt-0.5">
                            Refusal reason: {req.refusalReason}
                          </span>
                        )}
                      </td>
                      {isHR && (
                        <td className="py-3 px-4 text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleApprove(req.id)}
                                disabled={actionLoading}
                                className="px-2.5 py-1 text-[10px] font-bold rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition active:scale-95 disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => openRefuseModal(req.id)}
                                disabled={actionLoading}
                                className="px-2.5 py-1 text-[10px] font-bold rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 transition active:scale-95 disabled:opacity-50"
                              >
                                Refuse
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-stone-500 font-mono">Completed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Time Off Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 border border-glass-border max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-glass-border pb-3">
              <h3 className="text-sm font-bold text-asset-light uppercase tracking-wider">
                Submit Time Off Request
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                  Employee ID *
                </label>
                <input
                  type="text"
                  required
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className="w-full bg-stone-950/70 border border-glass-border rounded-lg px-3 py-2 text-asset-light focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                  Time Off Type *
                </label>
                <select
                  required
                  value={form.timeOffTypeId}
                  onChange={(e) => setForm({ ...form, timeOffTypeId: e.target.value })}
                  className="w-full bg-stone-950/70 border border-glass-border rounded-lg px-3 py-2 text-asset-light focus:outline-none focus:border-emerald-500"
                >
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.unit}) {t.requiresAllocation ? '— Requires Allocation' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Balance Indicator */}
              {selectedTypeBalance !== null && (
                <div className="p-3 rounded-lg bg-white/5 border border-glass-border flex items-center justify-between">
                  <span className="text-[11px] text-stone-400">Available Allocation Balance:</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {balanceLoading ? 'Checking...' : `${selectedTypeBalance.totalAvailable} Available`}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full bg-stone-950/70 border border-glass-border rounded-lg px-3 py-2 text-asset-light focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full bg-stone-950/70 border border-glass-border rounded-lg px-3 py-2 text-asset-light focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                  Duration (Days / Hours) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  className="w-full bg-stone-950/70 border border-glass-border rounded-lg px-3 py-2 text-asset-light focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                  Reason
                </label>
                <textarea
                  rows="2"
                  placeholder="Vacation / Personal / Medical..."
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full bg-stone-950/70 border border-glass-border rounded-lg px-3 py-2 text-asset-light focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 text-stone-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50"
                >
                  {actionLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refuse Request Modal */}
      {showRefuseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 border border-glass-border max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-glass-border pb-3">
              <h3 className="text-sm font-bold text-asset-light uppercase tracking-wider">
                Refuse Time Off Request
              </h3>
              <button
                onClick={() => setShowRefuseModal(false)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRefuseSubmit} className="space-y-3 text-xs">
              <p className="text-stone-300 text-xs">
                Are you sure you want to refuse this request? The allocation balance will not be deducted.
              </p>

              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                  Refusal Reason (Optional)
                </label>
                <textarea
                  rows="3"
                  placeholder="Reason for refusal..."
                  value={refuseReason}
                  onChange={(e) => setRefuseReason(e.target.value)}
                  className="w-full bg-stone-950/70 border border-glass-border rounded-lg px-3 py-2 text-asset-light focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRefuseModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 text-stone-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold disabled:opacity-50"
                >
                  {actionLoading ? 'Refusing...' : 'Confirm Refusal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
