import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { allocationService } from '../lib/allocationService';
import { timeOffTypeService } from '../lib/timeOffTypeService';

export default function Allocations() {
  const { user } = useAuth();
  const [allocations, setAllocations] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Grant Allocation Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    employeeId: '',
    timeOffTypeId: '',
    allocatedAmount: 10,
    validFrom: new Date().toISOString().split('T')[0],
    validTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      .toISOString()
      .split('T')[0],
  });

  const isHR = ['HRManager', 'HRPayrollManager', 'Admin'].includes(user?.role);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allocData, typeData] = await Promise.all([
        allocationService.list(),
        timeOffTypeService.list(),
      ]);
      setAllocations(allocData);
      setTypes(typeData);
      if (typeData.length > 0 && !form.timeOffTypeId) {
        setForm((prev) => ({ ...prev, timeOffTypeId: typeData[0].id }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load allocations');
    } finally {
      setLoading(false);
    }
  }, [form.timeOffTypeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      await allocationService.create({
        employeeId: form.employeeId.trim(),
        timeOffTypeId: form.timeOffTypeId,
        allocatedAmount: Number(form.allocatedAmount),
        validFrom: form.validFrom,
        validTo: form.validTo,
        status: 'Pending', // Pending until approved
      });
      setSuccessMsg(`Allocation created for ${form.employeeId} (Status: Pending).`);
      setShowCreateModal(false);
      setForm({
        employeeId: '',
        timeOffTypeId: types[0]?.id || '',
        allocatedAmount: 10,
        validFrom: new Date().toISOString().split('T')[0],
        validTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
          .toISOString()
          .split('T')[0],
      });
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to create allocation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (allocationId) => {
    setActionLoading(true);
    setError(null);
    try {
      await allocationService.approve(allocationId);
      setSuccessMsg('Allocation approved successfully! Now usable for time off requests.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to approve allocation');
    } finally {
      setActionLoading(false);
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
            <span>Leave Allocations</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              P2 Scope
            </span>
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Manage employee leave balances (allocated, taken, remaining) and approval lifecycles.
          </p>
        </div>

        {isHR && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition active:scale-[0.98] shadow-green-glow flex items-center gap-2 self-start sm:self-auto"
          >
            <span>+</span>
            <span>Grant Allocation</span>
          </button>
        )}
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

      {/* Allocations Table */}
      <div className="glass-panel border border-glass-border overflow-hidden">
        <div className="p-4 border-b border-glass-border flex justify-between items-center bg-white/[0.01]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-asset-light">
            All Allocations
          </h3>
          <button
            onClick={loadData}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-stone-300 hover:text-white border border-glass-border"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-stone-400">Loading allocations...</div>
        ) : allocations.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-400">
            No allocations found. Create an allocation to grant employee leave days/hours.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-glass-border text-stone-400 text-[10px] uppercase font-bold bg-white/[0.01]">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Validity</th>
                  <th className="py-3 px-4">Allocated</th>
                  <th className="py-3 px-4">Taken</th>
                  <th className="py-3 px-4">Remaining</th>
                  <th className="py-3 px-4">Usage</th>
                  <th className="py-3 px-4">Status</th>
                  {isHR && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {allocations.map((alloc) => {
                  const type = typeMap[alloc.timeOffTypeId];
                  const percentUsed =
                    alloc.allocatedAmount > 0
                      ? Math.min(100, Math.round((alloc.takenAmount / alloc.allocatedAmount) * 100))
                      : 0;

                  return (
                    <tr key={alloc.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3 px-4 font-mono font-semibold text-asset-light">
                        {alloc.employeeId}
                      </td>
                      <td className="py-3 px-4 font-medium text-stone-200">
                        {type ? type.name : alloc.timeOffTypeId}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-stone-400">
                        {alloc.validFrom ? new Date(alloc.validFrom).toLocaleDateString() : '—'} →{' '}
                        {alloc.validTo ? new Date(alloc.validTo).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-asset-light">
                        {alloc.allocatedAmount} {type ? type.unit : 'Days'}
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-400">
                        {alloc.takenAmount || 0}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {alloc.remainingAmount}
                      </td>
                      <td className="py-3 px-4 w-32">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-stone-900 rounded-full h-1.5 overflow-hidden border border-glass-border">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${percentUsed}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] text-stone-400 font-mono">{percentUsed}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                            alloc.status === 'Approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {alloc.status}
                        </span>
                      </td>
                      {isHR && (
                        <td className="py-3 px-4 text-right">
                          {alloc.status === 'Pending' ? (
                            <button
                              onClick={() => handleApprove(alloc.id)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 text-[10px] font-bold rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition active:scale-95 disabled:opacity-50"
                            >
                              Approve
                            </button>
                          ) : (
                            <span className="text-[10px] text-stone-500 font-mono">Usable</span>
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

      {/* Grant Allocation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 border border-glass-border max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-glass-border pb-3">
              <h3 className="text-sm font-bold text-asset-light uppercase tracking-wider">
                Grant Leave Allocation
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
                  placeholder="e.g. emp_001"
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
                      {t.name} ({t.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                  Allocated Amount (Days / Hours) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  value={form.allocatedAmount}
                  onChange={(e) => setForm({ ...form, allocatedAmount: e.target.value })}
                  className="w-full bg-stone-950/70 border border-glass-border rounded-lg px-3 py-2 text-asset-light focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                    Valid From *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.validFrom}
                    onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                    className="w-full bg-stone-950/70 border border-glass-border rounded-lg px-3 py-2 text-asset-light focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                    Valid To *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.validTo}
                    onChange={(e) => setForm({ ...form, validTo: e.target.value })}
                    className="w-full bg-stone-950/70 border border-glass-border rounded-lg px-3 py-2 text-asset-light focus:outline-none focus:border-emerald-500"
                  />
                </div>
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
                  {actionLoading ? 'Creating...' : 'Create Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
