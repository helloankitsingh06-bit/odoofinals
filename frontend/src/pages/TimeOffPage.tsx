import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Check,
  X,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';

export const TimeOffPage: React.FC = () => {
  const { user } = useAuth();
  const [types, setTypes] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showRequestModal, setShowRequestModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [requestForm, setRequestForm] = useState({
    timeOffTypeId: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    duration: 1,
    reason: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tData, aData, rData] = await Promise.all([
        apiRequest('/time-off/types'),
        apiRequest('/time-off/allocations'),
        apiRequest('/time-off/requests')
      ]);
      setTypes(tData);
      setAllocations(aData);
      setRequests(rData);

      if (tData.length > 0 && !requestForm.timeOffTypeId) {
        setRequestForm(prev => ({ ...prev, timeOffTypeId: tData[0].id }));
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

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/time-off/requests', {
        method: 'POST',
        body: JSON.stringify(requestForm)
      });
      setShowRequestModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit request');
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

  const canApprove = user?.role !== 'Employee';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/40 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Calendar className="text-emerald-400" />
            Time Off & Leave Balances
          </h1>
          <p className="text-sm text-slate-400">
            Live leave allocation accounting: approvals automatically decrement remaining balances in real time.
          </p>
        </div>

        <button
          onClick={() => { setError(null); setShowRequestModal(true); }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/20 transition"
        >
          <Plus size={16} /> Request Time Off
        </button>
      </div>

      {/* Allocation Cards */}
      <div>
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">Active Leave Allocations & Balances</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allocations.map((alloc) => (
            <div
              key={alloc.id}
              className="bg-slate-800/60 border border-slate-700/80 p-5 rounded-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">{alloc.timeOffType?.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
                  {alloc.timeOffType?.unit}
                </span>
              </div>

              <div className="my-3">
                <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                  {alloc.remainingAmount} <span className="text-xs font-normal text-slate-400">available</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Employee: <strong className="text-white">{alloc.employee?.name}</strong>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (alloc.remainingAmount / alloc.allocatedAmount) * 100)}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 mt-2">
                <span>Taken: {alloc.takenAmount} {alloc.timeOffType?.unit}</span>
                <span>Total: {alloc.allocatedAmount} {alloc.timeOffType?.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200">Time Off Requests Workflow</span>
          <span className="text-xs text-slate-500">{requests.length} Total Requests</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-3.5">Employee</th>
              <th className="px-5 py-3.5">Leave Type</th>
              <th className="px-5 py-3.5">Dates</th>
              <th className="px-5 py-3.5">Duration</th>
              <th className="px-5 py-3.5">Reason</th>
              <th className="px-5 py-3.5">Status</th>
              {canApprove && <th className="px-5 py-3.5 text-right">Approval Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-slate-800/40 transition">
                <td className="px-5 py-3.5 font-medium text-white">
                  {req.employee?.name}
                </td>
                <td className="px-5 py-3.5 text-emerald-400 font-medium">
                  {req.timeOffType?.name}
                </td>
                <td className="px-5 py-3.5 font-mono text-slate-400">
                  {new Date(req.startDate).toISOString().slice(0, 10)} → {new Date(req.endDate).toISOString().slice(0, 10)}
                </td>
                <td className="px-5 py-3.5 font-bold font-mono text-white">
                  {req.duration} {req.timeOffType?.unit}
                </td>
                <td className="px-5 py-3.5 text-slate-400 max-w-xs truncate">
                  {req.reason || '—'}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    req.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    req.status === 'Refused' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {req.status}
                  </span>
                </td>
                {canApprove && (
                  <td className="px-5 py-3.5 text-right">
                    {req.status === 'Pending' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[11px] font-bold flex items-center gap-1 transition shadow-sm"
                        >
                          <Check size={13} /> Approve (Deduct)
                        </button>
                        <button
                          onClick={() => handleRefuse(req.id)}
                          className="px-2.5 py-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded-md text-[11px] font-bold flex items-center gap-1 transition"
                        >
                          <X size={13} /> Refuse
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">Completed</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-2">Request Time Off</h2>
            <p className="text-xs text-slate-400 mb-4">
              Submits request for HR approval. Live balance will be deducted upon approval.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Time Off Type</label>
                <select
                  value={requestForm.timeOffTypeId}
                  onChange={(e) => setRequestForm({ ...requestForm, timeOffTypeId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  {types.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.unit})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={requestForm.startDate}
                    onChange={(e) => setRequestForm({ ...requestForm, startDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={requestForm.endDate}
                    onChange={(e) => setRequestForm({ ...requestForm, endDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Duration (Days / Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  value={requestForm.duration}
                  onChange={(e) => setRequestForm({ ...requestForm, duration: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Reason / Notes</label>
                <textarea
                  value={requestForm.reason}
                  onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  placeholder="e.g. Annual summer family vacation"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow-md"
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
