import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { Briefcase, Plus, Search, AlertCircle, CheckCircle, Calendar } from 'lucide-react';

export const ContractsPage: React.FC = () => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    employeeId: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    wage: 6500,
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

  const filteredContracts = contracts.filter(c => statusFilter === 'All' || c.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/40 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Briefcase className="text-purple-400" />
            Employment Contracts
          </h1>
          <p className="text-sm text-slate-400">
            Period-applicable compensation agreements with strict overlap prevention.
          </p>
        </div>

        <button
          onClick={() => { setError(null); setShowModal(true); }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/20 transition"
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
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === st
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {st} Contracts
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-3.5">Employee</th>
              <th className="px-5 py-3.5">Department & Role</th>
              <th className="px-5 py-3.5">Contract Period</th>
              <th className="px-5 py-3.5">Base Monthly Wage</th>
              <th className="px-5 py-3.5">Salary Structure</th>
              <th className="px-5 py-3.5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {filteredContracts.map((c) => (
              <tr key={c.id} className="hover:bg-slate-800/40 transition">
                <td className="px-5 py-3.5 font-semibold text-white">
                  {c.employee?.name}
                </td>
                <td className="px-5 py-3.5">
                  <div>{c.jobPosition}</div>
                  <div className="text-[10px] text-slate-500">{c.department}</div>
                </td>
                <td className="px-5 py-3.5 font-mono text-slate-400">
                  {new Date(c.startDate).toISOString().slice(0, 10)} → {c.endDate ? new Date(c.endDate).toISOString().slice(0, 10) : 'Open'}
                </td>
                <td className="px-5 py-3.5 font-mono font-bold text-emerald-400">
                  ${c.wage.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-5 py-3.5 text-slate-300 font-medium">
                  {c.salaryStructure?.name}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    c.status === 'Active'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : c.status === 'Draft'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-2">Create Employment Contract</h2>
            <p className="text-xs text-slate-400 mb-4">
              Enforces database-level non-overlapping validation for active contract periods.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateContract} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Employee</label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Base Wage ($/month)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.wage}
                    onChange={(e) => setFormData({ ...formData, wage: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Salary Structure</label>
                  <select
                    value={formData.salaryStructureId}
                    onChange={(e) => setFormData({ ...formData, salaryStructureId: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none"
                  >
                    {structures.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold shadow-md"
                >
                  Save Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
