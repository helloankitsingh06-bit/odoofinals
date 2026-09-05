import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { Briefcase, Plus, AlertCircle, Sparkles, Edit2, Trash2 } from 'lucide-react';

export const ContractsPage: React.FC = () => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Edit Contract State
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    employeeId: '',
    startDate: '',
    endDate: '',
    wage: 65000,
    salaryStructureId: '',
    department: 'Engineering',
    jobPosition: '',
    status: 'Active'
  });

  const [formData, setFormData] = useState({
    employeeId: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    wage: 65000,
    salaryStructureId: '',
    department: 'Engineering',
    jobPosition: '',
    status: 'Active'
  });

  const fetchData = async () => {
    try {
      const [cData, eData, sData] = await Promise.all([
        apiRequest('/contracts'),
        apiRequest('/employees'),
        apiRequest('/salary-structures/structures')
      ]);
      setContracts(cData);
      setEmployees(eData);
      setStructures(sData);

      if (eData.length > 0 && !formData.employeeId) {
        setFormData(prev => ({
          ...prev,
          employeeId: eData[0].id,
          department: eData[0].department,
          jobPosition: eData[0].jobPosition,
          salaryStructureId: sData[0]?.id || ''
        }));
      }
    } catch (err) {
      console.error('Failed to load contract data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEmployeeChange = (empId: string) => {
    const selected = employees.find(e => e.id === empId);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        employeeId: empId,
        department: selected.department,
        jobPosition: selected.jobPosition
      }));
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/contracts', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to create contract');
    }
  };

  const openEditModal = (c: any) => {
    setEditingContractId(c.id);
    setEditError(null);
    setEditFormData({
      employeeId: c.employeeId,
      startDate: c.startDate ? new Date(c.startDate).toISOString().slice(0, 10) : '',
      endDate: c.endDate ? new Date(c.endDate).toISOString().slice(0, 10) : '',
      wage: c.wage,
      salaryStructureId: c.salaryStructureId,
      department: c.department,
      jobPosition: c.jobPosition,
      status: c.status
    });
    setShowEditModal(true);
  };

  const handleUpdateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContractId) return;
    setEditError(null);
    try {
      await apiRequest(`/contracts/${editingContractId}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...editFormData,
          endDate: editFormData.endDate ? editFormData.endDate : null
        })
      });
      setShowEditModal(false);
      fetchData();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update contract');
    }
  };

  const handleDeleteContract = async (id: string, empName: string) => {
    if (!window.confirm(`Are you sure you want to delete this contract for "${empName}"?`)) return;
    try {
      await apiRequest(`/contracts/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete contract');
    }
  };

  const filteredContracts = contracts.filter(c => statusFilter === 'All' || c.status === statusFilter);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 dark:bg-[#0b0914]/80 p-5 rounded-3xl border border-purple-100 dark:border-purple-900/40 backdrop-blur-xl shadow-lg dark:shadow-2xl transition-colors duration-300">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Briefcase className="text-amber-500 dark:text-amber-400" />
            Employment Contracts
          </h1>
          <p className="text-sm text-slate-600 dark:text-purple-200/60 font-medium mt-0.5">
            Period-applicable compensation agreements with strict overlap prevention.
          </p>
        </div>

        <button
          onClick={() => { setError(null); setShowModal(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
        >
          <Plus size={16} /> New Contract
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['All', 'Active', 'Draft', 'Expired'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === st
                ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white dark:text-amber-200 border border-purple-400/40 dark:border-amber-400/40 shadow-sm'
                : 'bg-white dark:bg-[#07050d] text-slate-600 dark:text-purple-300/70 border border-slate-200 dark:border-purple-900/40 hover:bg-purple-50 dark:hover:bg-purple-950/40'
            }`}
          >
            {st} Contracts
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0b0914]/80 border border-purple-100 dark:border-purple-900/40 rounded-3xl overflow-hidden shadow-md dark:shadow-2xl transition-colors duration-300">
        <table className="w-full text-left text-xs">
          <thead className="bg-purple-50/70 dark:bg-[#06050b] text-purple-900 dark:text-purple-300/70 font-bold uppercase tracking-wider text-[10px] border-b border-purple-100 dark:border-purple-900/50">
            <tr>
              <th className="px-5 py-4">Employee</th>
              <th className="px-5 py-4">Department & Role</th>
              <th className="px-5 py-4">Contract Period</th>
              <th className="px-5 py-4">Base Monthly Wage</th>
              <th className="px-5 py-4">Salary Structure</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-100 dark:divide-purple-950 text-slate-800 dark:text-purple-100 font-medium">
            {filteredContracts.map((c) => (
              <tr key={c.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition">
                <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                  {c.employee?.name}
                </td>
                <td className="px-5 py-4">
                  <div className="font-semibold text-slate-800 dark:text-purple-100">{c.jobPosition}</div>
                  <div className="text-[10px] text-slate-500 dark:text-purple-400/60 font-medium">{c.department}</div>
                </td>
                <td className="px-5 py-4 font-mono text-slate-600 dark:text-purple-300/80">
                  {new Date(c.startDate).toISOString().slice(0, 10)} → {c.endDate ? new Date(c.endDate).toISOString().slice(0, 10) : 'Open'}
                </td>
                <td className="px-5 py-4 font-mono font-black text-amber-300 text-sm">
                  ₹{c.wage.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-5 py-4 text-purple-700 dark:text-purple-200 font-semibold">
                  {c.salaryStructure?.name}
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    c.status === 'Active'
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                      : c.status === 'Draft'
                      ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-1.5 rounded-lg bg-purple-950/60 hover:bg-amber-400/20 text-purple-300 hover:text-amber-300 border border-purple-900/50 font-bold transition"
                      title="Edit Contract"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteContract(c.id, c.employee?.name || 'this employee')}
                      className="p-1.5 rounded-lg bg-purple-950/60 hover:bg-rose-500/20 text-purple-300 hover:text-rose-400 border border-purple-900/50 font-bold transition"
                      title="Delete Contract"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-[#090712] border border-purple-200 dark:border-purple-800/60 rounded-3xl w-full max-w-lg p-6 shadow-2xl transition-colors duration-300">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500 dark:text-amber-400" />
              Create Employment Contract
            </h2>
            <p className="text-xs text-slate-500 dark:text-purple-300/60 mb-4 font-medium">
              Enforces database-level non-overlapping validation for active contract periods.
            </p>

            {error && (
              <div className="mb-4 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-600 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateContract} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Employee</label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium cursor-pointer"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id} className="bg-white dark:bg-[#0b0914] text-slate-900 dark:text-white">{emp.name} ({emp.department})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">End Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-purple-300/80 mb-1 font-semibold">Base Wage (₹/month)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.wage}
                    onChange={(e) => setFormData({ ...formData, wage: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Salary Structure</label>
                  <select
                    value={formData.salaryStructureId}
                    onChange={(e) => setFormData({ ...formData, salaryStructureId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium cursor-pointer"
                  >
                    {structures.map(s => (
                      <option key={s.id} value={s.id} className="bg-white dark:bg-[#0b0914] text-slate-900 dark:text-white">{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-purple-100 dark:border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-purple-950/60 border border-slate-200 dark:border-purple-900/50 text-slate-600 dark:text-purple-300 rounded-xl hover:bg-slate-200 dark:hover:bg-purple-900/40 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl font-black shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Save Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Contract Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#090712] border border-purple-800/60 rounded-3xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Edit2 size={18} className="text-amber-400" />
              Edit Employment Contract
            </h2>
            <p className="text-xs text-purple-300/60 mb-4">
              Update contract dates and wages with active date overlap validation.
            </p>

            {editError && (
              <div className="mb-4 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateContract} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-purple-300/80 mb-1 font-semibold">Start Date</label>
                  <input
                    type="date"
                    required
                    value={editFormData.startDate}
                    onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                    className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-purple-300/80 mb-1 font-semibold">End Date (Optional)</label>
                  <input
                    type="date"
                    value={editFormData.endDate}
                    onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                    className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-purple-300/80 mb-1 font-semibold">Base Wage (₹/month)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editFormData.wage}
                    onChange={(e) => setEditFormData({ ...editFormData, wage: Number(e.target.value) })}
                    className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-purple-300/80 mb-1 font-semibold">Salary Structure</label>
                  <select
                    value={editFormData.salaryStructureId}
                    onChange={(e) => setEditFormData({ ...editFormData, salaryStructureId: e.target.value })}
                    className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  >
                    {structures.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-purple-300/80 mb-1 font-semibold">Department</label>
                  <input
                    type="text"
                    required
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
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

              <div>
                <label className="block text-purple-300/80 mb-1 font-semibold">Contract Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="Expired">Expired</option>
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
                  Update Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
