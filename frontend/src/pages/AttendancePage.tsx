import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckCircle, AlertTriangle, Plus, Play, Square, UserCheck, Calendar } from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [employees, setEmployees] = useState<any[]>([]);

  const [manualForm, setManualForm] = useState({
    employeeId: '',
    checkIn: new Date().toISOString().slice(0, 16),
    checkOut: '',
    status: 'Present'
  });

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/attendance');
      setAttendances(data);

      // Check for user's own active check-in session
      if (user?.employeeId) {
        const active = data.find((a: any) => a.employeeId === user.employeeId && !a.checkOut);
        setActiveSession(active || null);
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    if (user?.role !== 'Employee') {
      apiRequest('/employees').then(setEmployees).catch(console.error);
    }
  }, [user]);

  const handleCheckIn = async () => {
    try {
      await apiRequest('/attendance/check-in', { method: 'POST', body: JSON.stringify({}) });
      fetchAttendance();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCheckOut = async () => {
    try {
      await apiRequest('/attendance/check-out', { method: 'POST', body: JSON.stringify({}) });
      fetchAttendance();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/attendance/manual', {
        method: 'POST',
        body: JSON.stringify(manualForm)
      });
      setShowManualModal(false);
      fetchAttendance();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Punch Clock / Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-slate-800/40 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Clock className="text-blue-400" />
              Attendance & Time Tracking
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Live punch logs automatically feed into the payroll calculation engine for worked days computation.
            </p>
          </div>

          {user?.role !== 'Employee' && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  if (employees.length > 0) setManualForm(prev => ({ ...prev, employeeId: employees[0].id }));
                  setShowManualModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold"
              >
                <Plus size={15} /> Log Manual Record
              </button>
            </div>
          )}
        </div>

        {/* Live Punch Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/80 p-5 rounded-2xl flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Punch Terminal</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          <div className="my-3">
            <div className="text-xs text-slate-400">Current Session User:</div>
            <div className="text-sm font-bold text-white">{user?.name}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Status: {activeSession ? (
                <span className="text-emerald-400 font-semibold">Checked-In since {new Date(activeSession.checkIn).toLocaleTimeString()}</span>
              ) : (
                <span className="text-slate-500 font-semibold">Checked-Out</span>
              )}
            </div>
          </div>

          {activeSession ? (
            <button
              onClick={handleCheckOut}
              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition"
            >
              <Square size={16} fill="white" /> Punch Out
            </button>
          ) : (
            <button
              onClick={handleCheckIn}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition"
            >
              <Play size={16} fill="white" /> Punch In (Check-In)
            </button>
          )}
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200">Attendance Log Activity</span>
          <span className="text-xs text-slate-500">{attendances.length} Records</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-3.5">Employee</th>
              <th className="px-5 py-3.5">Date</th>
              <th className="px-5 py-3.5">Check In</th>
              <th className="px-5 py-3.5">Check Out</th>
              <th className="px-5 py-3.5">Worked Hours</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Audit Flag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {attendances.map((att) => (
              <tr key={att.id} className="hover:bg-slate-800/40 transition">
                <td className="px-5 py-3.5 font-medium text-white">
                  {att.employee?.name}
                </td>
                <td className="px-5 py-3.5 font-mono text-slate-400">
                  {new Date(att.checkIn).toLocaleDateString()}
                </td>
                <td className="px-5 py-3.5 font-mono text-slate-300">
                  {new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-5 py-3.5 font-mono text-slate-300">
                  {att.checkOut ? new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (
                    <span className="text-amber-400 font-sans text-[11px] font-semibold">Active Session</span>
                  )}
                </td>
                <td className="px-5 py-3.5 font-mono font-bold text-white">
                  {att.workedHours} hrs
                </td>
                <td className="px-5 py-3.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    att.status === 'Present' ? 'bg-emerald-500/20 text-emerald-300' :
                    att.status === 'Overtime' ? 'bg-purple-500/20 text-purple-300' :
                    att.status === 'Late' ? 'bg-amber-500/20 text-amber-300' :
                    att.status === 'MissingCheckout' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {att.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  {att.isManualEdit ? (
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Manual Edit</span>
                  ) : (
                    <span className="text-[10px] text-slate-500">Biometric/Web</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Manual Attendance Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Log Manual Attendance</h2>
            <form onSubmit={handleCreateManual} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Employee</label>
                <select
                  value={manualForm.employeeId}
                  onChange={(e) => setManualForm({ ...manualForm, employeeId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Check-In Time</label>
                <input
                  type="datetime-local"
                  required
                  value={manualForm.checkIn}
                  onChange={(e) => setManualForm({ ...manualForm, checkIn: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Check-Out Time (Optional)</label>
                <input
                  type="datetime-local"
                  value={manualForm.checkOut}
                  onChange={(e) => setManualForm({ ...manualForm, checkOut: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Status Tag</label>
                <select
                  value={manualForm.status}
                  onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Overtime">Overtime</option>
                  <option value="Absent">Absent</option>
                  <option value="MissingCheckout">MissingCheckout</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
