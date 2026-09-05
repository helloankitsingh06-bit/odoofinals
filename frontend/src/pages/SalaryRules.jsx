import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Trash2, 
  Edit3, 
  Check, 
  AlertCircle,
  Hash,
  Percent,
  Cpu,
  Layers,
  Sparkles,
  HelpCircle,
  X
} from 'lucide-react';
import { payrollService } from '../lib/payrollService';

const CATEGORIES = ['Basic', 'Allowance', 'Gross', 'Deduction', 'Net'];
const COMPUTE_TYPES = ['Fixed', 'Percentage', 'Formula'];

const CATEGORY_COLORS = {
  Basic: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  Allowance: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  Gross: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  Deduction: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  Net: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
};

export default function SalaryRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'Basic',
    sequence: 10,
    computeType: 'Fixed',
    amount: '',
    percentage: '',
    percentageOf: '',
    formula: '',
    description: '',
  });

  async function loadRules() {
    setLoading(true);
    setError('');
    try {
      const data = await payrollService.rules.list();
      setRules(data);
    } catch (err) {
      setError(err.message || 'Failed to load salary rules');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRules();
  }, []);

  function openCreateModal() {
    setEditingRule(null);
    const nextSeq = rules.length > 0 ? Math.max(...rules.map((r) => r.sequence || 0)) + 10 : 10;
    setFormData({
      name: '',
      code: '',
      category: 'Basic',
      sequence: nextSeq,
      computeType: 'Fixed',
      amount: '',
      percentage: '',
      percentageOf: '',
      formula: '',
      description: '',
    });
    setError('');
    setIsModalOpen(true);
  }

  function openEditModal(rule) {
    setEditingRule(rule);
    setFormData({
      name: rule.name || '',
      code: rule.code || '',
      category: rule.category || 'Basic',
      sequence: rule.sequence ?? 10,
      computeType: rule.computeType || 'Fixed',
      amount: rule.amount ?? '',
      percentage: rule.percentage ?? '',
      percentageOf: rule.percentageOf || '',
      formula: rule.formula || '',
      description: rule.description || '',
    });
    setError('');
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        category: formData.category,
        sequence: parseInt(formData.sequence, 10),
        computeType: formData.computeType,
        description: formData.description.trim(),
      };

      if (formData.computeType === 'Fixed') {
        payload.amount = parseFloat(formData.amount) || 0;
      } else if (formData.computeType === 'Percentage') {
        payload.percentage = parseFloat(formData.percentage) || 0;
        payload.percentageOf = formData.percentageOf.trim().toUpperCase();
      } else if (formData.computeType === 'Formula') {
        payload.formula = formData.formula.trim();
      }

      if (editingRule) {
        await payrollService.rules.update(editingRule.id, payload);
      } else {
        await payrollService.rules.create(payload);
      }

      setIsModalOpen(false);
      await loadRules();
    } catch (err) {
      setError(err.message || 'Failed to save salary rule');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(rule) {
    if (!window.confirm(`Are you sure you want to delete salary rule "${rule.name}" [${rule.code}]?`)) {
      return;
    }
    try {
      await payrollService.rules.remove(rule.id);
      await loadRules();
    } catch (err) {
      alert(err.message || 'Failed to delete rule');
    }
  }

  // Filter rules
  const filteredRules = rules.filter((r) => {
    const matchesSearch =
      (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.code || '').toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'All' || r.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Header Card */}
      <div className="p-6 glass-panel border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 font-mono">
              Calculation Rules Architecture
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">
            Salary Rules Master
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">
            Configure atomic calculation components (Fixed, Percentage of base, or Formulas).
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Salary Rule</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-stone-950/60 border border-stone-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            placeholder="Search by rule name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-stone-900 border border-stone-800 text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['All', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition uppercase tracking-wider ${
                selectedCategory === cat
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Rules Table */}
      <div className="glass-panel border border-stone-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-800/80 bg-stone-900/40 text-[10px] font-mono uppercase tracking-widest text-stone-400">
                <th className="py-3.5 px-4 font-semibold text-center w-16">Seq</th>
                <th className="py-3.5 px-4 font-semibold">Rule Code</th>
                <th className="py-3.5 px-4 font-semibold">Rule Name</th>
                <th className="py-3.5 px-4 font-semibold">Category</th>
                <th className="py-3.5 px-4 font-semibold">Type</th>
                <th className="py-3.5 px-4 font-semibold">Computation Value</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/40 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-stone-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
                      <span>Loading salary rules...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRules.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-stone-500">
                    No salary rules found matching criteria. Click "New Salary Rule" to create one.
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => (
                  <tr
                    key={rule.id}
                    className="hover:bg-white/[0.02] transition duration-150 group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-center text-emerald-400">
                      {rule.sequence}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white tracking-wider">
                      <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800">
                        {rule.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-stone-200">
                      <div>{rule.name}</div>
                      {rule.description && (
                        <span className="text-[10px] text-stone-500 truncate block max-w-xs">
                          {rule.description}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          CATEGORY_COLORS[rule.category] || 'bg-stone-800 text-stone-300'
                        }`}
                      >
                        {rule.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 text-stone-300 font-mono text-[11px]">
                        {rule.computeType === 'Fixed' && <Hash className="w-3.5 h-3.5 text-emerald-400" />}
                        {rule.computeType === 'Percentage' && <Percent className="w-3.5 h-3.5 text-cyan-400" />}
                        {rule.computeType === 'Formula' && <Cpu className="w-3.5 h-3.5 text-purple-400" />}
                        {rule.computeType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-stone-300">
                      {rule.computeType === 'Fixed' && (
                        <span className="text-emerald-400 font-semibold">
                          ₹{Number(rule.amount || 0).toLocaleString('en-IN')}
                        </span>
                      )}
                      {rule.computeType === 'Percentage' && (
                        <span className="text-cyan-400">
                          {rule.percentage}% of <span className="font-bold underline">{rule.percentageOf}</span>
                        </span>
                      )}
                      {rule.computeType === 'Formula' && (
                        <span className="text-purple-300 font-semibold truncate block max-w-xs" title={rule.formula}>
                          {rule.formula}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(rule)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
                        title="Edit Rule"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(rule)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800 transition"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-lg bg-stone-950 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden my-8">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-900/50">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  {editingRule ? 'Edit Salary Rule' : 'Create Salary Rule'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Name & Code */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-400 uppercase tracking-wider text-[10px]">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Basic Salary"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-white placeholder:text-stone-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-400 uppercase tracking-wider text-[10px]">
                    Rule Code (Unique Key) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BASIC"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-emerald-400 font-mono font-bold placeholder:text-stone-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Category & Sequence */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-400 uppercase tracking-wider text-[10px]">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-200 focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-400 uppercase tracking-wider text-[10px]">
                    Sequence (Execution Order) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={formData.sequence}
                    onChange={(e) => setFormData({ ...formData, sequence: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Compute Type Selector */}
              <div className="space-y-1">
                <label className="font-bold text-stone-400 uppercase tracking-wider text-[10px]">
                  Computation Type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {COMPUTE_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, computeType: type })}
                      className={`py-2 px-3 rounded-lg border text-center font-semibold transition ${
                        formData.computeType === type
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-sm'
                          : 'bg-stone-900 text-stone-400 border-stone-800 hover:bg-stone-800'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Compute Inputs */}
              {formData.computeType === 'Fixed' && (
                <div className="space-y-1 p-3.5 rounded-xl bg-stone-900/60 border border-stone-800">
                  <label className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">
                    Fixed Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="e.g. 50000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {formData.computeType === 'Percentage' && (
                <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-cyan-400 uppercase tracking-wider text-[10px]">
                        Percentage (%) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        required
                        placeholder="e.g. 40"
                        value={formData.percentage}
                        onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-cyan-400 uppercase tracking-wider text-[10px]">
                        Percentage Of (Rule Code) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. BASIC"
                        value={formData.percentageOf}
                        onChange={(e) => setFormData({ ...formData, percentageOf: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-cyan-400 font-mono font-bold focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                  {rules.length > 0 && (
                    <div>
                      <span className="text-[10px] text-stone-500 block mb-1">Quick Select Upstream Rule:</span>
                      <div className="flex flex-wrap gap-1">
                        {rules
                          .filter((r) => r.sequence < formData.sequence)
                          .map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => setFormData({ ...formData, percentageOf: r.code })}
                              className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-mono"
                            >
                              {r.code}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {formData.computeType === 'Formula' && (
                <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800 space-y-3">
                  <div className="space-y-1">
                    <label className="font-bold text-purple-400 uppercase tracking-wider text-[10px] flex items-center justify-between">
                      <span>Formula Expression *</span>
                      <span className="text-stone-500 font-normal">Zero-eval AST evaluator</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BASIC + HRA * 0.5"
                      value={formData.formula}
                      onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-purple-300 font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  {/* Quick Helper Chips */}
                  <div>
                    <span className="text-[10px] text-stone-500 block mb-1">Quick Insert Tokens:</span>
                    <div className="flex flex-wrap gap-1">
                      {['+', '-', '*', '/', 'min(', 'max(', 'round('].map((op) => (
                        <button
                          key={op}
                          type="button"
                          onClick={() => setFormData({ ...formData, formula: `${formData.formula} ${op} ` })}
                          className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 font-mono text-[10px]"
                        >
                          {op}
                        </button>
                      ))}
                      {rules
                        .filter((r) => r.sequence < formData.sequence)
                        .map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, formula: `${formData.formula} ${r.code}`.trim() })}
                            className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/40 text-purple-300 font-mono text-[10px]"
                          >
                            {r.code}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-stone-400 uppercase tracking-wider text-[10px]">
                  Description (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Optional context or legal note..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-white placeholder:text-stone-600 focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-900 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold uppercase tracking-wider transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
