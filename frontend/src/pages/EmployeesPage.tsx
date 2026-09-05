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
  FileText,
  ChevronRight,
  X,
  UserCheck
} from 'lucide-react';

export const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
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
    status: 'Active'
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/employees');
      setEmployees(data);
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
        body: JSON.stringify(formData)
      });
      setShowCreateModal(false);
      setFormData({ name: '', email: '', department: 'Engineering', jobPosition: '', status: 'Active' });
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || 'Failed to create employee');
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/40 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="text-emerald-400" />
            Employee Management Hub
          </h1>
          <p className="text-sm text-slate-400">
            Central repository for employee records, manager hierarchies, and linked payroll entities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-slate-700 text-emerald-400' : 'text-slate-400'}`}
              title="Kanban Grid"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-slate-700 text-emerald-400' : 'text-slate-400'}`}
              title="Table List"
            >
              <List size={16} />
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/20 transition"
          >
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, title, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 whitespace-nowrap">Filter Dept:</span>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-medium focus:outline-none"
          >
            <option value="All">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Finance & Payroll">Finance & Payroll</option>
            <option value="Executive">Executive</option>
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
                className="bg-slate-800/50 border border-slate-800 hover:border-emerald-500/40 p-5 rounded-2xl cursor-pointer transition group relative"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {emp.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    emp.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {emp.status}
                  </span>
                </div>

                <h3 className="font-bold text-white text-base group-hover:text-emerald-400 transition">{emp.name}</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{emp.jobPosition}</p>
                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                  <Building2 size={12} /> {emp.department}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Contract Wage</span>
                    <span className="text-emerald-400 font-semibold font-mono">
                      {activeContract ? `$${activeContract.wage.toLocaleString()}/mo` : 'No Active Contract'}
                    </span>
                  </div>
                  <div className="flex items-center text-slate-400 group-hover:text-emerald-400 transition text-[11px] font-medium">
                    Open Hub <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Job Position</th>
                <th className="px-5 py-3.5">Working Schedule</th>
                <th className="px-5 py-3.5">Active Contract</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredEmployees.map((emp) => {
                const activeContract = emp.contracts?.find((c: any) => c.status === 'Active');
                return (
                  <tr key={emp.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5 font-medium text-white flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                        {emp.name[0]}
                      </div>
                      <div>
                        <div className="font-semibold">{emp.name}</div>
                        <div className="text-[11px] text-slate-500">{emp.email || 'No email'}</div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">{emp.department}</td>
                    <td className="px-5 py-3.5">{emp.jobPosition}</td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {emp.workingSchedule ? `${emp.workingSchedule.name} (${emp.workingSchedule.totalWeeklyHours}h)` : 'None'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-emerald-400">
                      {activeContract ? `$${activeContract.wage.toLocaleString()}` : <span className="text-slate-500 font-sans">N/A</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => openEmployeeHub(emp)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-600/20 text-emerald-400 font-semibold text-[11px] transition"
                      >
                        View Hub
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-over / Modal for Central Employee Hub */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Hub Header */}
            <div className="p-6 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold text-lg">
                  {selectedEmployee.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {selectedEmployee.name}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {selectedEmployee.status}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">{selectedEmployee.jobPosition} • {selectedEmployee.department}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Smart Hub Navigation Buttons */}
            <div className="flex border-b border-slate-800 px-6 bg-slate-950 gap-2">
              <button
                onClick={() => setActiveHubTab('overview')}
                className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${
                  activeHubTab === 'overview'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserCheck size={14} /> Overview
              </button>
              <button
                onClick={() => setActiveHubTab('contracts')}
                className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${
                  activeHubTab === 'contracts'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Briefcase size={14} /> Contracts ({selectedEmployee.contracts?.length || 0})
              </button>
              <button
                onClick={() => setActiveHubTab('attendance')}
                className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${
                  activeHubTab === 'attendance'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock size={14} /> Attendance ({selectedEmployee.attendances?.length || 0})
              </button>
              <button
                onClick={() => setActiveHubTab('leave')}
                className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${
                  activeHubTab === 'leave'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calendar size={14} /> Time Off & Balances
              </button>
              <button
                onClick={() => setActiveHubTab('payslips')}
                className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${
                  activeHubTab === 'payslips'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <DollarSign size={14} /> Payslips ({selectedEmployee.payslips?.length || 0})
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6 flex-1 space-y-4">
              {activeHubTab === 'overview' && (
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                    <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">Organizational Details</span>
                    <div><strong className="text-slate-400">Department:</strong> {selectedEmployee.department}</div>
                    <div><strong className="text-slate-400">Role Title:</strong> {selectedEmployee.jobPosition}</div>
                    <div><strong className="text-slate-400">Email Address:</strong> {selectedEmployee.email || 'N/A'}</div>
                    <div><strong className="text-slate-400">Reporting Manager:</strong> {selectedEmployee.manager?.name || 'Top Level / None'}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                    <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">Working Schedule</span>
                    <div><strong className="text-slate-400">Schedule Name:</strong> {selectedEmployee.workingSchedule?.name || 'Standard'}</div>
                    <div><strong className="text-slate-400">Weekly Hours:</strong> {selectedEmployee.workingSchedule?.totalWeeklyHours || 40} hrs/week</div>
                    <div><strong className="text-slate-400">Subordinates:</strong> {selectedEmployee.subordinates?.length || 0} direct reports</div>
                  </div>
                </div>
              )}

              {activeHubTab === 'contracts' && (
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-slate-300">Contract History</span>
                  {selectedEmployee.contracts?.map((c: any) => (
                    <div key={c.id} className="p-3.5 bg-slate-800/50 border border-slate-700 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white">${c.wage.toLocaleString()}/month</div>
                        <div className="text-slate-400 text-[11px]">
                          {new Date(c.startDate).toISOString().slice(0, 10)} to {c.endDate ? new Date(c.endDate).toISOString().slice(0, 10) : 'Ongoing'}
                        </div>
                        <div className="text-[10px] text-emerald-400 font-medium mt-0.5">Structure: {c.salaryStructure?.name}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'
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
                    <span className="text-xs font-semibold text-slate-300 block mb-2">Live Allocation Balances</span>
                    <div className="grid grid-cols-3 gap-3">
                      {selectedEmployee.allocations?.map((a: any) => (
                        <div key={a.id} className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl">
                          <div className="text-[11px] text-slate-400">{a.timeOffType.name}</div>
                          <div className="text-lg font-bold text-emerald-400 mt-1">
                            {a.remainingAmount} <span className="text-xs text-slate-400 font-normal">{a.timeOffType.unit} left</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1">
                            Allocated: {a.allocatedAmount} | Taken: {a.takenAmount}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeHubTab === 'payslips' && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300 block">Generated Payslips</span>
                  {selectedEmployee.payslips?.map((p: any) => (
                    <div key={p.id} className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">{p.payrun?.name || 'Regular Payrun'}</span>
                        <div className="text-slate-400 text-[11px]">
                          Gross: ${p.grossTotal.toLocaleString()} • Net Take-Home: <strong className="text-emerald-400">${p.netTotal.toLocaleString()}</strong>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Create New Employee</h2>
            <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Maya Lin"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. maya.lin@peoplepay360.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance & Payroll">Finance & Payroll</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Job Position</label>
                  <input
                    type="text"
                    required
                    value={formData.jobPosition}
                    onChange={(e) => setFormData({ ...formData, jobPosition: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Systems Engineer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow-md"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
