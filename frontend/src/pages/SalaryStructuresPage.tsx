import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Layers,
  Plus,
  Check,
  Sparkles,
  Edit2,
  Trash2,
  AlertCircle
} from 'lucide-react';

export const SalaryStructuresPage: React.FC = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals & Testers
  const [showRuleModal, setShowRuleModal] = useState<boolean>(false);
  const [showEditRuleModal, setShowEditRuleModal] = useState<boolean>(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [showStructureModal, setShowStructureModal] = useState<boolean>(false);
  const [showEditStructureModal, setShowEditStructureModal] = useState<boolean>(false);
  const [editingStructureId, setEditingStructureId] = useState<string | null>(null);

  const [ruleForm, setRuleForm] = useState({
    name: '',
    code: '',
    category: 'Allowance',
    sequence: 1,
    computeType: 'Fixed',
    value: 0,
    formula: ''
  });

  const [editRuleForm, setEditRuleForm] = useState({
    name: '',
    code: '',
    category: 'Allowance',
    sequence: 1,
    computeType: 'Fixed',
    value: 0,
    formula: ''
  });

  const [structureForm, setStructureForm] = useState({
    name: '',
    ruleIds: [] as string[]
  });

  const [editStructureForm, setEditStructureForm] = useState({
    name: '',
    ruleIds: [] as string[]
  });

  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [validating, setValidating] = useState<boolean>(false);

  const [editStructureValidationResult, setEditStructureValidationResult] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [editStructureValidating, setEditStructureValidating] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rData, sData] = await Promise.all([
        apiRequest('/salary-structures/rules'),
        apiRequest('/salary-structures/structures')
      ]);
      setRules(rData);
      setStructures(sData);
    } catch (err) {
      console.error('Failed to load salary rules/structures:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/salary-structures/rules', {
        method: 'POST',
        body: JSON.stringify(ruleForm)
      });
      setShowRuleModal(false);
      setRuleForm({ name: '', code: '', category: 'Allowance', sequence: 1, computeType: 'Fixed', value: 0, formula: '' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create rule');
    }
  };

  const openEditRuleModal = (rule: any) => {
    setEditingRuleId(rule.id);
    setEditRuleForm({
      name: rule.name || '',
      code: rule.code || '',
      category: rule.category || 'Allowance',
      sequence: rule.sequence || 1,
      computeType: rule.computeType || 'Fixed',
      value: rule.value || 0,
      formula: rule.formula || ''
    });
    setShowEditRuleModal(true);
  };

  const handleUpdateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRuleId) return;
    try {
      await apiRequest(`/salary-structures/rules/${editingRuleId}`, {
        method: 'PUT',
        body: JSON.stringify(editRuleForm)
      });
      setShowEditRuleModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update rule');
    }
  };

  const handleDeleteRule = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete salary rule "${name}"?`)) return;
    try {
      await apiRequest(`/salary-structures/rules/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete rule. It may be part of an existing structure.');
    }
  };

  const openEditStructureModal = (st: any) => {
    setEditingStructureId(st.id);
    const existingRuleIds = st.rules
      ? st.rules
          .map((r: any) => r.salaryRuleId || r.salaryRule?.id)
          .filter(Boolean)
          .sort((a: string, b: string) => {
            const ruleA = rules.find(x => x.id === a);
            const ruleB = rules.find(x => x.id === b);
            return (ruleA?.sequence || 0) - (ruleB?.sequence || 0);
          })
      : [];
    setEditStructureForm({
      name: st.name || '',
      ruleIds: existingRuleIds
    });
    setEditStructureValidationResult(null);
    setShowEditStructureModal(true);
  };

  const handleDeleteStructure = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete structure "${name}"?`)) return;
    try {
      await apiRequest(`/salary-structures/structures/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete structure.');
    }
  };

  const handleDryRunValidate = async () => {
    if (structureForm.ruleIds.length === 0) {
      setValidationResult({ valid: false, errors: ['Please select at least one rule'] });
      return;
    }
    setValidating(true);
    try {
      const result = await apiRequest('/salary-structures/validate', {
        method: 'POST',
        body: JSON.stringify({ ruleIds: structureForm.ruleIds })
      });
      setValidationResult(result);
    } catch (err: any) {
      setValidationResult({ valid: false, errors: [err.message] });
    } finally {
      setValidating(false);
    }
  };

  const handleDryRunValidateEdit = async () => {
    if (editStructureForm.ruleIds.length === 0) {
      setEditStructureValidationResult({ valid: false, errors: ['Please select at least one rule'] });
      return;
    }
    setEditStructureValidating(true);
    try {
      const result = await apiRequest('/salary-structures/validate', {
        method: 'POST',
        body: JSON.stringify({ ruleIds: editStructureForm.ruleIds })
      });
      setEditStructureValidationResult(result);
    } catch (err: any) {
      setEditStructureValidationResult({ valid: false, errors: [err.message] });
    } finally {
      setEditStructureValidating(false);
    }
  };

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/salary-structures/structures', {
        method: 'POST',
        body: JSON.stringify({
          name: structureForm.name,
          ruleIds: structureForm.ruleIds
        })
      });
      setShowStructureModal(false);
      setStructureForm({ name: '', ruleIds: [] });
      setValidationResult(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save structure');
    }
  };

  const handleUpdateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStructureId) return;
    try {
      await apiRequest(`/salary-structures/structures/${editingStructureId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editStructureForm.name,
          ruleIds: editStructureForm.ruleIds
        })
      });
      setShowEditStructureModal(false);
      setEditStructureValidationResult(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update structure');
    }
  };

  const isReadOnly = user?.role === 'HRPayrollUser';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 dark:bg-[#0b0914]/80 p-5 rounded-3xl border border-purple-100 dark:border-purple-900/40 backdrop-blur-xl shadow-lg dark:shadow-2xl transition-colors duration-300">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Layers className="text-amber-500 dark:text-amber-400" />
            Salary Rules & Structures Architecture
          </h1>
          <p className="text-sm text-slate-600 dark:text-purple-200/60 font-medium mt-0.5">
            Ordered salary execution sequence with AST formula evaluation and circular reference validation.
          </p>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRuleModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800/50 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Plus size={15} /> New Salary Rule
            </button>
            <button
              onClick={() => {
                setStructureForm({ name: '', ruleIds: rules.map(r => r.id) });
                setValidationResult(null);
                setShowStructureModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
            >
              <Plus size={16} /> New Structure
            </button>
          </div>
        )}
      </div>

      {/* Salary Structures Section */}
      <div className="space-y-4">
        <h2 className="text-xs font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={13} className="text-purple-600 dark:text-purple-400" /> Configured Salary Structures
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {structures.map((st) => (
            <div key={st.id} className="bg-white dark:bg-[#0b0914]/80 border border-purple-100 dark:border-purple-900/40 hover:border-amber-400/60 p-5 rounded-3xl shadow-sm hover:shadow-md dark:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">{st.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-500/30">
                    {st.rules?.length || 0} Ordered Rules
                  </span>
                  {!isReadOnly && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditStructureModal(st)}
                        className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-amber-400/20 text-purple-700 dark:text-purple-300 hover:text-amber-700 dark:hover:text-amber-300 border border-purple-200 dark:border-purple-900/50 transition font-bold cursor-pointer"
                        title="Edit Salary Structure"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteStructure(st.id, st.name)}
                        className="p-1.5 rounded-lg bg-rose-50 dark:bg-purple-950/60 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-purple-300 hover:text-rose-700 dark:hover:text-rose-400 border border-rose-200 dark:border-purple-900/50 transition font-bold cursor-pointer"
                        title="Delete Salary Structure"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <span className="text-[10px] uppercase font-extrabold text-purple-700 dark:text-purple-400/70 tracking-wider">Sequential Calculation Chain:</span>
                <div className="space-y-1.5">
                  {st.rules?.map((sr: any) => (
                    <div
                      key={sr.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/40 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-amber-300 font-mono text-[10px] flex items-center justify-center font-bold">
                          {sr.position}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">{sr.salaryRule?.name}</span>
                        <code className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
                          {sr.salaryRule?.code}
                        </code>
                      </div>
                      <div className="text-[11px] text-purple-900 dark:text-purple-300/90 font-mono font-bold">
                        {sr.salaryRule?.computeType === 'Fixed' && `₹${sr.salaryRule?.value || 0}`}
                        {sr.salaryRule?.computeType === 'Percentage' && `${sr.salaryRule?.value}% of ${sr.salaryRule?.formula || 'BASIC'}`}
                        {sr.salaryRule?.computeType === 'Formula' && sr.salaryRule?.formula}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Salary Rules Library Table */}
      <div className="bg-white dark:bg-[#0b0914]/80 border border-purple-100 dark:border-purple-900/40 rounded-3xl overflow-hidden shadow-md dark:shadow-2xl transition-colors duration-300">
        <div className="p-4 bg-purple-50/70 dark:bg-[#06050b] border-b border-purple-100 dark:border-purple-900/50 flex items-center justify-between">
          <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Salary Rule Definitions Library</span>
          <span className="text-xs text-slate-500 dark:text-purple-400/60 font-medium">{rules.length} Rules Registered</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-purple-50/70 dark:bg-[#06050b] text-purple-900 dark:text-purple-300/70 font-bold uppercase tracking-wider text-[10px] border-b border-purple-100 dark:border-purple-900/50">
            <tr>
              <th className="px-5 py-4">Sequence</th>
              <th className="px-5 py-4">Rule Name</th>
              <th className="px-5 py-4">Code</th>
              <th className="px-5 py-4">Category</th>
              <th className="px-5 py-4">Computation Type</th>
              <th className="px-5 py-4 text-center">Value / Expression</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-100 dark:divide-purple-950 text-slate-800 dark:text-purple-100 font-medium">
            {rules.map((rule) => (
              <tr key={rule.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition">
                <td className="px-5 py-4 font-mono font-bold text-slate-500 dark:text-purple-400/60">
                  #{rule.sequence}
                </td>
                <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                  {rule.name}
                </td>
                <td className="px-5 py-4">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-mono text-[11px] font-bold">
                    {rule.code}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    rule.category === 'Basic' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-500/30' :
                    rule.category === 'Allowance' ? 'bg-amber-100 dark:bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-400/30' :
                    rule.category === 'Deduction' ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30' :
                    rule.category === 'Gross' ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-500/30' :
                    'bg-purple-100 dark:bg-purple-600/20 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-600/30'
                  }`}>
                    {rule.category}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-700 dark:text-purple-300/70 font-semibold">
                  {rule.computeType}
                </td>
                <td className="px-5 py-4 font-mono font-bold text-center text-amber-600 dark:text-amber-300">
                  {rule.computeType === 'Fixed' && (rule.value ? `₹${rule.value}` : 'Contract Wage')}
                  {rule.computeType === 'Percentage' && `${rule.value}% of ${rule.formula || 'BASIC'}`}
                  {rule.computeType === 'Formula' && <span className="text-purple-700 dark:text-purple-300 font-bold">{rule.formula}</span>}
                </td>
                <td className="px-5 py-4 text-right">
                  {!isReadOnly && (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditRuleModal(rule)}
                        className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-amber-400/20 text-purple-700 dark:text-purple-300 hover:text-amber-700 dark:hover:text-amber-300 border border-purple-200 dark:border-purple-900/50 transition font-bold cursor-pointer"
                        title="Edit Rule"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id, rule.name)}
                        className="p-1.5 rounded-lg bg-rose-50 dark:bg-purple-950/60 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-purple-300 hover:text-rose-700 dark:hover:text-rose-400 border border-rose-200 dark:border-purple-900/50 transition font-bold cursor-pointer"
                        title="Delete Rule"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-[#090712] border border-purple-200 dark:border-purple-800/60 rounded-3xl w-full max-w-md p-6 shadow-2xl transition-colors duration-300">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500 dark:text-amber-400" />
              Create Salary Rule
            </h2>
            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Rule Name</label>
                <input
                  type="text"
                  required
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                  placeholder="e.g. Travel Allowance"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Code (Unique)</label>
                  <input
                    type="text"
                    required
                    value={ruleForm.code}
                    onChange={(e) => setRuleForm({ ...ruleForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                    placeholder="TRAVEL"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Category</label>
                  <select
                    value={ruleForm.category}
                    onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium cursor-pointer"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Allowance">Allowance</option>
                    <option value="Gross">Gross</option>
                    <option value="Deduction">Deduction</option>
                    <option value="Net">Net</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Compute Type</label>
                  <select
                    value={ruleForm.computeType}
                    onChange={(e) => setRuleForm({ ...ruleForm, computeType: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium cursor-pointer"
                  >
                    <option value="Fixed">Fixed</option>
                    <option value="Percentage">Percentage</option>
                    <option value="Formula">Formula</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Execution Sequence</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={ruleForm.sequence}
                    onChange={(e) => setRuleForm({ ...ruleForm, sequence: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                  />
                </div>
              </div>

              {ruleForm.computeType !== 'Formula' && (
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Numeric Value / % Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ruleForm.value}
                    onChange={(e) => setRuleForm({ ...ruleForm, value: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                  />
                </div>
              )}

              {ruleForm.computeType === 'Formula' && (
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Math Expression Formula</label>
                  <input
                    type="text"
                    required
                    value={ruleForm.formula}
                    onChange={(e) => setRuleForm({ ...ruleForm, formula: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                    placeholder="e.g. BASIC + HRA - PF"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-purple-100 dark:border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-purple-950/60 border border-slate-200 dark:border-purple-900/50 text-slate-600 dark:text-purple-300 rounded-xl hover:bg-slate-200 dark:hover:bg-purple-900/40 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl font-black shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Rule Modal */}
      {showEditRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-[#090712] border border-purple-200 dark:border-purple-800/60 rounded-3xl w-full max-w-md p-6 shadow-2xl transition-colors duration-300">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Edit2 size={18} className="text-amber-500 dark:text-amber-400" />
              Edit Salary Rule
            </h2>
            <form onSubmit={handleUpdateRule} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Rule Name</label>
                <input
                  type="text"
                  required
                  value={editRuleForm.name}
                  onChange={(e) => setEditRuleForm({ ...editRuleForm, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Code (Unique)</label>
                  <input
                    type="text"
                    required
                    value={editRuleForm.code}
                    onChange={(e) => setEditRuleForm({ ...editRuleForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Category</label>
                  <select
                    value={editRuleForm.category}
                    onChange={(e) => setEditRuleForm({ ...editRuleForm, category: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium cursor-pointer"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Allowance">Allowance</option>
                    <option value="Gross">Gross</option>
                    <option value="Deduction">Deduction</option>
                    <option value="Net">Net</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Compute Type</label>
                  <select
                    value={editRuleForm.computeType}
                    onChange={(e) => setEditRuleForm({ ...editRuleForm, computeType: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium cursor-pointer"
                  >
                    <option value="Fixed">Fixed</option>
                    <option value="Percentage">Percentage</option>
                    <option value="Formula">Formula</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Execution Sequence</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editRuleForm.sequence}
                    onChange={(e) => setEditRuleForm({ ...editRuleForm, sequence: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                  />
                </div>
              </div>

              {editRuleForm.computeType !== 'Formula' && (
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Numeric Value (₹) / % Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editRuleForm.value}
                    onChange={(e) => setEditRuleForm({ ...editRuleForm, value: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                  />
                </div>
              )}

              {editRuleForm.computeType === 'Formula' && (
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Math Expression Formula</label>
                  <input
                    type="text"
                    required
                    value={editRuleForm.formula}
                    onChange={(e) => setEditRuleForm({ ...editRuleForm, formula: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-purple-100 dark:border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setShowEditRuleModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-purple-950/60 border border-slate-200 dark:border-purple-900/50 text-slate-600 dark:text-purple-300 rounded-xl hover:bg-slate-200 dark:hover:bg-purple-900/40 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl font-black shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  Update Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Structure Modal with Live Dry-Run Validation */}
      {showStructureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-[#090712] border border-purple-200 dark:border-purple-800/60 rounded-3xl w-full max-w-xl p-6 shadow-2xl transition-colors duration-300">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500 dark:text-amber-400" />
              Build Salary Structure
            </h2>
            <p className="text-xs text-slate-500 dark:text-purple-300/60 mb-4 font-medium">
              Select and sequence rules. Run dry-run validation to test for forward dependencies.
            </p>

            <form onSubmit={handleCreateStructure} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Structure Name</label>
                <input
                  type="text"
                  required
                  value={structureForm.name}
                  onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                  placeholder="e.g. Executive Compensation Package"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Ordered Rule Sequence:</label>
                <div className="space-y-2 max-h-48 overflow-y-auto p-2.5 bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-2xl">
                  {rules.slice().sort((a, b) => (a.sequence || 0) - (b.sequence || 0)).map((r) => {
                    const isChecked = structureForm.ruleIds.includes(r.id);
                    return (
                      <label
                        key={r.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                          isChecked ? 'bg-purple-100 dark:bg-purple-950/60 border border-amber-500/40 dark:border-amber-400/40 shadow-sm' : 'bg-white dark:bg-[#08070e] opacity-70 border border-slate-200 dark:border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const nextIds = e.target.checked
                                ? [...structureForm.ruleIds, r.id]
                                : structureForm.ruleIds.filter(id => id !== r.id);
                              nextIds.sort((a, b) => {
                                const ruleA = rules.find(x => x.id === a);
                                const ruleB = rules.find(x => x.id === b);
                                return (ruleA?.sequence || 0) - (ruleB?.sequence || 0);
                              });
                              setStructureForm(prev => ({ ...prev, ruleIds: nextIds }));
                            }}
                            className="rounded text-amber-500"
                          />
                          <span className="font-semibold text-slate-900 dark:text-white">{r.name}</span>
                          <span className="text-[10px] text-amber-700 dark:text-amber-300 font-mono font-bold">[{r.code}]</span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-purple-400/70 font-mono font-medium">{r.computeType}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Dry-run Validator Feedback */}
              <div className="p-3.5 bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-purple-200">Dry-Run Dependency Check</span>
                  <button
                    type="button"
                    onClick={handleDryRunValidate}
                    disabled={validating}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[11px] font-bold shadow-sm cursor-pointer"
                  >
                    {validating ? 'Checking...' : 'Run Dry Validation'}
                  </button>
                </div>

                {validationResult && (
                  <div className={`mt-2.5 p-3 rounded-xl text-[11px] ${
                    validationResult.valid ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40'
                  }`}>
                    {validationResult.valid ? (
                      <div className="flex items-center gap-1.5 font-bold">
                        <Check size={14} className="text-amber-600 dark:text-amber-400" /> Structure rules sequence is mathematically sound with 0 forward reference errors!
                      </div>
                    ) : (
                      <div>
                        <strong className="block font-bold">Validation Errors:</strong>
                        {validationResult.errors.map((err, i) => <div key={i}>• {err}</div>)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-purple-100 dark:border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setShowStructureModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-purple-950/60 border border-slate-200 dark:border-purple-900/50 text-slate-600 dark:text-purple-300 rounded-xl hover:bg-slate-200 dark:hover:bg-purple-900/40 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={validationResult?.valid === false}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 rounded-xl font-black shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Save Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Structure Modal with Live Dry-Run Validation */}
      {showEditStructureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-[#090712] border border-purple-200 dark:border-purple-800/60 rounded-3xl w-full max-w-xl p-6 shadow-2xl transition-colors duration-300">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Edit2 size={18} className="text-amber-500 dark:text-amber-400" />
              Edit Salary Structure
            </h2>
            <p className="text-xs text-slate-500 dark:text-purple-300/60 mb-4 font-medium">
              Update structure name, add/remove salary rules, and validate calculation sequence.
            </p>

            <form onSubmit={handleUpdateStructure} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Structure Name</label>
                <input
                  type="text"
                  required
                  value={editStructureForm.name}
                  onChange={(e) => setEditStructureForm({ ...editStructureForm, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                  placeholder="e.g. Executive Compensation Package"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Ordered Rule Sequence:</label>
                <div className="space-y-2 max-h-48 overflow-y-auto p-2.5 bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-2xl">
                  {rules.slice().sort((a, b) => (a.sequence || 0) - (b.sequence || 0)).map((r) => {
                    const isChecked = editStructureForm.ruleIds.includes(r.id);
                    return (
                      <label
                        key={r.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                          isChecked ? 'bg-purple-100 dark:bg-purple-950/60 border border-amber-500/40 dark:border-amber-400/40 shadow-sm' : 'bg-white dark:bg-[#08070e] opacity-70 border border-slate-200 dark:border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const nextIds = e.target.checked
                                ? [...editStructureForm.ruleIds, r.id]
                                : editStructureForm.ruleIds.filter(id => id !== r.id);
                              nextIds.sort((a, b) => {
                                const ruleA = rules.find(x => x.id === a);
                                const ruleB = rules.find(x => x.id === b);
                                return (ruleA?.sequence || 0) - (ruleB?.sequence || 0);
                              });
                              setEditStructureForm(prev => ({ ...prev, ruleIds: nextIds }));
                            }}
                            className="rounded text-amber-500"
                          />
                          <span className="font-semibold text-slate-900 dark:text-white">{r.name}</span>
                          <span className="text-[10px] text-amber-700 dark:text-amber-300 font-mono font-bold">[{r.code}]</span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-purple-400/70 font-mono font-medium">{r.computeType}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Dry-run Validator Feedback */}
              <div className="p-3.5 bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-purple-200">Dry-Run Dependency Check</span>
                  <button
                    type="button"
                    onClick={handleDryRunValidateEdit}
                    disabled={editStructureValidating}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[11px] font-bold shadow-sm cursor-pointer"
                  >
                    {editStructureValidating ? 'Checking...' : 'Run Dry Validation'}
                  </button>
                </div>

                {editStructureValidationResult && (
                  <div className={`mt-2.5 p-3 rounded-xl text-[11px] ${
                    editStructureValidationResult.valid ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40'
                  }`}>
                    {editStructureValidationResult.valid ? (
                      <div className="flex items-center gap-1.5 font-bold">
                        <Check size={14} className="text-amber-600 dark:text-amber-400" /> Structure rules sequence is mathematically sound with 0 forward reference errors!
                      </div>
                    ) : (
                      <div>
                        <strong className="block font-bold">Validation Errors:</strong>
                        {editStructureValidationResult.errors.map((err, i) => <div key={i}>• {err}</div>)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-purple-100 dark:border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setShowEditStructureModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-purple-950/60 border border-slate-200 dark:border-purple-900/50 text-slate-600 dark:text-purple-300 rounded-xl hover:bg-slate-200 dark:hover:bg-purple-900/40 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editStructureValidationResult?.valid === false}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 rounded-xl font-black shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Update Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
