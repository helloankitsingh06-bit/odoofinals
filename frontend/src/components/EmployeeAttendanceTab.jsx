import React, { useState, useEffect, useCallback } from 'react';
import { attendanceService } from '../lib/attendanceService';

/**
 * Embeddable Attendance Tab for P1's Employee Detail view.
 *
 * @param {Object} props
 * @param {string} props.employeeId - The employee ID to show records for.
 * @param {string} [props.employeeName] - Optional employee name for display.
 */
export default function EmployeeAttendanceTab({ employeeId, employeeName = 'Employee' }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAttendance = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await attendanceService.list({ employeeId, limit: 30 });
      setRecords(data);
    } catch (err) {
      setError(err.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const stats = {
    total: records.length,
    present: records.filter((r) => r.status === 'Present').length,
    late: records.filter((r) => r.status === 'Late').length,
    overtime: records.filter((r) => r.status === 'Overtime').length,
    missingCheckout: records.filter((r) => r.status === 'MissingCheckout').length,
    totalWorkedHours: records.reduce((acc, r) => acc + (Number(r.workedHours) || 0), 0),
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

  return (
    <div className="space-y-4 font-sans">
      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-panel p-3 border border-glass-border">
          <p className="text-[10px] uppercase font-bold text-stone-400">Total Shifts</p>
          <p className="text-xl font-bold text-asset-light mt-1">{stats.total}</p>
        </div>
        <div className="glass-panel p-3 border border-glass-border">
          <p className="text-[10px] uppercase font-bold text-emerald-400">Present</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">{stats.present}</p>
        </div>
        <div className="glass-panel p-3 border border-glass-border">
          <p className="text-[10px] uppercase font-bold text-amber-400">Late</p>
          <p className="text-xl font-bold text-amber-400 mt-1">{stats.late}</p>
        </div>
        <div className="glass-panel p-3 border border-glass-border">
          <p className="text-[10px] uppercase font-bold text-purple-400">Total Hours</p>
          <p className="text-xl font-bold text-purple-400 mt-1">
            {stats.totalWorkedHours.toFixed(1)}h
          </p>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="glass-panel border border-glass-border overflow-hidden">
        <div className="p-3 border-b border-glass-border flex justify-between items-center bg-white/[0.01]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-asset-light">
            Attendance Records for {employeeName}
          </h4>
          <button
            onClick={loadAttendance}
            className="text-[10px] px-2.5 py-1 rounded bg-white/5 text-stone-300 hover:text-white border border-glass-border"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-center text-xs text-stone-400">Loading records...</div>
        ) : error ? (
          <div className="p-4 text-center text-xs text-rose-400">{error}</div>
        ) : records.length === 0 ? (
          <div className="p-6 text-center text-xs text-stone-400">
            No attendance records found for this employee.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-glass-border text-stone-400 text-[10px] uppercase font-bold bg-white/[0.01]">
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Check In</th>
                  <th className="py-2.5 px-4">Check Out</th>
                  <th className="py-2.5 px-4">Worked Hours</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Manual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-4 font-mono text-stone-300">
                      {rec.checkIn ? new Date(rec.checkIn).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-stone-300">
                      {rec.checkIn
                        ? new Date(rec.checkIn).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-stone-300">
                      {rec.checkOut
                        ? new Date(rec.checkOut).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Open'}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-asset-light">
                      {rec.workedHours !== null ? `${rec.workedHours} hrs` : '—'}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(
                          rec.status
                        )}`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[10px] text-stone-500">
                      {rec.isManualEdit ? 'Yes' : 'No'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
