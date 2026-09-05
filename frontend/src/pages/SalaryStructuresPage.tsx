import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Layers,
  Plus,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
  Check,
  X,
  Code
} from 'lucide-react';

export const SalaryStructuresPage: React.FC = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals & Testers
  const [showRuleModal, setShowRuleModal] = useState<boolean>(false);
  const [showStructureModal, setShowStructureModal] = useState<boolean>(false);
  const [ruleForm, setRuleForm] = useState({
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

  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [validating, setValidating] = useState<boolean>(false);

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
      alert(err.message);
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
      alert(err.message);
    }
  };

  const isReadOnly = user?.role === 'HRPayrollUser';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/40 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Layers className="text-emerald-400" />
            Salary Rules & Structures Architecture
          </h1>
          <p className="text-sm text-slate-400">
            Ordered salary execution sequence with AST formula evaluation and circular reference validation.
          </p>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRuleModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold"
            >
              <Plus size={15} /> New Salary Rule
            </button>
            <button
              onClick={() => {
                setStructureForm({ name: '', ruleIds: rules.map(r => r.id) });
                setValidationResult(null);
                setShowStructureModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/20"
            >
              <Plus size={15} /> New Structure
            </button>
          </div>
        )}
      </div>

      {/* Salary Structures Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Configured Salary Structures</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {structures.map((st) => (
            <div key={st.id} className="bg-slate-800/50 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white text-base">{st.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
                  {st.rules?.length || 0} Ordered Rules
                </span>
              </div>

              <div className="space-y-2 mt-4">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Sequential Calculation Chain:</span>
                <div className="space-y-1.5">
                  {st.rules?.map((sr: any) => (
                    <div
                      key={sr.id}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded bg-slate-800 text-slate-400 font-mono text-[10px] flex items-center justify-center font-bold">
                          {sr.position}
                        </span>
                        <span className="font-semibold text-white">{sr.salaryRule?.name}</span>
                        <code className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1 py-0.5 rounded font-mono">
                          {sr.salaryRule?.code}
                        </code>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {sr.salaryRule?.computeType === 'Fixed' && `$${sr.salaryRule?.value || 0}`}
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200">Salary Rule Definitions Library</span>
          <span className="text-xs text-slate-500">{rules.length} Rules Registered</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-3.5">Sequence</th>
              <th className="px-5 py-3.5">Rule Name</th>
              <th className="px-5 py-3.5">Code</th>
              <th className="px-5 py-3.5">Category</th>
              <th className="px-5 py-3.5">Computation Type</th>
              <th className="px-5 py-3.5 text-right">Value / Expression</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {rules.map((rule) => (
              <tr key={rule.id} className="hover:bg-slate-800/40 transition">
                <td className="px-5 py-3.5 font-mono font-bold text-slate-500">
                  #{rule.sequence}
                </td>
                <td className="px-5 py-3.5 font-semibold text-white">
                  {rule.name}
                </td>
                <td className="px-5 py-3.5">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[11px] font-bold">
                    {rule.code}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    rule.category === 'Basic' ? 'bg-blue-500/20 text-blue-300' :
                    rule.category === 'Allowance' ? 'bg-purple-500/20 text-purple-300' :
                    rule.category === 'Deduction' ? 'bg-rose-500/20 text-rose-300' :
                    rule.category === 'Gross' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {rule.category}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-slate-400 font-medium">
                  {rule.computeType}
                </td>
                <td className="px-5 py-3.5 font-mono font-bold text-right text-emerald-400">
                  {rule.computeType === 'Fixed' && (rule.value ? `$${rule.value}` : 'Contract Wage')}
                  {rule.computeType === 'Percentage' && `${rule.value}% of ${rule.formula || 'BASIC'}`}
                  {rule.computeType === 'Formula' && <span className="text-blue-400">{rule.formula}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Create Salary Rule</h2>
            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  placeholder="e.g. Travel Allowance"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Code (Unique)</label>
                  <input
                    type="text"
                    required
                    value={ruleForm.code}
                    onChange={(e) => setRuleForm({ ...ruleForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono uppercase"
                    placeholder="TRAVEL"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select
                    value={ruleForm.category}
                    onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
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
                  <label className="block text-slate-400 mb-1">Compute Type</label>
                  <select
                    value={ruleForm.computeType}
                    onChange={(e) => setRuleForm({ ...ruleForm, computeType: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Fixed">Fixed</option>
                    <option value="Percentage">Percentage</option>
                    <option value="Formula">Formula</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Execution Sequence</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={ruleForm.sequence}
                    onChange={(e) => setRuleForm({ ...ruleForm, sequence: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              {ruleForm.computeType !== 'Formula' && (
                <div>
                  <label className="block text-slate-400 mb-1">Numeric Value / % Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ruleForm.value}
                    onChange={(e) => setRuleForm({ ...ruleForm, value: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              )}

              {ruleForm.computeType === 'Formula' && (
                <div>
                  <label className="block text-slate-400 mb-1">Math Expression Formula</label>
                  <input
                    type="text"
                    required
                    value={ruleForm.formula}
                    onChange={(e) => setRuleForm({ ...ruleForm, formula: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                    placeholder="e.g. BASIC + HRA - PF"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow-md"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Structure Modal with Live Dry-Run Validation */}
      {showStructureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-2">Build Salary Structure</h2>
            <p className="text-xs text-slate-400 mb-4">
              Select and sequence rules. Run dry-run validation to test for forward dependencies.
            </p>

            <form onSubmit={handleCreateStructure} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Structure Name</label>
                <input
                  type="text"
                  required
                  value={structureForm.name}
                  onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  placeholder="e.g. Executive Compensation Package"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Ordered Rule Sequence:</label>
                <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-slate-950 border border-slate-800 rounded-xl">
                  {rules.map((r, idx) => {
                    const isChecked = structureForm.ruleIds.includes(r.id);
                    return (
                      <label
                        key={r.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                          isChecked ? 'bg-slate-800 border border-emerald-500/30' : 'bg-slate-900/60 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setStructureForm(prev => ({ ...prev, ruleIds: [...prev.ruleIds, r.id] }));
                              } else {
                                setStructureForm(prev => ({ ...prev, ruleIds: prev.ruleIds.filter(id => id !== r.id) }));
                              }
                            }}
                            className="rounded text-emerald-500"
                          />
                          <span className="font-semibold text-white">{r.name}</span>
                          <span className="text-[10px] text-emerald-400 font-mono">[{r.code}]</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{r.computeType}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Dry-run Validator Feedback */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Dry-Run Dependency Check</span>
                  <button
                    type="button"
                    onClick={handleDryRunValidate}
                    disabled={validating}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-[11px] font-bold"
                  >
                    {validating ? 'Checking...' : 'Run Dry Validation'}
                  </button>
                </div>

                {validationResult && (
                  <div className={`mt-2 p-2 rounded-lg text-[11px] ${
                    validationResult.valid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {validationResult.valid ? (
                      <div className="flex items-center gap-1 font-bold">
                        <Check size={14} /> Structure rules sequence is mathematically sound with 0 forward reference errors!
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

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStructureModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={validationResult?.valid === false}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-semibold shadow-md"
                >
                  Save Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
