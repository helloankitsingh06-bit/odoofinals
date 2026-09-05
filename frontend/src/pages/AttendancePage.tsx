import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Clock, Plus, Play, Square, Sparkles } from 'lucide-react';

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
    <div className="space-y-6 animate-fadeIn">
      {/* Punch Clock / Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-[#0b0914]/80 border border-purple-900/40 p-6 rounded-3xl backdrop-blur-xl shadow-2xl flex flex-col justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Clock className="text-amber-400" />
              Attendance & Time Tracking
            </h1>
            <p className="text-sm text-purple-200/60 mt-1">
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
                className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 border border-purple-800/50 rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Plus size={15} /> Log Manual Record
              </button>
            </div>
          )}
        </div>

        {/* Live Punch Card */}
        <div className="bg-gradient-to-br from-[#0e0b1c] to-[#18132c] border border-purple-800/60 p-6 rounded-3xl flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={13} className="text-purple-400" /> Punch Terminal
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
            </span>
          </div>

          <div className="my-4">
            <div className="text-xs text-purple-300/70 font-medium">Current Session User:</div>
            <div className="text-base font-bold text-white mt-0.5">{user?.name}</div>
            <div className="text-[11px] text-purple-300/70 mt-1">
              Status: {activeSession ? (
                <span className="text-amber-300 font-bold">Checked-In since {new Date(activeSession.checkIn).toLocaleTimeString()}</span>
              ) : (
                <span className="text-purple-400/50 font-semibold">Checked-Out</span>
              )}
            </div>
          </div>

          {activeSession ? (
            <button
              onClick={handleCheckOut}
              className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition active:scale-95"
            >
              <Square size={15} fill="white" /> Punch Out
            </button>
          ) : (
            <button
              onClick={handleCheckIn}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition active:scale-95"
            >
              <Play size={15} fill="#05040a" /> Punch In (Check-In)
            </button>
          )}
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-[#0b0914]/80 border border-purple-900/40 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 bg-[#06050b] border-b border-purple-900/50 flex items-center justify-between">
          <span className="text-xs font-bold text-amber-300">Attendance Log Activity</span>
          <span className="text-xs text-purple-400/60 font-medium">{attendances.length} Records</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-[#06050b] text-purple-300/70 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-4">Employee</th>
              <th className="px-5 py-4">Date</th>
              <th className="px-5 py-4">Check In</th>
              <th className="px-5 py-4">Check Out</th>
              <th className="px-5 py-4">Worked Hours</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Audit Flag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-950 text-purple-100">
            {attendances.map((att) => (
              <tr key={att.id} className="hover:bg-purple-950/20 transition">
                <td className="px-5 py-4 font-bold text-white">
                  {att.employee?.name}
                </td>
                <td className="px-5 py-4 font-mono text-purple-300/80">
                  {new Date(att.checkIn).toLocaleDateString()}
                </td>
                <td className="px-5 py-4 font-mono text-purple-200">
                  {new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-5 py-4 font-mono text-purple-200">
                  {att.checkOut ? new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (
                    <span className="text-amber-300 font-sans text-[11px] font-bold">Active Session</span>
                  )}
                </td>
                <td className="px-5 py-4 font-mono font-black text-amber-300">
                  {att.workedHours} hrs
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    att.status === 'Present' ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30' :
                    att.status === 'Overtime' ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30' :
                    att.status === 'Late' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                    att.status === 'MissingCheckout' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {att.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  {att.isManualEdit ? (
                    <span className="text-[10px] text-amber-300 bg-amber-500/15 border border-amber-400/30 px-2 py-0.5 rounded-md font-semibold">Manual Edit</span>
                  ) : (
                    <span className="text-[10px] text-purple-400/50">Biometric/Web</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Manual Attendance Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#090712] border border-purple-800/60 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400" />
              Log Manual Attendance
            </h2>
            <form onSubmit={handleCreateManual} className="space-y-4 text-xs">
              <div>
                <label className="block text-purple-300/80 mb-1 font-semibold">Employee</label>
                <select
                  value={manualForm.employeeId}
                  onChange={(e) => setManualForm({ ...manualForm, employeeId: e.target.value })}
                  className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-purple-300/80 mb-1 font-semibold">Check-In Time</label>
                <input
                  type="datetime-local"
                  required
                  value={manualForm.checkIn}
                  onChange={(e) => setManualForm({ ...manualForm, checkIn: e.target.value })}
                  className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-purple-300/80 mb-1 font-semibold">Check-Out Time (Optional)</label>
                <input
                  type="datetime-local"
                  value={manualForm.checkOut}
                  onChange={(e) => setManualForm({ ...manualForm, checkOut: e.target.value })}
                  className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-purple-300/80 mb-1 font-semibold">Status Tag</label>
                <select
                  value={manualForm.status}
                  onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                  className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Overtime">Overtime</option>
                  <option value="Absent">Absent</option>
                  <option value="MissingCheckout">MissingCheckout</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 bg-purple-950/60 border border-purple-900/50 text-purple-300 rounded-xl hover:bg-purple-900/40 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl font-black shadow-lg shadow-amber-500/20"
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
