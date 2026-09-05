import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Users,
  LayoutGrid,
  List,
  Plus,
  Search,
  FileText,
  Clock,
  Calendar,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { employeeService } from '../lib/employeeService';
import { contractService } from '../lib/contractService';
import { workingScheduleService } from '../lib/workingScheduleService';
import { EMPLOYEE_STATUS, VALID_EMPLOYEE_STATUSES } from '../constants';
import { useAuth } from '../hooks/useAuth';

export default function Employees() {
  const { user } = useAuth();
  const isHRorAdmin = ['Admin', 'HRManager'].includes(user?.role);

  const [employees, setEmployees] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // View Mode: 'kanban' | 'table'
  const [viewMode, setViewMode] = useState('kanban');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    managerId: '',
    jobPosition: '',
    workingScheduleId: '',
    status: EMPLOYEE_STATUS.ACTIVE,
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [empData, contractData, schedData] = await Promise.all([
        employeeService.list(),
        contractService.list().catch(() => []),
        workingScheduleService.list().catch(() => []),
      ]);
      setEmployees(Array.isArray(empData) ? empData : empData.items || []);
      setContracts(Array.isArray(contractData) ? contractData : contractData.items || []);
      setSchedules(Array.isArray(schedData) ? schedData : []);
    } catch (err) {
      console.error('Error fetching employees data:', err);
      setError(err.message || 'Failed to load employees.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Map contracts count per employee
  const contractCountMap = useMemo(() => {
    const map = {};
    for (const c of contracts) {
      if (c.employeeId) {
        map[c.employeeId] = (map[c.employeeId] || 0) + 1;
      }
    }
    return map;
  }, [contracts]);

  // Map schedules by id
  const scheduleMap = useMemo(() => {
    const map = {};
    for (const s of schedules) {
      map[s.id] = s;
    }
    return map;
  }, [schedules]);

  // Unique departments for filter and kanban grouping
  const departments = useMemo(() => {
    const set = new Set();
    employees.forEach((e) => {
      if (e.department && e.department.trim()) set.add(e.department.trim());
    });
    return Array.from(set).sort();
  }, [employees]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = emp.name && emp.name.toLowerCase().includes(q);
        const matchPos = emp.jobPosition && emp.jobPosition.toLowerCase().includes(q);
        if (!matchName && !matchPos) return false;
      }
      if (selectedDept && emp.department !== selectedDept) return false;
      if (selectedStatus && emp.status !== selectedStatus) return false;
      return true;
    });
  }, [employees, searchQuery, selectedDept, selectedStatus]);

  // Open Create/Edit Modal
  const handleOpenModal = (employee = null) => {
    setFormError('');
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name || '',
        department: employee.department || '',
        managerId: employee.managerId || '',
        jobPosition: employee.jobPosition || '',
        workingScheduleId: employee.workingScheduleId || '',
        status: employee.status || EMPLOYEE_STATUS.ACTIVE,
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        name: '',
        department: '',
        managerId: '',
        jobPosition: '',
        workingScheduleId: '',
        status: EMPLOYEE_STATUS.ACTIVE,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
    setFormError('');
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Employee name is required');
      return;
    }

    setFormSubmitting(true);
    try {
      if (editingEmployee) {
        await employeeService.update(editingEmployee.id, formData);
        setSuccessMsg(`Employee "${formData.name}" updated successfully.`);
      } else {
        await employeeService.create(formData);
        setSuccessMsg(`Employee "${formData.name}" created successfully.`);
      }
      handleCloseModal();
      await fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setFormError(err.message || 'Failed to save employee.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (employee) => {
    if (!window.confirm(`Set employee "${employee.name}" status to Inactive?`)) {
      return;
    }
    try {
      await employeeService.remove(employee.id);
      setSuccessMsg(`Employee "${employee.name}" set to Inactive.`);
      await fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to soft delete employee.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5">
        <div>
          <h2 className="text-xl font-bold tracking-wider text-asset-light uppercase flex items-center gap-2.5">
            <Users className="h-5 w-5 text-emerald-400" />
            Employee Master
          </h2>
          <p className="text-xs text-stone-400 font-mono mt-1">
            Total Employees: <span className="text-emerald-400 font-bold">{employees.length}</span> (Active: {employees.filter((e) => e.status === 'Active').length})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-black/40 border border-glass-border rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-asset-green/30 text-emerald-400 border border-emerald-500/30 shadow-green-glow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-asset-green/30 text-emerald-400 border border-emerald-500/30 shadow-green-glow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
          </div>

          {/* Create Button */}
          {isHRorAdmin && (
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-[#1e3427]/90 hover:bg-[#254231] text-[#76c893] border border-[#2d523c] px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] shadow-accent-glow"
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 px-4 py-3 rounded-lg text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {successMsg}
        </div>
      )}
      {error && (
        <div className="bg-red-950/30 border border-red-800/40 text-red-300 px-4 py-3 rounded-lg text-xs font-mono flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-400" />
          {error}
        </div>
      )}

      {/* Filters Bar */}
      <div className="glass-panel p-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or position..."
            className="w-full h-9 bg-black/40 border border-glass-border rounded-md pl-9 pr-3 text-xs text-asset-light placeholder-stone-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 font-mono"
          />
        </div>

        {/* Department Filter */}
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="h-9 bg-black/40 border border-glass-border rounded-md px-3 text-xs text-asset-light focus:outline-none focus:border-emerald-500 font-mono"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="h-9 bg-black/40 border border-glass-border rounded-md px-3 text-xs text-asset-light focus:outline-none focus:border-emerald-500 font-mono"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        {(searchQuery || selectedDept || selectedStatus) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedDept('');
              setSelectedStatus('');
            }}
            className="text-xs text-stone-400 hover:text-stone-200 underline font-mono px-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center space-y-3 glass-panel">
          <div className="h-8 w-8 rounded-full border-2 border-stone-800 border-t-emerald-500 animate-spin"></div>
          <p className="text-xs text-stone-400 font-mono">Loading employees data...</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="p-12 text-center glass-panel">
          <Users className="h-10 w-10 text-stone-600 mx-auto mb-3" />
          <p className="text-sm text-stone-400 font-medium">No employees found.</p>
          <p className="text-xs text-stone-600 font-mono mt-1">
            Try adjusting your search filters or add a new employee.
          </p>
        </div>
      ) : viewMode === 'kanban' ? (
        /* ==================== KANBAN VIEW (Grouped by Department) ==================== */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {(departments.length > 0 ? departments : ['Unassigned']).map((dept) => {
            const deptEmployees = filteredEmployees.filter(
              (e) => (e.department || 'Unassigned') === dept
            );
            if (deptEmployees.length === 0 && selectedDept) return null;

            return (
              <div
                key={dept}
                className="glass-panel p-4 flex flex-col space-y-4 border border-glass-border bg-white/[0.02]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-glass-border">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-asset-light">
                      {dept}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-stone-400 border border-glass-border font-mono">
                    {deptEmployees.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-3">
                  {deptEmployees.map((emp) => {
                    const cCount = contractCountMap[emp.id] || 0;
                    const sched = emp.workingScheduleId ? scheduleMap[emp.workingScheduleId] : null;

                    return (
                      <div
                        key={emp.id}
                        className="p-4 rounded-lg bg-black/40 border border-glass-border hover:border-emerald-500/30 transition-all duration-200 group relative shadow-sm"
                      >
                        {/* Top: Name & Status */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-asset-light group-hover:text-emerald-400 transition-colors">
                              {emp.name}
                            </h4>
                            <p className="text-xs text-stone-400 flex items-center gap-1.5 mt-0.5">
                              <Briefcase className="h-3 w-3 text-stone-500" />
                              {emp.jobPosition || 'No Position Listed'}
                            </p>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono tracking-wider border ${
                              emp.status === 'Active'
                                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.15)]'
                                : 'bg-stone-900/60 text-stone-400 border-stone-800'
                            }`}
                          >
                            {emp.status}
                          </span>
                        </div>

                        {/* Schedule detail */}
                        {sched && (
                          <div className="mt-2.5 pt-2 border-t border-glass-border/50 text-[10px] text-stone-500 font-mono flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-stone-500" />
                            <span>
                              {sched.name} ({sched.totalWeeklyHours}h/wk)
                            </span>
                          </div>
                        )}

                        {/* SMART BUTTONS */}
                        <div className="mt-3 pt-3 border-t border-glass-border flex flex-wrap items-center gap-1.5">
                          <Link
                            to={`/contracts?employeeId=${emp.id}`}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-emerald-950/30 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 transition-all font-mono"
                            title="View Employee Contracts"
                          >
                            <FileText className="h-3 w-3" />
                            Contracts ({cCount})
                          </Link>

                          <Link
                            to={`/employees/${emp.id}/attendance`}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] font-semibold text-stone-400 hover:text-asset-light border border-glass-border transition-all font-mono"
                            title="Attendance (P2 Scope)"
                          >
                            <Clock className="h-3 w-3" />
                            Attendance
                          </Link>

                          <Link
                            to={`/employees/${emp.id}/timeoff`}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] font-semibold text-stone-400 hover:text-asset-light border border-glass-border transition-all font-mono"
                            title="Time Off (P2 Scope)"
                          >
                            <Calendar className="h-3 w-3" />
                            Time Off
                          </Link>
                        </div>

                        {/* Action buttons (HR/Admin) */}
                        {isHRorAdmin && (
                          <div className="mt-3 pt-2 border-t border-glass-border flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(emp)}
                              className="p-1 rounded text-stone-400 hover:text-emerald-400 hover:bg-white/5 transition-colors"
                              title="Edit Employee"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(emp)}
                              className="p-1 rounded text-stone-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                              title="Set Inactive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ==================== TABLE VIEW ==================== */
        <div className="glass-panel overflow-hidden border border-glass-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/40 border-b border-glass-border text-[10px] uppercase font-bold tracking-wider text-stone-400 font-mono">
                <tr>
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Job Position</th>
                  <th className="px-6 py-3.5">Schedule</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Smart Links</th>
                  {isHRorAdmin && <th className="px-6 py-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {filteredEmployees.map((emp) => {
                  const cCount = contractCountMap[emp.id] || 0;
                  const sched = emp.workingScheduleId ? scheduleMap[emp.workingScheduleId] : null;

                  return (
                    <tr key={emp.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-semibold text-asset-light">{emp.name}</td>
                      <td className="px-6 py-4 text-stone-400">{emp.department || '—'}</td>
                      <td className="px-6 py-4 text-stone-300">{emp.jobPosition || '—'}</td>
                      <td className="px-6 py-4 text-stone-400 font-mono text-[11px]">
                        {sched ? `${sched.name} (${sched.totalWeeklyHours}h)` : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono tracking-wider border ${
                            emp.status === 'Active'
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                              : 'bg-stone-900/60 text-stone-400 border-stone-800'
                          }`}
                        >
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/contracts?employeeId=${emp.id}`}
                            className="px-2 py-0.5 rounded bg-white/5 hover:bg-emerald-950/30 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20 font-mono"
                          >
                            Contracts ({cCount})
                          </Link>
                          <Link
                            to={`/employees/${emp.id}/attendance`}
                            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] text-stone-400 border border-glass-border font-mono"
                          >
                            Attendance
                          </Link>
                          <Link
                            to={`/employees/${emp.id}/timeoff`}
                            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] text-stone-400 border border-glass-border font-mono"
                          >
                            Time Off
                          </Link>
                        </div>
                      </td>
                      {isHRorAdmin && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(emp)}
                              className="p-1 rounded text-stone-400 hover:text-emerald-400 hover:bg-white/5 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(emp)}
                              className="p-1 rounded text-stone-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                              title="Set Inactive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== CREATE / EDIT MODAL ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel p-6 border border-glass-border shadow-glass-glow rounded-xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-glass-border">
              <h3 className="text-base font-bold uppercase tracking-wider text-asset-light flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-400" />
                {editingEmployee ? 'Edit Employee' : 'New Employee'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 text-stone-400 hover:text-stone-200 rounded-md hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-950/30 border border-red-800/40 text-red-300 px-4 py-2.5 rounded-md text-xs font-mono">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Alice Johnson"
                  className="w-full h-9 bg-black/40 border border-glass-border rounded-md px-3 text-xs text-asset-light placeholder-stone-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Department & Job Position */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Engineering"
                    className="w-full h-9 bg-black/40 border border-glass-border rounded-md px-3 text-xs text-asset-light placeholder-stone-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono">
                    Job Position
                  </label>
                  <input
                    type="text"
                    value={formData.jobPosition}
                    onChange={(e) => setFormData({ ...formData, jobPosition: e.target.value })}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full h-9 bg-black/40 border border-glass-border rounded-md px-3 text-xs text-asset-light placeholder-stone-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Manager & Working Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono">
                    Manager (optional)
                  </label>
                  <select
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                    className="w-full h-9 bg-black/40 border border-glass-border rounded-md px-3 text-xs text-asset-light focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="">No Manager</option>
                    {employees
                      .filter((e) => !editingEmployee || e.id !== editingEmployee.id)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.department || 'General'})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono">
                    Working Schedule
                  </label>
                  <select
                    value={formData.workingScheduleId}
                    onChange={(e) =>
                      setFormData({ ...formData, workingScheduleId: e.target.value })
                    }
                    className="w-full h-9 bg-black/40 border border-glass-border rounded-md px-3 text-xs text-asset-light focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="">Select Schedule</option>
                    {schedules.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.totalWeeklyHours}h/wk)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full h-9 bg-black/40 border border-glass-border rounded-md px-3 text-xs text-asset-light focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-glass-border">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-md text-xs font-semibold text-stone-400 hover:text-stone-200 hover:bg-white/5 transition-colors font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="bg-[#1e3427]/90 hover:bg-[#254231] text-[#76c893] border border-[#2d523c] px-5 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-accent-glow"
                >
                  {formSubmitting ? 'Saving...' : editingEmployee ? 'Update' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
