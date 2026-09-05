import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { attendanceService } from '../lib/attendanceService';

export default function Attendance() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [manualForm, setManualForm] = useState({
    checkIn: '',
    checkOut: '',
    status: 'Present',
    workedHours: '',
  });

  const [showAbsentModal, setShowAbsentModal] = useState(false);
  const [absentForm, setAbsentForm] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    reason: '',
  });

  // Current employee check-in status
  const [currentShift, setCurrentShift] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const isHR = ['HRManager', 'HRPayrollManager', 'Admin'].includes(user?.role);
  const employeeId = user?.employeeId || (user?.role === 'Employee' ? 'emp-001' : 'emp-admin');

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = { limit: 100 };
      if (filterEmployeeId.trim()) queryParams.employeeId = filterEmployeeId.trim();
      if (filterStatus) queryParams.status = filterStatus;

      const data = await attendanceService.list(queryParams);
      setRecords(data);

      // Check if user currently has an open shift (checkOut == null)
      const openShift = data.find(
        (r) =>
          (r.employeeId === employeeId || r.employeeId === user?.uid) &&
          !r.checkOut &&
          r.status !== 'Absent'
      );
      setCurrentShift(openShift || null);
    } catch (err) {
      setError(err.message || 'Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  }, [filterEmployeeId, filterStatus, employeeId, user?.uid]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setError(null);
    setSuccessMsg('');
    try {
      await attendanceService.checkIn({
        employeeId,
        checkInTime: new Date().toISOString(),
      });
      setSuccessMsg('Successfully checked in!');
      await loadAttendance();
    } catch (err) {
      setError(err.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setError(null);
    setSuccessMsg('');
    try {
      await attendanceService.checkOut({
        attendanceId: currentShift?.id,
        employeeId,
        checkOutTime: new Date().toISOString(),
      });
      setSuccessMsg('Successfully checked out! Worked hours recorded.');
      await loadAttendance();
    } catch (err) {
      setError(err.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  const openManualCorrection = (record) => {
    setSelectedRecord(record);
    setManualForm({
      checkIn: record.checkIn
        ? new Date(record.checkIn).toISOString().slice(0, 16)
        : '',
      checkOut: record.checkOut
        ? new Date(record.checkOut).toISOString().slice(0, 16)
        : '',
      status: record.status || 'Present',
      workedHours: record.workedHours !== null ? String(record.workedHours) : '',
    });
    setShowManualModal(true);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setActionLoading(true);
    setError(null);
    try {
      await attendanceService.manualCorrect(selectedRecord.id, {
        checkIn: manualForm.checkIn ? new Date(manualForm.checkIn).toISOString() : null,
        checkOut: manualForm.checkOut ? new Date(manualForm.checkOut).toISOString() : null,
        status: manualForm.status,
        workedHours: manualForm.workedHours !== '' ? Number(manualForm.workedHours) : undefined,
      });
      setSuccessMsg(`Record for ${selectedRecord.employeeId} updated (marked as Manual Edit).`);
      setShowManualModal(false);
      await loadAttendance();
    } catch (err) {
      setError(err.message || 'Manual correction failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordAbsent = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      await attendanceService.recordAbsent({
        employeeId: absentForm.employeeId.trim(),
        date: absentForm.date,
        reason: absentForm.reason,
      });
      setSuccessMsg(`Marked employee ${absentForm.employeeId} as Absent.`);
      setShowAbsentModal(false);
      setAbsentForm({ employeeId: '', date: new Date().toISOString().split('T')[0], reason: '' });
      await loadAttendance();
    } catch (err) {
      setError(err.message || 'Failed to record Absent');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Present':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Late':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Overtime':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'MissingCheckout':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'Absent':
        return 'bg-stone-700/30 text-stone-400 border-stone-600/30';
      default:
        return 'bg-white/5 text-stone-400 border-white/10';
    }
  };

  const stats = {
    total: records.length,
    present: records.filter((r) => r.status === 'Present').length,
    late: records.filter((r) => r.status === 'Late').length,
    overtime: records.filter((r) => r.status === 'Overtime').length,
    missingCheckout: records.filter((r) => r.status === 'MissingCheckout').length,
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-asset-light flex items-center gap-3">
            <span>Attendance Console</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              P2 Scope
            </span>
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Automated punch console, scheduled pattern matching, worked hours & overtime tracking.
          </p>
        </div>

        {isHR && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAbsentModal(true)}
              className="px-3.5 py-2 rounded-lg bg-stone-900 border border-glass-border text-xs font-semibold text-stone-300 hover:text-white hover:bg-stone-800 transition shadow-sm"
            >
              + Mark Absent
            </button>
          </div>
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

      {/* Interactive Punch Console Card */}
      <div className="glass-panel p-6 border border-glass-border relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="text-[11px] uppercase tracking-widest font-mono text-emerald-400">
              Live Terminal Time
            </div>
            <div className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-asset-light">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-xs text-stone-400 font-mono">
              {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            {currentShift ? (
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="glass-panel px-4 py-3 border border-emerald-500/30 text-center">
                  <div className="text-[10px] uppercase font-bold text-emerald-400">Active Shift</div>
                  <div className="text-xs font-mono font-semibold text-asset-light mt-0.5">
                    Checked in at {new Date(currentShift.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <span className={`inline-block mt-1 text-[9px] px-2 py-0.5 rounded border ${getStatusBadge(currentShift.status)}`}>
                    {currentShift.status}
                  </span>
                </div>
                <button
                  onClick={handleCheckOut}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider transition active:scale-[0.98] shadow-lg shadow-rose-950/50 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Check Out Now'}
                </button>
              </div>
            ) : (
              <button
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition active:scale-[0.98] shadow-green-glow disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                {actionLoading ? 'Punching In...' : 'Check In (Punch)'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="glass-panel p-3 border border-glass-border">
          <p className="text-[10px] uppercase font-bold text-stone-400">Total Records</p>
          <p className="text-2xl font-bold text-asset-light mt-1">{stats.total}</p>
        </div>
        <div className="glass-panel p-3 border border-glass-border">
          <p className="text-[10px] uppercase font-bold text-emerald-400">Present</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.present}</p>
        </div>
        <div className="glass-panel p-3 border border-glass-border">
          <p className="text-[10px] uppercase font-bold text-amber-400">Late</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{stats.late}</p>
        </div>
        <div className="glass-panel p-3 border border-glass-border">
          <p className="text-[10px] uppercase font-bold text-purple-400">Overtime</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{stats.overtime}</p>
        </div>
        <div className="glass-panel p-3 border border-glass-border">
          <p className="text-[10px] uppercase font-bold text-rose-400">Missing Checkout</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">{stats.missingCheckout}</p>
        </div>
      </div>

      {/* Global Attendance Table with Filters */}
      <div className="glass-panel border border-glass-border overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-glass-border flex flex-col md:flex-row items-center justify-between gap-3 bg-white/[0.01]">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Filter by Employee ID..."
              value={filterEmployeeId}
              onChange={(e) => setFilterEmployeeId(e.target.value)}
              className="bg-stone-950/60 border border-glass-border rounded-lg px-3 py-1.5 text-xs text-asset-light placeholder-stone-500 focus:outline-none focus:border-emerald-500"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-stone-950/60 border border-glass-border rounded-lg px-3 py-1.5 text-xs text-asset-light focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
              <option value="Overtime">Overtime</option>
              <option value="MissingCheckout">MissingCheckout</option>
            </select>
          </div>

          <button
            onClick={loadAttendance}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-stone-300 hover:text-white border border-glass-border"
          >
            Refresh Data
          </button>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-8 text-center text-xs text-stone-400">Loading attendance records...</div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-400">
            No attendance records found matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-glass-border text-stone-400 text-[10px] uppercase font-bold bg-white/[0.01]">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Check In</th>
                  <th className="py-3 px-4">Check Out</th>
                  <th className="py-3 px-4">Worked Hours</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Manual Edit</th>
                  {isHR && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3 px-4 font-mono font-semibold text-asset-light">
                      {rec.employeeId}
                    </td>
                    <td className="py-3 px-4 text-stone-300">
                      {rec.checkIn ? new Date(rec.checkIn).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-stone-300">
                      {rec.checkIn
                        ? new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-stone-300">
                      {rec.checkOut
                        ? new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : rec.status === 'Absent'
                        ? '—'
                        : 'Open'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-asset-light">
                      {rec.workedHours !== null ? `${rec.workedHours} hrs` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(rec.status)}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[10px]">
                      {rec.isManualEdit ? (
                        <span className="text-amber-400 font-mono">Yes (Corrected)</span>
                      ) : (
                        <span className="text-stone-500">No</span>
                      )}
                    </td>
                    {isHR && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openManualCorrection(rec)}
                          className="px-2.5 py-1 text-[10px] rounded bg-white/5 hover:bg-white/10 text-stone-300 border border-glass-border font-medium"
                        >
                          Manual Correct
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Correction Modal (HRManager+ only) */}
      {showManualModal && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 border border-glass-border max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-glass-border pb-3">
              <h3 className="text-sm font-bold text-asset-light uppercase tracking-wider">
                Manual Attendance Correction
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-amber-400/90 font-mono">
              ⚠️ Role-gated action: saving will permanently stamp `isManualEdit: true` on this record.
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                  Employee ID
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedRecord.employeeId}
                  className="w-full bg-stone-900 border border-glass-border rounded-lg px-3 py-2 text-stone-400"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                  Check-In Timestamp
                </label>
                <input
                  type="datetime-local"
                  value={manualForm.checkIn}
                  onChange={(e) => setManualForm({ ...manualForm, checkIn: e.target.value })}
                  className="w-full bg-stone-950/70 border border-glass-border rounded-lg px-3 py-2 text-asset-light focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                  Check-Out Timestamp
                </label>
                <input
                  type="datetime-local"
                  value={manualForm.checkOut}
                  onChange={(e) => setManualForm({ ...manualForm, checkOut: e.target.value })}
                  className="w-full bg-stone-950/70 border border-glass-border rounded-lg px-3 py-2 text-asset-light focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                  Status Override
                </label>
                <select
                  value={manualForm.status}
                  onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                  className="w-full bg-stone-950/70 border border-glass-border rounded-lg px-3 py-2 text-asset-light focus:outline-none focus:border-emerald-500"
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Absent">Absent</option>
                  <option value="Overtime">Overtime</option>
                  <option value="MissingCheckout">MissingCheckout</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                  Worked Hours (Optional: Leave blank to auto-compute)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Auto-calculated if blank"
                  value={manualForm.workedHours}
                  onChange={(e) => setManualForm({ ...manualForm, workedHours: e.target.value })}
                  className="w-full bg-stone-950/70 border border-glass-border rounded-lg px-3 py-2 text-asset-light focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 text-stone-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Absent Modal (HRManager+ only) */}
      {showAbsentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 border border-glass-border max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-glass-border pb-3">
              <h3 className="text-sm font-bold text-asset-light uppercase tracking-wider">
                Record Scheduled Absence
              </h3>
              <button
                onClick={() => setShowAbsentModal(false)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordAbsent} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                  Employee ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. emp_001"
                  value={absentForm.employeeId}
                  onChange={(e) => setAbsentForm({ ...absentForm, employeeId: e.target.value })}
                  className="w-full bg-stone-950/70 border border-glass-border rounded-lg px-3 py-2 text-asset-light focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={absentForm.date}
                  onChange={(e) => setAbsentForm({ ...absentForm, date: e.target.value })}
                  className="w-full bg-stone-950/70 border border-glass-border rounded-lg px-3 py-2 text-asset-light focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">
                  Reason / Notes
                </label>
                <textarea
                  rows="2"
                  placeholder="Unexcused absence / sick with no notice..."
                  value={absentForm.reason}
                  onChange={(e) => setAbsentForm({ ...absentForm, reason: e.target.value })}
                  className="w-full bg-stone-950/70 border border-glass-border rounded-lg px-3 py-2 text-asset-light focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAbsentModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 text-stone-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold disabled:opacity-50"
                >
                  {actionLoading ? 'Recording...' : 'Record Absent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
