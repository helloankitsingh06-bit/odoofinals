import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  X,
  ArrowUpDown,
  MoveUp,
  MoveDown,
  Info
} from 'lucide-react';
import { payrollService } from '../lib/payrollService';

export default function SalaryStructures() {
  const [structures, setStructures] = useState([]);
  const [availableRules, setAvailableRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedRuleIds, setSelectedRuleIds] = useState([]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [structData, rulesData] = await Promise.all([
        payrollService.structures.list(),
        payrollService.rules.list(),
      ]);
      setStructures(structData);
      setAvailableRules(rulesData);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openCreateModal() {
    setEditingStructure(null);
    setName('');
    setDescription('');
    // Default select all available rules sorted by sequence
    setSelectedRuleIds(availableRules.map((r) => r.id));
    setError('');
    setIsModalOpen(true);
  }

  function openEditModal(struct) {
    setEditingStructure(struct);
    setName(struct.name || '');
    setDescription(struct.description || '');
    setSelectedRuleIds(struct.ruleIds || []);
    setError('');
    setIsModalOpen(true);
  }

  function toggleRule(ruleId) {
    if (selectedRuleIds.includes(ruleId)) {
      setSelectedRuleIds(selectedRuleIds.filter((id) => id !== ruleId));
    } else {
      setSelectedRuleIds([...selectedRuleIds, ruleId]);
    }
  }

  function moveRule(index, direction) {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= selectedRuleIds.length) return;
    const updated = [...selectedRuleIds];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIdx, 0, moved);
    setSelectedRuleIds(updated);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Structure Name is required');
      return;
    }
    if (selectedRuleIds.length === 0) {
      setError('At least one Salary Rule must be selected for the structure');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        ruleIds: selectedRuleIds,
      };

      if (editingStructure) {
        await payrollService.structures.update(editingStructure.id, payload);
      } else {
        await payrollService.structures.create(payload);
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to save salary structure');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(struct) {
    if (!window.confirm(`Are you sure you want to delete structure "${struct.name}"?`)) {
      return;
    }
    try {
      await payrollService.structures.remove(struct.id);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete salary structure');
    }
  }

  const filtered = structures.filter((s) =>
    (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const ruleMap = new Map(availableRules.map((r) => [r.id, r]));

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Header Card */}
      <div className="p-6 glass-panel border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 font-mono">
              Compensation Framework
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">
            Salary Structures
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">
            Assemble ordered salary rules into compensation tiers bound to employee contracts.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Salary Structure</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-stone-950/60 border border-stone-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            placeholder="Search structures..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-stone-900 border border-stone-800 text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Structures Grid */}
      {loading ? (
        <div className="py-16 text-center text-stone-500 glass-panel">
          <div className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
            <span className="text-xs">Loading structures...</span>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-stone-500 glass-panel">
          <p className="text-xs">No salary structures found. Click "New Salary Structure" to configure one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((struct) => {
            const assignedRules = (struct.ruleIds || [])
              .map((id) => ruleMap.get(id))
              .filter(Boolean);

            return (
              <div
                key={struct.id}
                className="glass-panel border border-stone-800/80 p-6 flex flex-col justify-between hover:border-emerald-500/40 transition duration-200 group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                        {struct.ruleIds?.length || 0} Rules Assigned
                      </span>
                      <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
                        {struct.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(struct)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
                        title="Edit Structure"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(struct)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800 transition"
                        title="Delete Structure"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {struct.description && (
                    <p className="text-xs text-stone-400 line-clamp-2">
                      {struct.description}
                    </p>
                  )}

                  {/* Assigned Rules Preview Badges */}
                  <div className="pt-2 border-t border-stone-800/60">
                    <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block mb-2">
                      Execution Sequence:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {assignedRules.length === 0 ? (
                        <span className="text-xs text-stone-600 italic">No rules active</span>
                      ) : (
                        assignedRules.map((r, idx) => (
                          <span
                            key={r.id || idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-stone-900 border border-stone-800 text-stone-300"
                          >
                            <span className="text-emerald-400 font-bold">{r.sequence}</span>
                            <span>{r.code}</span>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-stone-800/40 flex items-center justify-between text-[11px] text-stone-500 font-mono">
                  <span>ID: {struct.id.slice(0, 8)}...</span>
                  <span className="text-emerald-400 font-semibold">Active</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT STRUCTURE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-2xl bg-stone-950 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden my-8">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-900/50">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  {editingStructure ? 'Edit Salary Structure' : 'Create Salary Structure'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Name & Description */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-400 uppercase tracking-wider text-[10px]">
                    Structure Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Standard Full-time Engineering"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-white placeholder:text-stone-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-400 uppercase tracking-wider text-[10px]">
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="Optional description of which employee bands this applies to..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-white placeholder:text-stone-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Rule Selection & Ordering */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">
                    Assigned Rules & Order ({selectedRuleIds.length} Selected)
                  </label>
                  <span className="text-[10px] text-stone-500 font-mono">
                    Sequence dictates engine execution order
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto rounded-xl border border-stone-800 bg-stone-900/40 p-2 space-y-1.5">
                  {availableRules.length === 0 ? (
                    <div className="p-4 text-center text-stone-500">
                      No salary rules available. Please create rules first.
                    </div>
                  ) : (
                    availableRules.map((rule) => {
                      const isSelected = selectedRuleIds.includes(rule.id);
                      const orderIndex = selectedRuleIds.indexOf(rule.id);

                      return (
                        <div
                          key={rule.id}
                          className={`flex items-center justify-between p-2.5 rounded-lg border transition ${
                            isSelected
                              ? 'bg-stone-900 border-emerald-500/40 text-white'
                              : 'bg-stone-950/40 border-stone-800/60 text-stone-400 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRule(rule.id)}
                              className="rounded bg-stone-800 border-stone-700 text-emerald-500 focus:ring-0"
                            />
                            <span className="font-mono font-bold text-emerald-400 text-xs w-8 text-center">
                              #{rule.sequence}
                            </span>
                            <div>
                              <span className="font-bold font-mono text-xs">{rule.code}</span>
                              <span className="text-stone-400 ml-2 font-normal text-[11px]">{rule.name}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-stone-800 border border-stone-700 uppercase">
                              {rule.category}
                            </span>
                          </div>

                          {isSelected && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={orderIndex === 0}
                                onClick={() => moveRule(orderIndex, -1)}
                                className="p-1 rounded text-stone-400 hover:text-white disabled:opacity-20"
                                title="Move Earlier"
                              >
                                <MoveUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={orderIndex === selectedRuleIds.length - 1}
                                onClick={() => moveRule(orderIndex, 1)}
                                className="p-1 rounded text-stone-400 hover:text-white disabled:opacity-20"
                                title="Move Later"
                              >
                                <MoveDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Informational Banner */}
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-blue-400" />
                <span>
                  Automatic dry-run validation will execute on save to verify zero forward/circular dependencies.
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
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
                  {submitting ? 'Validating & Saving...' : editingStructure ? 'Update Structure' : 'Create Structure'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
