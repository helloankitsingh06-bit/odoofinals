import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { timeOffTypeService } from '../lib/timeOffTypeService';

export default function TimeOffTypes() {
  const { user } = useAuth();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    unit: 'Days',
    requiresAllocation: true,
    requiresApproval: true,
    payrollIntegrated: false,
  });

  const isHR = ['HRManager', 'HRPayrollManager', 'Admin'].includes(user?.role);

  const loadTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await timeOffTypeService.list();
      setTypes(data);
    } catch (err) {
      setError(err.message || 'Failed to load time off types');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      name: '',
      unit: 'Days',
      requiresAllocation: true,
      requiresApproval: true,
      payrollIntegrated: false,
    });
    setShowModal(true);
  };

  const openEditModal = (type) => {
    setEditingId(type.id);
    setForm({
      name: type.name,
      unit: type.unit,
      requiresAllocation: type.requiresAllocation ?? true,
      requiresApproval: type.requiresApproval ?? true,
      payrollIntegrated: type.payrollIntegrated ?? false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      if (editingId) {
        await timeOffTypeService.update(editingId, form);
        setSuccessMsg(`Time Off Type "${form.name}" updated successfully.`);
      } else {
        await timeOffTypeService.create(form);
        setSuccessMsg(`Time Off Type "${form.name}" created successfully.`);
      }
      setShowModal(false);
      await loadTypes();
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    setActionLoading(true);
    setError(null);
    try {
      await timeOffTypeService.remove(id);
      setSuccessMsg(`Deleted "${name}".`);
      await loadTypes();
    } catch (err) {
      setError(err.message || 'Failed to delete');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-asset-light flex items-center gap-3">
            <span>Time Off Types</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Admin Screen
            </span>
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Configure leave policies (Days/Hours, allocation requirements, payroll integration).
          </p>
        </div>

        {isHR && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition active:scale-[0.98] shadow-green-glow flex items-center gap-2 self-start sm:self-auto"
          >
            <span>+</span>
            <span>New Leave Type</span>
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

      {/* Types Table */}
      <div className="glass-panel border border-glass-border overflow-hidden">
        <div className="p-4 border-b border-glass-border flex justify-between items-center bg-white/[0.01]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-asset-light">
            Defined Leave Types
          </h3>
          <button
            onClick={loadTypes}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-stone-300 hover:text-white border border-glass-border"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-stone-400">Loading leave types...</div>
        ) : types.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-400">
            No Time Off Types configured. Click "New Leave Type" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-glass-border text-stone-400 text-[10px] uppercase font-bold bg-white/[0.01]">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Requires Allocation</th>
                  <th className="py-3 px-4">Requires Approval</th>
                  <th className="py-3 px-4">Payroll Integrated</th>
                  {isHR && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {types.map((type) => (
                  <tr key={type.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3 px-4 font-semibold text-asset-light">
                      {type.name}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-glass-border text-stone-300 text-[10px]">
                        {type.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          type.requiresAllocation
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-stone-700/30 text-stone-400 border-stone-600/30'
                        }`}
                      >
                        {type.requiresAllocation ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          type.requiresApproval
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-stone-700/30 text-stone-400 border-stone-600/30'
                        }`}
                      >
                        {type.requiresApproval ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          type.payrollIntegrated
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                            : 'bg-stone-700/30 text-stone-400 border-stone-600/30'
                        }`}
                      >
                        {type.payrollIntegrated ? 'Yes' : 'No'}
                      </span>
                    </td>
                    {isHR && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(type)}
                            className="px-2.5 py-1 text-[10px] font-medium rounded bg-white/5 hover:bg-white/10 text-stone-300 border border-glass-border transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(type.id, type.name)}
                            className="px-2.5 py-1 text-[10px] font-medium rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 border border-glass-border max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-glass-border pb-3">
              <h3 className="text-sm font-bold text-asset-light uppercase tracking-wider">
                {editingId ? 'Edit Time Off Type' : 'Create Time Off Type'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paid Vacation, Sick Leave"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-stone-950/70 border border-glass-border rounded-lg px-3 py-2 text-asset-light focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                  Unit (Exact Enum: Days or Hours) *
                </label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full bg-stone-950/70 border border-glass-border rounded-lg px-3 py-2 text-asset-light focus:outline-none focus:border-emerald-500"
                >
                  <option value="Days">Days</option>
                  <option value="Hours">Hours</option>
                </select>
              </div>

              <div className="pt-2 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requiresAllocation}
                    onChange={(e) => setForm({ ...form, requiresAllocation: e.target.checked })}
                    className="rounded border-glass-border bg-stone-900 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-stone-300">Requires Allocation (balance check & transaction deduction)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requiresApproval}
                    onChange={(e) => setForm({ ...form, requiresApproval: e.target.checked })}
                    className="rounded border-glass-border bg-stone-900 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-stone-300">Requires Approval (HRManager+ must review)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.payrollIntegrated}
                    onChange={(e) => setForm({ ...form, payrollIntegrated: e.target.checked })}
                    className="rounded border-glass-border bg-stone-900 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-stone-300">Payroll Integrated (affects payslip calculation)</span>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 text-stone-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : editingId ? 'Update Type' : 'Create Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
