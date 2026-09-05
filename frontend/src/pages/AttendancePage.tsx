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
  const [error, setError] = useState<string | null>(null);

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
      apiRequest('/employees').then((emps) => {
        setEmployees(emps);
        if (emps && emps.length > 0) {
          setManualForm(prev => ({
            ...prev,
            employeeId: prev.employeeId || emps[0].id
          }));
        }
      }).catch(console.error);
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
    setError(null);
    try {
      const empId = manualForm.employeeId || (employees.length > 0 ? employees[0].id : '');
      if (!empId) {
        setError('Please select an employee');
        return;
      }
      await apiRequest('/attendance/manual', {
        method: 'POST',
        body: JSON.stringify({
          ...manualForm,
          employeeId: empId
        })
      });
      setShowManualModal(false);
      fetchAttendance();
    } catch (err: any) {
      setError(err.message || 'Failed to create manual attendance record');
    }
  };

  const handleDeleteAttendance = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) return;
    try {
      await apiRequest(`/attendance/${id}`, { method: 'DELETE' });
      fetchAttendance();
    } catch (err: any) {
      alert(err.message || 'Failed to delete attendance record');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Punch Clock / Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white/90 dark:bg-[#0b0914]/80 border border-purple-100 dark:border-purple-900/40 p-6 rounded-3xl backdrop-blur-xl shadow-lg dark:shadow-2xl flex flex-col justify-between transition-colors duration-300">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Clock className="text-amber-500 dark:text-amber-400" />
              Attendance & Time Tracking
            </h1>
            <p className="text-sm text-slate-600 dark:text-purple-200/60 mt-1 font-medium">
              Live punch logs automatically feed into the payroll calculation engine for worked days computation.
            </p>
          </div>

          {user?.role !== 'Employee' && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setError(null);
                  if (employees.length > 0) setManualForm(prev => ({ ...prev, employeeId: prev.employeeId || employees[0].id }));
                  setShowManualModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800/50 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Plus size={15} /> Log Manual Record
              </button>
            </div>
          )}
        </div>

        {/* Live Punch Card */}
        <div className="bg-gradient-to-br from-purple-50 via-amber-50/40 to-purple-100/60 dark:from-[#0e0b1c] dark:to-[#18132c] border border-purple-200 dark:border-purple-800/60 p-6 rounded-3xl flex flex-col justify-between shadow-md dark:shadow-2xl relative overflow-hidden transition-colors duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={13} className="text-purple-600 dark:text-purple-400" /> Punch Terminal
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 dark:bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 dark:bg-amber-400"></span>
            </span>
          </div>

          <div className="my-4">
            <div className="text-xs text-slate-500 dark:text-purple-300/70 font-medium">Current Session User:</div>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{user?.name}</div>
            <div className="text-[11px] text-slate-600 dark:text-purple-300/70 mt-1">
              Status: {activeSession ? (
                <span className="text-amber-700 dark:text-amber-300 font-bold">Checked-In since {new Date(activeSession.checkIn).toLocaleTimeString()}</span>
              ) : (
                <span className="text-slate-400 dark:text-purple-400/50 font-semibold">Checked-Out</span>
              )}
            </div>
          </div>

          {activeSession ? (
            <button
              onClick={handleCheckOut}
              className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-rose-600/30 transition active:scale-95 cursor-pointer"
            >
              <Square size={15} fill="white" /> Punch Out
            </button>
          ) : (
            <button
              onClick={handleCheckIn}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-amber-500/25 transition active:scale-95 cursor-pointer"
            >
              <Play size={15} fill="#05040a" /> Punch In (Check-In)
            </button>
          )}
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white dark:bg-[#0b0914]/80 border border-purple-100 dark:border-purple-900/40 rounded-3xl overflow-hidden shadow-md dark:shadow-2xl transition-colors duration-300">
        <div className="p-4 bg-purple-50/70 dark:bg-[#06050b] border-b border-purple-100 dark:border-purple-900/50 flex items-center justify-between">
          <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Attendance Log Activity</span>
          <span className="text-xs text-slate-500 dark:text-purple-400/60 font-medium">{attendances.length} Records</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-purple-50/70 dark:bg-[#06050b] text-purple-900 dark:text-purple-300/70 font-bold uppercase tracking-wider text-[10px] border-b border-purple-100 dark:border-purple-900/50">
            <tr>
              <th className="px-5 py-4">Employee</th>
              <th className="px-5 py-4">Date</th>
              <th className="px-5 py-4">Check In</th>
              <th className="px-5 py-4">Check Out</th>
              <th className="px-5 py-4">Worked Hours</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Audit & Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-100 dark:divide-purple-950 text-slate-800 dark:text-purple-100 font-medium">
            {attendances.map((att) => (
              <tr key={att.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition">
                <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                  {att.employee?.name}
                </td>
                <td className="px-5 py-4 font-mono text-slate-600 dark:text-purple-300/80">
                  {new Date(att.checkIn).toLocaleDateString()}
                </td>
                <td className="px-5 py-4 font-mono text-slate-700 dark:text-purple-200">
                  {new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-5 py-4 font-mono text-slate-700 dark:text-purple-200">
                  {att.checkOut ? new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (
                    <span className="text-amber-700 dark:text-amber-300 font-sans text-[11px] font-bold">Active Session</span>
                  )}
                </td>
                <td className="px-5 py-4 font-mono font-black text-amber-600 dark:text-amber-300">
                  {att.workedHours} hrs
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    att.status === 'Present' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30' :
                    att.status === 'Overtime' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-500/30' :
                    att.status === 'Late' ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-500/30' :
                    att.status === 'MissingCheckout' ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
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

            {error && (
              <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateManual} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Employee</label>
                <select
                  value={manualForm.employeeId}
                  onChange={(e) => setManualForm({ ...manualForm, employeeId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium cursor-pointer"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id} className="bg-white dark:bg-[#0b0914] text-slate-900 dark:text-white">{e.name} ({e.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Check-In Time</label>
                <input
                  type="datetime-local"
                  required
                  value={manualForm.checkIn}
                  onChange={(e) => setManualForm({ ...manualForm, checkIn: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Check-Out Time (Optional)</label>
                <input
                  type="datetime-local"
                  value={manualForm.checkOut}
                  onChange={(e) => setManualForm({ ...manualForm, checkOut: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Status Tag</label>
                <select
                  value={manualForm.status}
                  onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium cursor-pointer"
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Overtime">Overtime</option>
                  <option value="Absent">Absent</option>
                  <option value="MissingCheckout">MissingCheckout</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-purple-100 dark:border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-purple-950/60 border border-slate-200 dark:border-purple-900/50 text-slate-600 dark:text-purple-300 rounded-xl hover:bg-slate-200 dark:hover:bg-purple-900/40 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl font-black shadow-md shadow-amber-500/20 cursor-pointer"
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
