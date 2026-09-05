import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
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
  Trash2
} from 'lucide-react';

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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'Engineering',
    jobPosition: '',
    status: 'Active',
    managerId: '',
    workingScheduleId: ''
  });

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
    workingScheduleId: ''
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

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/employees', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          managerId: formData.managerId || null,
          workingScheduleId: formData.workingScheduleId || null
        })
      });
      setShowCreateModal(false);
      setFormData({ name: '', email: '', department: 'Engineering', jobPosition: '', status: 'Active', managerId: '', workingScheduleId: '' });
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || 'Failed to create employee');
    }
  };

  const openEditModal = (emp: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingEmployeeId(emp.id);
    setEditFormData({
      name: emp.name || '',
      email: emp.email || '',
      department: emp.department || 'Engineering',
      jobPosition: emp.jobPosition || '',
      status: emp.status || 'Active',
      managerId: emp.managerId || emp.manager?.id || '',
      workingScheduleId: emp.workingScheduleId || emp.workingSchedule?.id || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployeeId) return;
    try {
      await apiRequest(`/employees/${editingEmployeeId}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...editFormData,
          managerId: editFormData.managerId || null,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0b0914]/80 p-5 rounded-3xl border border-purple-900/40 backdrop-blur-xl shadow-2xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="text-amber-400" />
            Employee Management Hub
          </h1>
          <p className="text-sm text-purple-200/60">
            Central repository for employee records, manager hierarchies, and linked payroll entities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-[#06050b] border border-purple-900/50 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-purple-900/60 text-amber-300 shadow' : 'text-purple-300/60 hover:text-white'}`}
              title="Kanban Grid"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-purple-900/60 text-amber-300 shadow' : 'text-purple-300/60 hover:text-white'}`}
              title="Table List"
            >
              <List size={16} />
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 transition active:scale-95"
          >
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-3 text-purple-400/60" />
          <input
            type="text"
            placeholder="Search by name, title, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#07050d] border border-purple-900/50 rounded-2xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-purple-300/40 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-purple-300/70 whitespace-nowrap">Filter Dept:</span>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-[#07050d] border border-purple-900/50 rounded-2xl px-3 py-2.5 text-xs text-amber-300 font-semibold focus:outline-none"
          >
            <option value="All" className="bg-[#0b0914] text-purple-100">All Departments</option>
            <option value="Engineering" className="bg-[#0b0914] text-purple-100">Engineering</option>
            <option value="Human Resources" className="bg-[#0b0914] text-purple-100">Human Resources</option>
            <option value="Finance & Payroll" className="bg-[#0b0914] text-purple-100">Finance & Payroll</option>
            <option value="Executive" className="bg-[#0b0914] text-purple-100">Executive</option>
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
                className="bg-[#0b0914]/80 border border-purple-900/40 hover:border-amber-400/60 p-5 rounded-3xl cursor-pointer transition-all duration-300 group relative hover:shadow-xl hover:shadow-amber-500/5 hover:scale-[1.01]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-purple-700 via-fuchsia-600 to-amber-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-purple-500/20">
                    {emp.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => openEditModal(emp, e)}
                      className="p-1.5 text-purple-400 hover:text-amber-300 bg-purple-950/40 hover:bg-purple-900/60 rounded-lg transition"
                      title="Edit Employee"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteEmployee(emp.id, emp.name, e)}
                      className="p-1.5 text-purple-400 hover:text-rose-400 bg-purple-950/40 hover:bg-rose-950/60 rounded-lg transition"
                      title="Delete Employee"
                    >
                      <Trash2 size={13} />
                    </button>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      emp.status === 'Active' ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30' : 'bg-purple-950/40 text-purple-400 border border-purple-900/40'
                    }`}>
                      {emp.status}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-white text-base group-hover:text-amber-300 transition">{emp.name}</h3>
                <p className="text-xs text-purple-200/70 font-medium mt-0.5">{emp.jobPosition}</p>
                <div className="text-[11px] text-purple-400/60 flex items-center gap-1 mt-1">
                  <Building2 size={12} /> {emp.department}
                </div>

                <div className="mt-4 pt-3 border-t border-purple-900/40 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-purple-400/60 text-[10px] block font-medium">Contract Wage</span>
                    <span className="text-amber-300 font-bold font-mono">
                      {activeContract ? `₹${activeContract.wage.toLocaleString('en-IN')}/mo` : 'No Active Contract'}
                    </span>
                  </div>
                  <div className="flex items-center text-purple-300 group-hover:text-amber-300 transition text-[11px] font-semibold">
                    Open Hub <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#0b0914]/80 border border-purple-900/40 rounded-3xl overflow-hidden shadow-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#06050b] text-purple-300/70 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-4">Employee</th>
                <th className="px-5 py-4">Department</th>
                <th className="px-5 py-4">Job Position</th>
                <th className="px-5 py-4">Working Schedule</th>
                <th className="px-5 py-4">Active Contract</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-950 text-purple-100/90">
              {filteredEmployees.map((emp) => {
                const activeContract = emp.contracts?.find((c: any) => c.status === 'Active');
                return (
                  <tr key={emp.id} className="hover:bg-purple-950/20 transition">
                    <td className="px-5 py-4 font-medium text-white flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-purple-700 to-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs shadow-sm">
                        {emp.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-white">{emp.name}</div>
                        <div className="text-[11px] text-purple-400/60">{emp.email || 'No email'}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-purple-200">{emp.department}</td>
                    <td className="px-5 py-4 text-purple-200">{emp.jobPosition}</td>
                    <td className="px-5 py-4 text-purple-300/70">
                      {emp.workingSchedule ? `${emp.workingSchedule.name} (${emp.workingSchedule.totalWeeklyHours}h)` : 'None'}
                    </td>
                    <td className="px-5 py-4 font-mono text-amber-300 font-bold">
                      {activeContract ? `₹${activeContract.wage.toLocaleString('en-IN')}` : <span className="text-purple-400/50 font-sans">N/A</span>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => openEditModal(emp, e)}
                          className="px-2.5 py-1.5 rounded-xl bg-purple-950/60 hover:bg-amber-400/20 text-purple-300 hover:text-amber-300 border border-purple-900/50 font-bold text-[11px] transition"
                          title="Edit"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteEmployee(emp.id, emp.name, e)}
                          className="px-2.5 py-1.5 rounded-xl bg-purple-950/60 hover:bg-rose-500/20 text-purple-300 hover:text-rose-400 border border-purple-900/50 font-bold text-[11px] transition"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                        <button
                          onClick={() => openEmployeeHub(emp)}
                          className="px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-amber-400/20 text-amber-300 border border-purple-900/50 hover:border-amber-400/50 font-bold text-[11px] transition shadow-sm"
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

      {/* Central Employee Hub Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-[#090712] border border-purple-800/60 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Hub Header */}
            <div className="p-6 bg-[#0e0c1a] border-b border-purple-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-purple-400 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg">
                  {selectedEmployee.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {selectedEmployee.name}
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                      {selectedEmployee.status}
                    </span>
                  </h2>
                  <p className="text-xs text-purple-300/70">{selectedEmployee.jobPosition} • {selectedEmployee.department}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(selectedEmployee)}
                  className="p-2 text-purple-400 hover:text-amber-300 rounded-xl hover:bg-purple-900/40 transition flex items-center gap-1 text-xs font-semibold"
                >
                  <Edit2 size={15} /> Edit
                </button>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="p-2 text-purple-400 hover:text-white rounded-xl hover:bg-purple-900/40 transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Smart Hub Navigation Buttons */}
            <div className="flex border-b border-purple-900/50 px-6 bg-[#06050b] gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveHubTab('overview')}
                className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                  activeHubTab === 'overview'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-purple-400/70 hover:text-white'
                }`}
              >
                <UserCheck size={14} /> Overview
              </button>
              <button
                onClick={() => setActiveHubTab('contracts')}
                className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                  activeHubTab === 'contracts'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-purple-400/70 hover:text-white'
                }`}
              >
                <Briefcase size={14} /> Contracts ({selectedEmployee.contracts?.length || 0})
              </button>
              <button
                onClick={() => setActiveHubTab('attendance')}
                className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                  activeHubTab === 'attendance'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-purple-400/70 hover:text-white'
                }`}
              >
                <Clock size={14} /> Attendance ({selectedEmployee.attendances?.length || 0})
              </button>
              <button
                onClick={() => setActiveHubTab('leave')}
                className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                  activeHubTab === 'leave'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-purple-400/70 hover:text-white'
                }`}
              >
                <Calendar size={14} /> Time Off & Balances
              </button>
              <button
                onClick={() => setActiveHubTab('payslips')}
                className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                  activeHubTab === 'payslips'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-purple-400/70 hover:text-white'
                }`}
              >
                <DollarSign size={14} /> Payslips ({selectedEmployee.payslips?.length || 0})
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6 flex-1 space-y-4">
              {activeHubTab === 'overview' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-[#0b0914] border border-purple-900/50 space-y-2">
                    <span className="text-amber-300 font-bold block text-[11px] uppercase tracking-wider">Organizational Details</span>
                    <div><strong className="text-purple-300/70">Department:</strong> {selectedEmployee.department}</div>
                    <div><strong className="text-purple-300/70">Role Title:</strong> {selectedEmployee.jobPosition}</div>
                    <div><strong className="text-purple-300/70">Email Address:</strong> {selectedEmployee.email || 'N/A'}</div>
                    <div><strong className="text-purple-300/70">Reporting Manager:</strong> {selectedEmployee.manager?.name || 'Top Level / None'}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#0b0914] border border-purple-900/50 space-y-2">
                    <span className="text-amber-300 font-bold block text-[11px] uppercase tracking-wider">Working Schedule</span>
                    <div><strong className="text-purple-300/70">Schedule Name:</strong> {selectedEmployee.workingSchedule?.name || 'Standard'}</div>
                    <div><strong className="text-purple-300/70">Weekly Hours:</strong> {selectedEmployee.workingSchedule?.totalWeeklyHours || 40} hrs/week</div>
                    <div><strong className="text-purple-300/70">Subordinates:</strong> {selectedEmployee.subordinates?.length || 0} direct reports</div>
                  </div>
                </div>
              )}

              {activeHubTab === 'contracts' && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-amber-300">Contract History</span>
                  {selectedEmployee.contracts?.map((c: any) => (
                    <div key={c.id} className="p-4 bg-[#0b0914] border border-purple-900/50 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-black text-amber-300 font-mono text-sm">₹{c.wage.toLocaleString('en-IN')}/month</div>
                        <div className="text-purple-300/70 text-[11px] mt-0.5">
                          {new Date(c.startDate).toISOString().slice(0, 10)} to {c.endDate ? new Date(c.endDate).toISOString().slice(0, 10) : 'Ongoing'}
                        </div>
                        <div className="text-[10px] text-purple-300 font-medium mt-1">Structure: {c.salaryStructure?.name}</div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'Active' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-purple-950 text-purple-400'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeHubTab === 'leave' && (
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-bold text-amber-300 block mb-2">Live Allocation Balances</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {selectedEmployee.allocations?.map((a: any) => (
                        <div key={a.id} className="p-4 bg-[#0b0914] border border-purple-900/50 rounded-2xl">
                          <div className="text-[11px] text-purple-300/70 font-semibold">{a.timeOffType.name}</div>
                          <div className="text-xl font-black text-amber-300 mt-1">
                            {a.remainingAmount} <span className="text-xs text-purple-300/60 font-normal">{a.timeOffType.unit} left</span>
                          </div>
                          <div className="text-[10px] text-purple-400/60 mt-1">
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
                  <span className="text-xs font-bold text-amber-300 block">Generated Payslips</span>
                  {selectedEmployee.payslips?.map((p: any) => (
                    <div key={p.id} className="p-4 bg-[#0b0914] border border-purple-900/50 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">{p.payrun?.name || 'Regular Payrun'}</span>
                        <div className="text-purple-300/70 text-[11px] mt-0.5">
                          Gross: ₹{p.grossTotal.toLocaleString('en-IN')} • Net Take-Home: <strong className="text-amber-300">₹{p.netTotal.toLocaleString('en-IN')}</strong>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-200 border border-purple-500/30">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#090712] border border-purple-800/60 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400" />
              Create New Employee
            </h2>
            <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
              <div>
                <label className="block text-purple-300/80 mb-1 font-semibold">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  placeholder="e.g. Maya Lin"
                />
              </div>

              <div>
                <label className="block text-purple-300/80 mb-1 font-semibold">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  placeholder="e.g. maya.lin@peoplepay360.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-purple-300/80 mb-1 font-semibold">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
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
                    value={formData.jobPosition}
                    onChange={(e) => setFormData({ ...formData, jobPosition: e.target.value })}
                    className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                    placeholder="e.g. Systems Engineer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-purple-300/80 mb-1 font-semibold">Reporting Manager</label>
                  <select
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                    className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="">None (Top Level)</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.department})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-purple-300/80 mb-1 font-semibold">Working Schedule</label>
                  <select
                    value={formData.workingScheduleId}
                    onChange={(e) => setFormData({ ...formData, workingScheduleId: e.target.value })}
                    className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="">Standard (Default)</option>
                    {schedules.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-purple-950/60 border border-purple-900/50 text-purple-300 rounded-xl hover:bg-purple-900/40 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl font-black shadow-lg shadow-amber-500/20"
                >
                  Save Employee
                </button>
              </div>
            </form>
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
                  <label className="block text-purple-300/80 mb-1 font-semibold">Reporting Manager</label>
                  <select
                    value={editFormData.managerId}
                    onChange={(e) => setEditFormData({ ...editFormData, managerId: e.target.value })}
                    className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="">None (Top Level)</option>
                    {employees.filter(e => e.id !== editingEmployeeId).map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.department})</option>
                    ))}
                  </select>
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
