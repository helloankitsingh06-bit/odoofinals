import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { formatDateIST, formatTimeIST, formatDateTimeIST } from '../utils/datetime';
import {
  Users,
  Search,
  Plus,
  LayoutGrid,
  List,
  Building2,
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  ChevronRight,
  X,
  UserCheck,
  Sparkles,
  Edit2,
  Trash2,
  ShieldCheck,
  KeyRound,
  Copy,
  CheckCircle2
} from 'lucide-react';

// System roles are login/permission levels — deliberately SEPARATE from Job Position,
// which is just a descriptive title (e.g. "Senior Engineer").
const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'Employee', label: 'Employee' },
  { value: 'HRManager', label: 'HR Manager' },
  { value: 'HRPayrollUser', label: 'HR Payroll User' },
  { value: 'HRPayrollManager', label: 'HR Payroll Manager' },
  { value: 'Admin', label: 'Admin' }
];

export const roleLabel = (role?: string | null): string =>
  ROLE_OPTIONS.find((r) => r.value === role)?.label || role || '—';

export const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);

  // Detail Modal / Hub
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [activeHubTab, setActiveHubTab] = useState<'overview' | 'contracts' | 'attendance' | 'leave' | 'payslips'>('overview');
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  // New Employee Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'Engineering',
    jobPosition: '',
    status: 'Active',
    managerId: '',
    workingScheduleId: '',
    role: 'Employee',
    isTopLevel: false
  });

  // Post-create confirmation modal (shows the generated temporary login)
  const [createdCredentials, setCreatedCredentials] = useState<
    { loginEmail: string; tempPassword: string | null; userCreated: boolean; role: string; note: string; employeeName: string } | null
  >(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Edit Employee Modal
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    department: 'Engineering',
    jobPosition: '',
    status: 'Active',
    managerId: '',
    workingScheduleId: '',
    role: 'Employee',
    isTopLevel: false
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const [empData, schData] = await Promise.all([
        apiRequest('/employees'),
        apiRequest('/schedules').catch(() => [])
      ]);
      setEmployees(empData);
      setSchedules(schData);
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openEmployeeHub = async (emp: any) => {
    setLoadingDetails(true);
    try {
      const fullData = await apiRequest(`/employees/${emp.id}`);
      setSelectedEmployee(fullData);
      setActiveHubTab('overview');
    } catch (err) {
      console.error('Failed to load employee details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const resetCreateForm = () =>
    setFormData({
      name: '', email: '', department: 'Engineering', jobPosition: '', status: 'Active',
      managerId: '', workingScheduleId: '', role: 'Employee', isTopLevel: false
    });

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();

    // ISSUE 1A: a reporting manager is required unless this is explicitly a top-level position
    if (!formData.isTopLevel && !formData.managerId) {
      alert('A reporting manager must be assigned before creating this employee.');
      return;
    }
    // ISSUE 1B: email is required so a login account can be provisioned
    if (!formData.email.trim()) {
      alert("An email address is required to create the employee's login account.");
      return;
    }
    // ISSUE 4: a system role must be chosen
    if (!formData.role) {
      alert('Please select a system role for this employee.');
      return;
    }

    setCreating(true);
    try {
      const res = await apiRequest('/employees', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          email: formData.email.trim(),
          managerId: formData.isTopLevel ? null : (formData.managerId || null),
          workingScheduleId: formData.workingScheduleId || null
        })
      });
      setShowCreateModal(false);
      const c = res.credentials || {};
      setCreatedCredentials({
        loginEmail: c.loginEmail || formData.email.trim(),
        tempPassword: c.tempPassword ?? null,
        userCreated: !!c.userCreated,
        role: c.role || formData.role,
        note: c.note || '',
        employeeName: formData.name.trim()
      });
      setCopied(false);
      resetCreateForm();
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || 'Failed to create employee');
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (emp: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingEmployeeId(emp.id);
    const mgrId = emp.managerId || emp.manager?.id || '';
    setEditFormData({
      name: emp.name || '',
      email: emp.email || '',
      department: emp.department || 'Engineering',
      jobPosition: emp.jobPosition || '',
      status: emp.status || 'Active',
      managerId: mgrId,
      workingScheduleId: emp.workingScheduleId || emp.workingSchedule?.id || '',
      role: emp.user?.role || 'Employee',
      isTopLevel: !mgrId
    });
    setShowEditModal(true);
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployeeId) return;
    if (!editFormData.isTopLevel && !editFormData.managerId) {
      alert('A reporting manager must be assigned before creating this employee.');
      return;
    }
    try {
      await apiRequest(`/employees/${editingEmployeeId}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...editFormData,
          managerId: editFormData.isTopLevel ? null : (editFormData.managerId || null),
          workingScheduleId: editFormData.workingScheduleId || null
        })
      });
      setShowEditModal(false);
      fetchEmployees();
      if (selectedEmployee && selectedEmployee.id === editingEmployeeId) {
        const fullData = await apiRequest(`/employees/${editingEmployeeId}`);
        setSelectedEmployee(fullData);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update employee');
    }
  };

  const handleDeleteEmployee = async (id: string, name: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete employee "${name}"? This will also un-link any linked user account.`)) return;
    try {
      await apiRequest(`/employees/${id}`, { method: 'DELETE' });
      if (selectedEmployee && selectedEmployee.id === id) {
        setSelectedEmployee(null);
      }
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || 'Failed to delete employee');
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesDept = departmentFilter === 'All' || emp.department === departmentFilter;
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      (emp.email && emp.email.toLowerCase().includes(search.toLowerCase())) ||
      emp.jobPosition.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 dark:bg-[#0b0914]/80 p-5 rounded-3xl border border-purple-100 dark:border-purple-900/40 backdrop-blur-xl shadow-lg dark:shadow-2xl transition-colors duration-300">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="text-amber-500 dark:text-amber-400" />
            Employee Management Hub
          </h1>
          <p className="text-sm text-slate-600 dark:text-purple-200/60 font-medium mt-0.5">
            Central repository for employee records, manager hierarchies, and linked payroll entities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-purple-600 text-white dark:bg-purple-900/60 dark:text-amber-300 shadow-sm'
                  : 'text-slate-500 dark:text-purple-300/60 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Kanban Grid"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-purple-600 text-white dark:bg-purple-900/60 dark:text-amber-300 shadow-sm'
                  : 'text-slate-500 dark:text-purple-300/60 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Table List"
            >
              <List size={16} />
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
          >
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-3 text-slate-400 dark:text-purple-400/60" />
          <input
            type="text"
            placeholder="Search by name, title, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-[#07050d] border border-slate-200 dark:border-purple-900/50 rounded-2xl pl-10 pr-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-purple-300/40 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 transition font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-600 dark:text-purple-300/70 whitespace-nowrap font-medium">Filter Dept:</span>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-white dark:bg-[#07050d] border border-slate-200 dark:border-purple-900/50 rounded-2xl px-3 py-2.5 text-xs text-amber-600 dark:text-amber-300 font-bold focus:outline-none cursor-pointer"
          >
            <option value="All" className="bg-white dark:bg-[#0b0914] text-slate-900 dark:text-purple-100">All Departments</option>
            <option value="Engineering" className="bg-white dark:bg-[#0b0914] text-slate-900 dark:text-purple-100">Engineering</option>
            <option value="Human Resources" className="bg-white dark:bg-[#0b0914] text-slate-900 dark:text-purple-100">Human Resources</option>
            <option value="Finance & Payroll" className="bg-white dark:bg-[#0b0914] text-slate-900 dark:text-purple-100">Finance & Payroll</option>
            <option value="Executive" className="bg-white dark:bg-[#0b0914] text-slate-900 dark:text-purple-100">Executive</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => {
            const activeContract = emp.contracts?.find((c: any) => c.status === 'Active');
            return (
              <div
                key={emp.id}
                onClick={() => openEmployeeHub(emp)}
                className="bg-white dark:bg-[#0b0914]/80 border border-purple-100 dark:border-purple-900/40 hover:border-amber-400/60 p-5 rounded-3xl cursor-pointer transition-all duration-300 group relative shadow-sm hover:shadow-md dark:shadow-xl hover:scale-[1.01]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-amber-400 flex items-center justify-center text-white dark:text-slate-950 font-black text-sm shadow-md shadow-purple-500/20">
                    {emp.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    emp.status === 'Active' ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30' : 'bg-purple-950/40 text-purple-400 border border-purple-900/40'
                  }`}>
                    {emp.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-amber-600 dark:group-hover:text-amber-300 transition">{emp.name}</h3>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-800/60" title="System role (login permissions)">
                    <ShieldCheck size={10} /> {roleLabel(emp.user?.role)}
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-purple-200/70 font-medium" title="Job position (descriptive title)">
                    <Briefcase size={10} className="inline mr-0.5 -mt-0.5" />{emp.jobPosition}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-purple-400/60 flex items-center gap-1 mt-1 font-medium">
                  <Building2 size={12} /> {emp.department}
                </div>

                <div className="mt-4 pt-3 border-t border-purple-100 dark:border-purple-900/40 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-purple-400/60 text-[10px] block font-medium">Contract Wage</span>
                    <span className="text-amber-600 dark:text-amber-300 font-bold font-mono">
                      {activeContract ? `₹${activeContract.wage.toLocaleString('en-IN')}/mo` : 'No Active Contract'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => openEditModal(emp, e)}
                      className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-amber-400/20 text-purple-700 dark:text-purple-300 hover:text-amber-600 dark:hover:text-amber-300 border border-purple-200 dark:border-purple-800/50 hover:border-amber-400/50 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                      title="Edit Employee"
                    >
                      <Edit2 size={12} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteEmployee(emp.id, emp.name, e)}
                      className="p-1 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition flex items-center justify-center cursor-pointer"
                      title="Delete Employee"
                    >
                      <Trash2 size={13} />
                    </button>
                    <div className="flex items-center text-purple-700 dark:text-purple-300 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition text-[11px] font-bold">
                      Open Hub <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0b0914]/80 border border-purple-100 dark:border-purple-900/40 rounded-3xl overflow-hidden shadow-md dark:shadow-2xl transition-colors duration-300">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-50/70 dark:bg-[#06050b] text-purple-900 dark:text-purple-300/70 font-bold uppercase tracking-wider text-[10px] border-b border-purple-100 dark:border-purple-900/50">
              <tr>
                <th className="px-5 py-4">Employee</th>
                <th className="px-5 py-4">Department</th>
                <th className="px-5 py-4">System Role</th>
                <th className="px-5 py-4">Job Position</th>
                <th className="px-5 py-4">Working Schedule</th>
                <th className="px-5 py-4">Active Contract</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100 dark:divide-purple-950 text-slate-800 dark:text-purple-100/90 font-medium">
              {filteredEmployees.map((emp) => {
                const activeContract = emp.contracts?.find((c: any) => c.status === 'Active');
                return (
                  <tr key={emp.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition">
                    <td className="px-5 py-4 font-medium flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-purple-600 to-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                        {emp.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{emp.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-purple-400/60">{emp.email || 'No email'}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-700 dark:text-purple-200">{emp.department}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-800/60">
                        <ShieldCheck size={10} /> {roleLabel(emp.user?.role)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-700 dark:text-purple-200">{emp.jobPosition}</td>
                    <td className="px-5 py-4 text-slate-500 dark:text-purple-300/70">
                      {emp.workingSchedule ? `${emp.workingSchedule.name} (${emp.workingSchedule.totalWeeklyHours}h)` : 'None'}
                    </td>
                    <td className="px-5 py-4 font-mono text-amber-300 font-bold">
                      {activeContract ? `₹${activeContract.wage.toLocaleString('en-IN')}` : <span className="text-purple-400/50 font-sans">N/A</span>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => openEditModal(emp, e)}
                          className="px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-amber-400/20 text-purple-700 dark:text-purple-300 hover:text-amber-600 dark:hover:text-amber-300 border border-purple-200 dark:border-purple-800/50 hover:border-amber-400/50 font-bold text-[11px] transition shadow-sm flex items-center gap-1 cursor-pointer"
                          title="Edit Employee"
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteEmployee(emp.id, emp.name, e)}
                          className="p-1.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition shadow-sm cursor-pointer"
                          title="Delete Employee"
                        >
                          <Trash2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEmployeeHub(emp)}
                          className="px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-amber-400/20 text-amber-300 border border-purple-900/50 hover:border-amber-400/50 font-bold text-[11px] transition shadow-sm cursor-pointer"
                        >
                          View Hub
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Employee Detail Modal / Smart Hub */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#090712] border border-purple-200 dark:border-purple-800/60 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl transition-colors duration-300">
            {/* Modal Header */}
            <div className="p-6 bg-slate-50/70 dark:bg-[#06050b] border-b border-purple-100 dark:border-purple-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-amber-400 flex items-center justify-center text-white dark:text-slate-950 font-black text-lg shadow-lg">
                  {selectedEmployee.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {selectedEmployee.name}
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      {selectedEmployee.status}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-purple-300/70 font-medium">{selectedEmployee.jobPosition} • {selectedEmployee.department}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(selectedEmployee)}
                  className="px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 hover:bg-amber-400/20 text-purple-800 dark:text-purple-300 hover:text-amber-600 dark:hover:text-amber-300 border border-purple-200 dark:border-purple-800/50 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Edit2 size={13} /> Edit Profile
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteEmployee(selectedEmployee.id, selectedEmployee.name)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Delete Employee"
                >
                  <Trash2 size={13} /> Delete
                </button>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="p-2 text-purple-400 hover:text-white rounded-xl hover:bg-purple-900/40 transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Smart Hub Navigation Buttons */}
            <div className="flex border-b border-purple-100 dark:border-purple-900/50 px-6 bg-slate-50 dark:bg-[#06050b] gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveHubTab('overview')}
                className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                  activeHubTab === 'overview'
                    ? 'border-amber-500 text-amber-700 dark:text-amber-300 dark:border-amber-400'
                    : 'border-transparent text-slate-500 dark:text-purple-400/70 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserCheck size={14} /> Overview
              </button>
              <button
                onClick={() => setActiveHubTab('contracts')}
                className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                  activeHubTab === 'contracts'
                    ? 'border-amber-500 text-amber-700 dark:text-amber-300 dark:border-amber-400'
                    : 'border-transparent text-slate-500 dark:text-purple-400/70 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Briefcase size={14} /> Contracts ({selectedEmployee.contracts?.length || 0})
              </button>
              <button
                onClick={() => setActiveHubTab('attendance')}
                className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                  activeHubTab === 'attendance'
                    ? 'border-amber-500 text-amber-700 dark:text-amber-300 dark:border-amber-400'
                    : 'border-transparent text-slate-500 dark:text-purple-400/70 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Clock size={14} /> Attendance ({selectedEmployee.attendances?.length || 0})
              </button>
              <button
                onClick={() => setActiveHubTab('leave')}
                className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                  activeHubTab === 'leave'
                    ? 'border-amber-500 text-amber-700 dark:text-amber-300 dark:border-amber-400'
                    : 'border-transparent text-slate-500 dark:text-purple-400/70 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Calendar size={14} /> Time Off & Balances
              </button>
              <button
                onClick={() => setActiveHubTab('payslips')}
                className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                  activeHubTab === 'payslips'
                    ? 'border-amber-500 text-amber-700 dark:text-amber-300 dark:border-amber-400'
                    : 'border-transparent text-slate-500 dark:text-purple-400/70 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <DollarSign size={14} /> Payslips ({selectedEmployee.payslips?.length || 0})
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6 flex-1 space-y-4">
              {activeHubTab === 'overview' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-[#0b0914] border border-purple-100 dark:border-purple-900/50 space-y-2">
                    <span className="text-amber-700 dark:text-amber-300 font-bold block text-[11px] uppercase tracking-wider">Organizational Details</span>
                    <div><strong className="text-slate-600 dark:text-purple-300/70">Department:</strong> <span className="text-slate-900 dark:text-white font-medium">{selectedEmployee.department}</span></div>
                    <div><strong className="text-slate-600 dark:text-purple-300/70">Job Position (title):</strong> <span className="text-slate-900 dark:text-white font-medium">{selectedEmployee.jobPosition}</span></div>
                    <div>
                      <strong className="text-slate-600 dark:text-purple-300/70">System Role (permissions):</strong>{' '}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-800/60">
                        <ShieldCheck size={10} /> {roleLabel(selectedEmployee.user?.role)}
                      </span>
                    </div>
                    <div><strong className="text-slate-600 dark:text-purple-300/70">Email Address:</strong> <span className="text-slate-900 dark:text-white font-medium">{selectedEmployee.email || 'N/A'}</span></div>
                    <div><strong className="text-slate-600 dark:text-purple-300/70">Reporting Manager:</strong> <span className="text-slate-900 dark:text-white font-medium">{selectedEmployee.manager?.name || 'Top Level / None'}</span></div>
                    <div><strong className="text-slate-600 dark:text-purple-300/70">Created:</strong> <span className="text-slate-900 dark:text-white font-medium">{formatDateTimeIST(selectedEmployee.createdAt)} IST</span></div>
                  </div>
                  <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-[#0b0914] border border-purple-100 dark:border-purple-900/50 space-y-2">
                    <span className="text-amber-700 dark:text-amber-300 font-bold block text-[11px] uppercase tracking-wider">Working Schedule</span>
                    <div><strong className="text-slate-600 dark:text-purple-300/70">Schedule Name:</strong> <span className="text-slate-900 dark:text-white font-medium">{selectedEmployee.workingSchedule?.name || 'Standard'}</span></div>
                    <div><strong className="text-slate-600 dark:text-purple-300/70">Weekly Hours:</strong> <span className="text-slate-900 dark:text-white font-medium">{selectedEmployee.workingSchedule?.totalWeeklyHours || 40} hrs/week</span></div>
                    <div><strong className="text-slate-600 dark:text-purple-300/70">Subordinates:</strong> <span className="text-slate-900 dark:text-white font-medium">{selectedEmployee.subordinates?.length || 0} direct reports</span></div>
                  </div>
                </div>
              )}

              {activeHubTab === 'contracts' && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Contract History</span>
                  {selectedEmployee.contracts?.map((c: any) => (
                    <div key={c.id} className="p-4 bg-purple-50/50 dark:bg-[#0b0914] border border-purple-100 dark:border-purple-900/50 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-black text-amber-300 font-mono text-sm">₹{c.wage.toLocaleString('en-IN')}/month</div>
                        <div className="text-purple-300/70 text-[11px] mt-0.5">
                          {formatDateIST(c.startDate)} to {c.endDate ? formatDateIST(c.endDate) : 'Ongoing'}
                        </div>
                        <div className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold mt-1">Structure: {c.salaryStructure?.name}</div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'Active' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30' : 'bg-slate-100 dark:bg-purple-950 text-slate-600 dark:text-purple-400'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeHubTab === 'attendance' && (
                <div className="space-y-4">
                  {/* Attendance KPI Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-purple-50/50 dark:bg-[#0b0914] border border-purple-100 dark:border-purple-900/50 rounded-2xl">
                      <div className="text-[10px] text-slate-500 dark:text-purple-300/70 uppercase font-bold tracking-wider">Total Logs</div>
                      <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                        {selectedEmployee.attendances?.length || 0}
                      </div>
                    </div>
                    <div className="p-3.5 bg-purple-50/50 dark:bg-[#0b0914] border border-purple-100 dark:border-purple-900/50 rounded-2xl">
                      <div className="text-[10px] text-slate-500 dark:text-purple-300/70 uppercase font-bold tracking-wider">Total Worked</div>
                      <div className="text-lg font-black text-amber-600 dark:text-amber-300 mt-0.5">
                        {selectedEmployee.attendances
                          ? selectedEmployee.attendances.reduce((sum: number, a: any) => sum + (a.workedHours || 0), 0).toFixed(1)
                          : 0} hrs
                      </div>
                    </div>
                    <div className="p-3.5 bg-purple-50/50 dark:bg-[#0b0914] border border-purple-100 dark:border-purple-900/50 rounded-2xl">
                      <div className="text-[10px] text-slate-500 dark:text-purple-300/70 uppercase font-bold tracking-wider">Present Days</div>
                      <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {selectedEmployee.attendances
                          ? selectedEmployee.attendances.filter((a: any) => a.status === 'Present').length
                          : 0}
                      </div>
                    </div>
                    <div className="p-3.5 bg-purple-50/50 dark:bg-[#0b0914] border border-purple-100 dark:border-purple-900/50 rounded-2xl">
                      <div className="text-[10px] text-slate-500 dark:text-purple-300/70 uppercase font-bold tracking-wider">Other / Warnings</div>
                      <div className="text-lg font-black text-purple-600 dark:text-purple-300 mt-0.5">
                        {selectedEmployee.attendances
                          ? selectedEmployee.attendances.filter((a: any) => a.status !== 'Present').length
                          : 0}
                      </div>
                    </div>
                  </div>

                  {/* Attendance Log Table */}
                  <div className="bg-purple-50/30 dark:bg-[#0b0914]/80 border border-purple-100 dark:border-purple-900/50 rounded-2xl overflow-hidden">
                    <div className="p-3 bg-purple-50/70 dark:bg-[#06050b] border-b border-purple-100 dark:border-purple-900/50 flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Attendance Log History</span>
                      <span className="text-[10px] text-slate-500 dark:text-purple-400/60 font-medium">
                        {selectedEmployee.attendances?.length || 0} Records
                      </span>
                    </div>

                    <div className="max-h-72 overflow-y-auto">
                      {selectedEmployee.attendances && selectedEmployee.attendances.length > 0 ? (
                        <table className="w-full text-left text-xs">
                          <thead className="bg-purple-50/50 dark:bg-[#06050b]/60 text-purple-900 dark:text-purple-300/70 font-bold uppercase tracking-wider text-[10px] border-b border-purple-100 dark:border-purple-900/50 sticky top-0 backdrop-blur-sm">
                            <tr>
                              <th className="px-4 py-3">Date</th>
                              <th className="px-4 py-3">Check In</th>
                              <th className="px-4 py-3">Check Out</th>
                              <th className="px-4 py-3">Hours</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3 text-right">Source</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-purple-100 dark:divide-purple-950 text-slate-800 dark:text-purple-100 font-medium text-xs">
                            {selectedEmployee.attendances.map((att: any) => (
                              <tr key={att.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition">
                                <td className="px-4 py-3 font-mono text-slate-700 dark:text-purple-300">
                                  {formatDateIST(att.checkIn)}
                                </td>
                                <td className="px-4 py-3 font-mono text-slate-600 dark:text-purple-200">
                                  {formatTimeIST(att.checkIn)}
                                </td>
                                <td className="px-4 py-3 font-mono text-slate-600 dark:text-purple-200">
                                  {att.checkOut ? (
                                    formatTimeIST(att.checkOut)
                                  ) : (
                                    <span className="text-amber-600 dark:text-amber-400 font-bold text-[10px]">Active</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 font-mono font-bold text-amber-600 dark:text-amber-300">
                                  {att.workedHours ? `${att.workedHours} hrs` : '-'}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                                <td className="px-4 py-3 text-right">
                                  {att.isManualEdit ? (
                                    <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-400/30 px-1.5 py-0.5 rounded font-semibold">
                                      Manual
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 dark:text-purple-400/50">Biometric/Web</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-8 text-center text-slate-400 dark:text-purple-400/60 text-xs">
                          No attendance logs recorded for this employee yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeHubTab === 'leave' && (
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300 block mb-2">Live Allocation Balances</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {selectedEmployee.allocations?.map((a: any) => (
                        <div key={a.id} className="p-4 bg-purple-50/50 dark:bg-[#0b0914] border border-purple-100 dark:border-purple-900/50 rounded-2xl">
                          <div className="text-[11px] text-slate-600 dark:text-purple-300/70 font-semibold">{a.timeOffType.name}</div>
                          <div className="text-xl font-black text-amber-600 dark:text-amber-300 mt-1">
                            {a.remainingAmount} <span className="text-xs text-slate-500 dark:text-purple-300/60 font-normal">{a.timeOffType.unit} left</span>
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-purple-400/60 mt-1 font-medium">
                            Allocated: {a.allocatedAmount} | Taken: {a.takenAmount}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeHubTab === 'payslips' && (
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300 block">Generated Payslips</span>
                  {selectedEmployee.payslips?.map((p: any) => (
                    <div key={p.id} className="p-4 bg-purple-50/50 dark:bg-[#0b0914] border border-purple-100 dark:border-purple-900/50 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">{p.payrun?.name || 'Regular Payrun'}</span>
                        <div className="text-purple-300/70 text-[11px] mt-0.5">
                          Gross: ₹{p.grossTotal.toLocaleString('en-IN')} • Net Take-Home: <strong className="text-amber-300">₹{p.netTotal.toLocaleString('en-IN')}</strong>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-500/30">
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Employee Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-[#090712] border border-purple-200 dark:border-purple-800/60 rounded-3xl w-full max-w-md p-6 shadow-2xl transition-colors duration-300">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500 dark:text-amber-400" />
              Create New Employee
            </h2>
            <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                  placeholder="e.g. Maya Lin"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Email Address <span className="text-rose-500">*</span></label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                  placeholder="e.g. maya.lin@peoplepay360.com"
                />
                <p className="text-[10px] text-slate-500 dark:text-purple-400/60 mt-1">A login account is created automatically for this email with a temporary password.</p>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">
                  System Role <span className="text-rose-500">*</span>
                  <span className="ml-1 font-normal text-[10px] text-slate-500 dark:text-purple-400/60">(login permissions — not the job title)</span>
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value} className="bg-white dark:bg-[#0b0914] text-slate-900 dark:text-white">{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Engineering" className="bg-white dark:bg-[#0b0914] text-slate-900 dark:text-white">Engineering</option>
                    <option value="Human Resources" className="bg-white dark:bg-[#0b0914] text-slate-900 dark:text-white">Human Resources</option>
                    <option value="Finance & Payroll" className="bg-white dark:bg-[#0b0914] text-slate-900 dark:text-white">Finance & Payroll</option>
                    <option value="Executive" className="bg-white dark:bg-[#0b0914] text-slate-900 dark:text-white">Executive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Job Position</label>
                  <input
                    type="text"
                    required
                    value={formData.jobPosition}
                    onChange={(e) => setFormData({ ...formData, jobPosition: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                    placeholder="e.g. Systems Engineer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-purple-300/80 mb-1 font-semibold text-slate-700 dark:text-purple-300/80">
                  Reporting Manager {!formData.isTopLevel && <span className="text-rose-500">*</span>}
                </label>
                <select
                  value={formData.managerId}
                  disabled={formData.isTopLevel}
                  required={!formData.isTopLevel}
                  onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 disabled:opacity-40"
                >
                  <option value="">{formData.isTopLevel ? 'No manager (top-level)' : 'Select a reporting manager…'}</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.department})</option>
                  ))}
                </select>
                <label className="mt-2 flex items-center gap-2 text-[11px] text-slate-600 dark:text-purple-300/70 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isTopLevel}
                    onChange={(e) => setFormData({ ...formData, isTopLevel: e.target.checked, managerId: e.target.checked ? '' : formData.managerId })}
                    className="rounded border-slate-300 dark:border-purple-800"
                  />
                  This is a top-level position (no manager)
                </label>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Working Schedule</label>
                <select
                  value={formData.workingScheduleId}
                  onChange={(e) => setFormData({ ...formData, workingScheduleId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400"
                >
                  <option value="">Standard (Default)</option>
                  {schedules.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-purple-100 dark:border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-purple-950/60 border border-slate-200 dark:border-purple-900/50 text-slate-600 dark:text-purple-300 rounded-xl hover:bg-slate-200 dark:hover:bg-purple-900/40 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl font-black shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-60"
                >
                  {creating ? 'Creating…' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post-create confirmation — shows the generated temporary login (ISSUE 1B) */}
      {createdCredentials && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-[#090712] border border-emerald-300 dark:border-emerald-800/60 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={20} className="text-emerald-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Employee created</h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-purple-300/70 mb-4">
              <strong>{createdCredentials.employeeName}</strong> was created with system role{' '}
              <span className="font-bold text-purple-700 dark:text-purple-300">{roleLabel(createdCredentials.role)}</span>.
            </p>

            {createdCredentials.tempPassword ? (
              <div className="rounded-2xl bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 p-4 text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-300 font-bold uppercase tracking-wide text-[10px]">
                  <KeyRound size={12} /> Temporary login — share securely
                </div>
                <div className="font-mono text-slate-900 dark:text-white break-all">
                  <div><span className="text-slate-500 dark:text-purple-400/60">Email:&nbsp;</span>{createdCredentials.loginEmail}</div>
                  <div><span className="text-slate-500 dark:text-purple-400/60">Password:&nbsp;</span>{createdCredentials.tempPassword}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(`${createdCredentials.loginEmail} / ${createdCredentials.tempPassword}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 font-bold text-[11px] cursor-pointer"
                >
                  <Copy size={12} /> {copied ? 'Copied!' : 'Copy'}
                </button>
                <p className="text-[10px] text-slate-500 dark:text-purple-400/60">
                  They will be forced to set a new password on first login.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-4 text-xs text-amber-800 dark:text-amber-200">
                {createdCredentials.note}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 rounded-xl font-black cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#090712] border border-purple-800/60 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Edit2 size={18} className="text-amber-400" />
              Edit Employee Details
            </h2>
            <form onSubmit={handleUpdateEmployee} className="space-y-4 text-xs">
              <div>
                <label className="block text-purple-300/80 mb-1 font-semibold">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-purple-300/80 mb-1 font-semibold">Email Address</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-purple-300/80 mb-1 font-semibold">
                  System Role <span className="text-rose-500">*</span>
                  <span className="ml-1 font-normal text-[10px] text-purple-400/60">(login permissions — not the job title)</span>
                </label>
                <select
                  required
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-purple-300/80 mb-1 font-semibold">Department</label>
                  <select
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance & Payroll">Finance & Payroll</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-purple-300/80 mb-1 font-semibold">Job Position</label>
                  <input
                    type="text"
                    required
                    value={editFormData.jobPosition}
                    onChange={(e) => setEditFormData({ ...editFormData, jobPosition: e.target.value })}
                    className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-purple-300/80 mb-1 font-semibold">
                    Reporting Manager {!editFormData.isTopLevel && <span className="text-rose-500">*</span>}
                  </label>
                  <select
                    value={editFormData.managerId}
                    disabled={editFormData.isTopLevel}
                    required={!editFormData.isTopLevel}
                    onChange={(e) => setEditFormData({ ...editFormData, managerId: e.target.value })}
                    className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 disabled:opacity-40"
                  >
                    <option value="">{editFormData.isTopLevel ? 'No manager (top-level)' : 'Select a reporting manager…'}</option>
                    {employees.filter(e => e.id !== editingEmployeeId).map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.department})</option>
                    ))}
                  </select>
                  <label className="mt-2 flex items-center gap-2 text-[11px] text-purple-300/70 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.isTopLevel}
                      onChange={(e) => setEditFormData({ ...editFormData, isTopLevel: e.target.checked, managerId: e.target.checked ? '' : editFormData.managerId })}
                      className="rounded border-purple-800"
                    />
                    Top-level position (no manager)
                  </label>
                </div>
                <div>
                  <label className="block text-purple-300/80 mb-1 font-semibold">Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-purple-300/80 mb-1 font-semibold">Working Schedule</label>
                <select
                  value={editFormData.workingScheduleId}
                  onChange={(e) => setEditFormData({ ...editFormData, workingScheduleId: e.target.value })}
                  className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">Standard (Default)</option>
                  {schedules.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-purple-950/60 border border-purple-900/50 text-purple-300 rounded-xl hover:bg-purple-900/40 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl font-black shadow-lg shadow-amber-500/20"
                >
                  Update Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
