import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Check,
  X,
  Plus,
  AlertCircle,
  Sparkles
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
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0b0914]/80 p-5 rounded-3xl border border-purple-900/40 backdrop-blur-xl shadow-2xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Calendar className="text-amber-400" />
            Time Off & Leave Balances
          </h1>
          <p className="text-sm text-purple-200/60">
            Live leave allocation accounting: approvals automatically decrement remaining balances in real time.
          </p>
        </div>

        <button
          onClick={() => { setError(null); setShowRequestModal(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 transition active:scale-95"
        >
          <Plus size={16} /> Request Time Off
        </button>
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
      <div className="bg-[#0b0914]/80 border border-purple-900/40 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 bg-[#06050b] border-b border-purple-900/50 flex items-center justify-between">
          <span className="text-xs font-bold text-amber-300">Time Off Requests Workflow</span>
          <span className="text-xs text-purple-400/60 font-medium">{requests.length} Total Requests</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-[#06050b] text-purple-300/70 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-4">Employee</th>
              <th className="px-5 py-4">Leave Type</th>
              <th className="px-5 py-4">Dates</th>
              <th className="px-5 py-4">Duration</th>
              <th className="px-5 py-4">Reason</th>
              <th className="px-5 py-4">Status</th>
              {canApprove && <th className="px-5 py-4 text-right">Approval Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-950 text-purple-100">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-purple-950/20 transition">
                <td className="px-5 py-4 font-bold text-white">
                  {req.employee?.name}
                </td>
                <td className="px-5 py-4 text-amber-300 font-bold">
                  {req.timeOffType?.name}
                </td>
                <td className="px-5 py-4 font-mono text-purple-300/80">
                  {new Date(req.startDate).toISOString().slice(0, 10)} → {new Date(req.endDate).toISOString().slice(0, 10)}
                </td>
                <td className="px-5 py-4 font-bold font-mono text-white">
                  {req.duration} {req.timeOffType?.unit}
                </td>
                <td className="px-5 py-4 text-purple-300/70 max-w-xs truncate">
                  {req.reason || '—'}
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    req.status === 'Approved' ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30' :
                    req.status === 'Refused' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    'bg-purple-500/20 text-purple-200 border border-purple-500/30'
                  }`}>
                    {req.status}
                  </span>
                </td>
                {canApprove && (
                  <td className="px-5 py-4 text-right">
                    {req.status === 'Pending' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="px-3 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl text-[11px] font-black flex items-center gap-1 transition shadow-sm"
                        >
                          <Check size={13} /> Approve (Deduct)
                        </button>
                        <button
                          onClick={() => handleRefuse(req.id)}
                          className="px-3 py-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 transition"
                        >
                          <X size={13} /> Refuse
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-purple-400/50 font-mono">Completed</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#090712] border border-purple-800/60 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400" />
              Request Time Off
            </h2>
            <p className="text-xs text-purple-300/60 mb-4">
              Submits request for HR approval. Live balance will be deducted upon approval.
            </p>

            {error && (
              <div className="mb-4 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
              <div>
                <label className="block text-purple-300/80 mb-1 font-semibold">Time Off Type</label>
                <select
                  value={requestForm.timeOffTypeId}
                  onChange={(e) => setRequestForm({ ...requestForm, timeOffTypeId: e.target.value })}
                  className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                >
                  {types.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.unit})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-purple-300/80 mb-1 font-semibold">Start Date</label>
                  <input
                    type="date"
                    required
                    value={requestForm.startDate}
                    onChange={(e) => setRequestForm({ ...requestForm, startDate: e.target.value })}
                    className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-purple-300/80 mb-1 font-semibold">End Date</label>
                  <input
                    type="date"
                    required
                    value={requestForm.endDate}
                    onChange={(e) => setRequestForm({ ...requestForm, endDate: e.target.value })}
                    className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-purple-300/80 mb-1 font-semibold">Duration (Days / Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  value={requestForm.duration}
                  onChange={(e) => setRequestForm({ ...requestForm, duration: Number(e.target.value) })}
                  className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-purple-300/80 mb-1 font-semibold">Reason / Notes</label>
                <textarea
                  value={requestForm.reason}
                  onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                  className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  placeholder="e.g. Annual summer family vacation"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 bg-purple-950/60 border border-purple-900/50 text-purple-300 rounded-xl hover:bg-purple-900/40 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl font-black shadow-lg shadow-amber-500/20"
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
