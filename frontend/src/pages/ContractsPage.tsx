import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { Briefcase, Plus, AlertCircle, Sparkles } from 'lucide-react';

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
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0b0914]/80 p-5 rounded-3xl border border-purple-900/40 backdrop-blur-xl shadow-2xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Briefcase className="text-amber-400" />
            Employment Contracts
          </h1>
          <p className="text-sm text-purple-200/60">
            Period-applicable compensation agreements with strict overlap prevention.
          </p>
        </div>

        <button
          onClick={() => { setError(null); setShowModal(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 transition active:scale-95"
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
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === st
                ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-amber-200 border border-amber-400/40 shadow-md shadow-purple-500/20'
                : 'bg-[#07050d] text-purple-300/70 border border-purple-900/40 hover:bg-purple-950/40'
            }`}
          >
            {st} Contracts
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#0b0914]/80 border border-purple-900/40 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#06050b] text-purple-300/70 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-4">Employee</th>
              <th className="px-5 py-4">Department & Role</th>
              <th className="px-5 py-4">Contract Period</th>
              <th className="px-5 py-4">Base Monthly Wage</th>
              <th className="px-5 py-4">Salary Structure</th>
              <th className="px-5 py-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-950 text-purple-100">
            {filteredContracts.map((c) => (
              <tr key={c.id} className="hover:bg-purple-950/20 transition">
                <td className="px-5 py-4 font-bold text-white">
                  {c.employee?.name}
                </td>
                <td className="px-5 py-4">
                  <div className="font-semibold text-purple-100">{c.jobPosition}</div>
                  <div className="text-[10px] text-purple-400/60">{c.department}</div>
                </td>
                <td className="px-5 py-4 font-mono text-purple-300/80">
                  {new Date(c.startDate).toISOString().slice(0, 10)} → {c.endDate ? new Date(c.endDate).toISOString().slice(0, 10) : 'Open'}
                </td>
                <td className="px-5 py-4 font-mono font-black text-amber-300 text-sm">
                  ${c.wage.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-5 py-4 text-purple-200 font-medium">
                  {c.salaryStructure?.name}
                </td>
                <td className="px-5 py-4 text-right">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    c.status === 'Active'
                      ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                      : c.status === 'Draft'
                      ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30'
                      : 'bg-slate-800 text-slate-400'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#090712] border border-purple-800/60 rounded-3xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400" />
              Create Employment Contract
            </h2>
            <p className="text-xs text-purple-300/60 mb-4">
              Enforces database-level non-overlapping validation for active contract periods.
            </p>

            {error && (
              <div className="mb-4 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateContract} className="space-y-4 text-xs">
              <div>
                <label className="block text-purple-300/80 mb-1 font-semibold">Employee</label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                  className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-purple-300/80 mb-1 font-semibold">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-purple-300/80 mb-1 font-semibold">End Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-purple-300/80 mb-1 font-semibold">Base Wage ($/month)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.wage}
                    onChange={(e) => setFormData({ ...formData, wage: Number(e.target.value) })}
                    className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-purple-300/80 mb-1 font-semibold">Salary Structure</label>
                  <select
                    value={formData.salaryStructureId}
                    onChange={(e) => setFormData({ ...formData, salaryStructureId: e.target.value })}
                    className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  >
                    {structures.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-purple-950/60 border border-purple-900/50 text-purple-300 rounded-xl hover:bg-purple-900/40 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl font-black shadow-lg shadow-amber-500/20"
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
