import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Clock, Plus, Play, Square, Sparkles, Search, ChevronDown, Check, X, AlertCircle, User, Calendar } from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Searchable Employee Select state
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [isEmpDropdownOpen, setIsEmpDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Attendance Activity Log Search & Filter state
  const [logSearch, setLogSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');

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

  // Click outside to close employee dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsEmpDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const filteredEmployees = employees.filter((emp) => {
    const q = employeeSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      emp.name?.toLowerCase().includes(q) ||
      (emp.department && emp.department.toLowerCase().includes(q)) ||
      (emp.jobPosition && emp.jobPosition.toLowerCase().includes(q))
    );
  });

  const selectedEmployee = employees.find(e => e.id === manualForm.employeeId);

  const filteredAttendances = attendances.filter((att) => {
    const q = logSearch.toLowerCase().trim();
    const empName = (att.employee?.name || '').toLowerCase();
    const empDept = (att.employee?.department || '').toLowerCase();
    const status = (att.status || '').toLowerCase();
    const checkInDate = new Date(att.checkIn).toLocaleDateString().toLowerCase();

    const matchesSearch =
      !q ||
      empName.includes(q) ||
      empDept.includes(q) ||
      status.includes(q) ||
      checkInDate.includes(q);

    const matchesStatus = statusFilter === 'All' || att.status === statusFilter;

    const matchesDate = (() => {
      if (dateFilter === 'All') return true;

      const attDate = new Date(att.checkIn);
      const now = new Date();

      if (dateFilter === 'Today') {
        return attDate.toDateString() === now.toDateString();
      }
      if (dateFilter === 'Last7Days') {
        const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        return attDate >= sevenDaysAgo;
      }
      if (dateFilter === 'ThisMonth') {
        return (
          attDate.getMonth() === now.getMonth() &&
          attDate.getFullYear() === now.getFullYear()
        );
      }
      if (dateFilter === 'LastMonth') {
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        return attDate >= firstDayLastMonth && attDate <= lastDayLastMonth;
      }
      if (dateFilter === 'Last30Days') {
        const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        return attDate >= thirtyDaysAgo;
      }
      if (dateFilter === 'ThisYear') {
        return attDate.getFullYear() === now.getFullYear();
      }
      if (dateFilter === 'LastYear') {
        return attDate.getFullYear() === now.getFullYear() - 1;
      }
      return true;
    })();

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-6">
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
                  setEmployeeSearch('');
                  setIsEmpDropdownOpen(false);
                  if (employees.length > 0) {
                    setManualForm(prev => ({ ...prev, employeeId: prev.employeeId || employees[0].id }));
                  }
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
        {/* Table Header with Search & Filter */}
        <div className="p-4 bg-purple-50/70 dark:bg-[#06050b] border-b border-purple-100 dark:border-purple-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Attendance Log Activity</span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold">
              {filteredAttendances.length === attendances.length
                ? `${attendances.length} Records`
                : `${filteredAttendances.length} of ${attendances.length} Records`}
            </span>
          </div>

          {/* Search and Status Filter Controls */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-80">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-purple-400/70 pointer-events-none" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Search employee, dept, status, date..."
                className="w-full bg-white dark:bg-[#0e0c18] border border-slate-200 dark:border-purple-900/50 rounded-xl pl-10 pr-9 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-purple-400/50 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
              />
              {logSearch && (
                <button
                  type="button"
                  onClick={() => setLogSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white dark:bg-[#0e0c18] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-purple-200 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Overtime">Overtime</option>
              <option value="Absent">Absent</option>
              <option value="MissingCheckout">MissingCheckout</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-white dark:bg-[#0e0c18] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-purple-200 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium cursor-pointer"
            >
              <option value="All">All Time</option>
              <option value="Today">Today</option>
              <option value="Last7Days">Last Week (7 Days)</option>
              <option value="ThisMonth">This Month</option>
              <option value="LastMonth">Last Month</option>
              <option value="Last30Days">Last 30 Days</option>
              <option value="ThisYear">This Year</option>
              <option value="LastYear">Last Year</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
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
              {filteredAttendances.length > 0 ? (
                filteredAttendances.map((att) => (
                  <tr key={att.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition">
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-purple-600 to-amber-500 text-white flex items-center justify-center font-bold text-[10px] shadow-sm shrink-0">
                          {att.employee?.name ? att.employee.name[0] : 'E'}
                        </div>
                        <div>
                          <div>{att.employee?.name || 'Unknown'}</div>
                          {att.employee?.department && (
                            <div className="text-[10px] text-slate-500 dark:text-purple-400/60 font-normal">
                              {att.employee.department}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-600 dark:text-purple-300/80">
                      {new Date(att.checkIn).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-700 dark:text-purple-200">
                      {new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-700 dark:text-purple-200">
                      {att.checkOut ? (
                        new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      ) : (
                        <span className="text-amber-700 dark:text-amber-300 font-sans text-[11px] font-bold">Active Session</span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono font-black text-amber-600 dark:text-amber-300">
                      {att.workedHours} hrs
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          att.status === 'Present'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                            : att.status === 'Overtime'
                            ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-500/30'
                            : att.status === 'Late'
                            ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-500/30'
                            : att.status === 'MissingCheckout'
                            ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {att.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {att.isManualEdit ? (
                        <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-400/30 px-2 py-0.5 rounded-md font-semibold">Manual Edit</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 dark:text-purple-400/50">Biometric/Web</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 dark:text-purple-400/60">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search size={28} className="text-slate-300 dark:text-purple-700/50" />
                      <p className="font-semibold text-sm text-slate-600 dark:text-purple-300">No attendance logs found</p>
                      <p className="text-xs text-slate-400 dark:text-purple-400/60 max-w-sm">
                        {logSearch ? `No records match "${logSearch}".` : 'No attendance logs recorded yet.'}
                      </p>
                      {(logSearch || statusFilter !== 'All' || dateFilter !== 'All') && (
                        <button
                          type="button"
                          onClick={() => {
                            setLogSearch('');
                            setStatusFilter('All');
                            setDateFilter('All');
                          }}
                          className="mt-2 px-3.5 py-1.5 text-xs rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold hover:bg-purple-200 dark:hover:bg-purple-800/40 cursor-pointer"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Attendance Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div
            className="fixed inset-0"
            onClick={() => setShowManualModal(false)}
          />
          <div className="relative bg-white dark:bg-[#090712] border border-purple-200 dark:border-purple-800/60 rounded-3xl w-full max-w-md p-6 shadow-2xl z-10 transition-colors duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-purple-100 dark:border-purple-900/50">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-400/30">
                  <Sparkles size={16} />
                </div>
                Log Manual Attendance
              </h2>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-purple-950/60 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateManual} className="space-y-4 text-xs">
              {/* Searchable Employee Combobox */}
              <div className="relative" ref={dropdownRef}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-700 dark:text-purple-300/80 font-semibold text-xs flex items-center gap-1.5">
                    <User size={13} className="text-amber-500 dark:text-amber-400" />
                    Employee
                  </label>
                  <span className="text-[10px] text-slate-500 dark:text-purple-400/60">
                    {filteredEmployees.length} of {employees.length} available
                  </span>
                </div>

                {/* Search Bar Input */}
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-purple-400/70 pointer-events-none" />
                  <input
                    type="text"
                    value={employeeSearch}
                    onChange={(e) => {
                      setEmployeeSearch(e.target.value);
                      setIsEmpDropdownOpen(true);
                    }}
                    onFocus={() => setIsEmpDropdownOpen(true)}
                    placeholder={selectedEmployee ? `${selectedEmployee.name} (${selectedEmployee.department})` : "Type name or department to search..."}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl pl-10 pr-9 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-purple-300/60 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                  />
                  {employeeSearch ? (
                    <button
                      type="button"
                      onClick={() => setEmployeeSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEmpDropdownOpen(!isEmpDropdownOpen)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                    >
                      <ChevronDown size={14} />
                    </button>
                  )}
                </div>

                {/* Selected Employee Preview Pill */}
                {selectedEmployee && !isEmpDropdownOpen && (
                  <div className="mt-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Selected: <strong>{selectedEmployee.name}</strong>
                    </span>
                    <span className="text-slate-500 dark:text-purple-400/60 font-mono text-[10px]">
                      {selectedEmployee.department}
                    </span>
                  </div>
                )}

                {/* Dropdown Options List */}
                {isEmpDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#0e0c18] border border-purple-200 dark:border-purple-800/80 rounded-2xl shadow-2xl max-h-48 overflow-y-auto p-1.5 space-y-1 text-xs">
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((e) => {
                        const isSelected = manualForm.employeeId === e.id;
                        return (
                          <div
                            key={e.id}
                            onClick={() => {
                              setManualForm({ ...manualForm, employeeId: e.id });
                              setEmployeeSearch('');
                              setIsEmpDropdownOpen(false);
                            }}
                            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition ${
                              isSelected
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30'
                                : 'text-slate-800 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-purple-600 to-amber-500 text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
                                {e.name[0]}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white text-xs">{e.name}</div>
                                <div className="text-[10px] text-slate-500 dark:text-purple-400/70 font-normal">
                                  {e.jobPosition ? `${e.jobPosition} • ` : ''}{e.department}
                                </div>
                              </div>
                            </div>
                            {isSelected && <Check size={14} className="text-amber-500 dark:text-amber-400 shrink-0" />}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3 text-center text-slate-400 dark:text-purple-400/60 text-xs">
                        No employees found matching "{employeeSearch}"
                      </div>
                    )}
                  </div>
                )}
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
