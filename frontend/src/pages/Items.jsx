import React, { useEffect, useState } from 'react';
import { itemService } from '../lib/itemService';

/**
 * Full-stack smoke test in one screen:
 *   auth (Bearer token) -> Express API -> Firestore -> back to the UI.
 *
 * Copy this page per domain entity once the problem statement is known.
 */
export default function Items() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadItems() {
    setLoading(true);
    setError('');
    try {
      setItems(await itemService.list());
    } catch (err) {
      setError(err.message || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await itemService.create({ name: name.trim(), description: description.trim() });
      setName('');
      setDescription('');
      await loadItems();
    } catch (err) {
      setError(err.message || 'Failed to create item');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(item) {
    setError('');
    try {
      await itemService.update(item.id, {
        status: item.status === 'active' ? 'archived' : 'active',
      });
      await loadItems();
    } catch (err) {
      setError(err.message || 'Failed to update item');
    }
  }

  async function handleDelete(id) {
    setError('');
    try {
      await itemService.remove(id);
      await loadItems();
    } catch (err) {
      setError(err.message || 'Failed to delete item');
    }
  }

  return (
    <div className="p-8 space-y-8 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-asset-light">Items</h2>
        <p className="text-sm text-stone-400">
          Generic CRUD example — copy this page and its service for a real entity.
        </p>
      </div>

      {error && (
        <div className="bg-red-950/20 border border-red-900/30 text-red-200 px-4 py-2.5 rounded-md text-xs font-mono">
          ⚠️ {error}
        </div>
      )}

      {/* Create form */}
      <form onSubmit={handleCreate} className="glass-panel p-5 space-y-4">
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
            Name *
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name"
            className="w-full h-10 bg-white/[0.03] border border-glass-border rounded-md px-3.5 text-xs text-asset-light placeholder-stone-600 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
            Description
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            className="w-full h-10 bg-white/[0.03] border border-glass-border rounded-md px-3.5 text-xs text-asset-light placeholder-stone-600 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="h-10 px-5 bg-[#1e3427]/80 hover:bg-[#254231] text-[#76c893] border border-[#2d523c]/60 rounded-md font-bold text-xs uppercase tracking-[0.15em] transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Add Item'}
        </button>
      </form>

      {/* List */}
      <div className="glass-panel p-5">
        {loading ? (
          <p className="text-xs text-stone-500 font-mono">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-stone-500 font-mono">No items yet.</p>
        ) : (
          <ul className="divide-y divide-glass-border">
            {items.map((item) => (
              <li key={item.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-asset-light truncate">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-stone-500 truncate">{item.description}</p>
                  )}
                  <p className="text-[10px] text-stone-600 font-mono mt-1">
                    {item.status} · created {item.createdAt}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleStatus(item)}
                    className="h-8 px-3 border border-glass-border rounded-md text-[10px] font-bold uppercase tracking-wider text-stone-400 hover:text-asset-light hover:bg-white/5"
                  >
                    {item.status === 'active' ? 'Archive' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="h-8 px-3 border border-red-900/40 rounded-md text-[10px] font-bold uppercase tracking-wider text-red-300 hover:bg-red-950/30"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
