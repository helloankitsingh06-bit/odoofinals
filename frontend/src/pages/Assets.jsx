import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetService, ASSET_STATUSES } from '../lib/assetService';
import { orgService } from '../lib/orgService';
import StatusBadge from '../components/StatusBadge';
import RegisterAssetModal from '../components/RegisterAssetModal';

/**
 * Assets page displays the list of registered assets with search and filtering.
 * It also hosts the RegisterAssetModal.
 */
export default function Assets() {
  const navigate = useNavigate();

  // Filter and search states
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [department, setDepartment] = useState('');

  // Dropdown options data states
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Asset list, loading and error states
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal display state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch dropdown collections on mount
  useEffect(() => {
    async function fetchDropdownData() {
      try {
        const [cats, depts] = await Promise.all([
          assetService.listCategories(),
          orgService.listDepartments()
        ]);
        setCategories(cats);
        setDepartments(depts);
      } catch (err) {
        console.error('Failed to load filter option lists:', err);
        setError('Failed to initialize filters.');
      }
    }
    fetchDropdownData();
  }, []);

  // Fetch assets whenever filters or search query change
  const fetchAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await assetService.listAssets({
        search,
        category,
        status,
        department
      });
      setAssets(data);
    } catch (err) {
      console.error('Failed to load assets:', err);
      setError('An error occurred while loading the assets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [search, category, status, department]);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Title/Action Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wider text-asset-light">Asset Directory</h2>
          <p className="text-xs text-stone-500 font-mono mt-0.5">REGISTER AND TRACK ENTERPRISE ASSETS</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-asset-green/35 border border-emerald-500/25 hover:bg-asset-green/45 hover:border-emerald-500/40 text-asset-light rounded px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-150 shadow-green-glow flex items-center gap-1.5 self-start md:self-auto active:scale-[0.98]"
        >
          <span>+ Register Asset</span>
        </button>
      </div>

      {/* Error State Banner */}
      {error && (
        <div className="bg-red-950/20 border border-red-900/30 text-red-200 px-4 py-3 rounded-lg flex items-center justify-between text-xs backdrop-blur-md">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-100 font-bold font-sans">×</button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="glass-panel p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 border border-glass-border shadow-glass-glow">
        {/* Search */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by tag, serial..."
            className="w-full bg-white/[0.03] border border-glass-border rounded px-3 py-1.5 text-xs text-asset-light focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:shadow-green-glow transition-all duration-150"
          />
        </div>

        {/* Category Dropdown */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-white/[0.03] border border-glass-border rounded px-3 py-1.5 text-xs text-asset-light focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:shadow-green-glow transition-all duration-150"
          >
            <option value="">All Categories</option>
            {categories.map((cat, index) => (
              <option key={cat._id || cat.id || `${cat.name}-${index}`} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Dropdown */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-white/[0.03] border border-glass-border rounded px-3 py-1.5 text-xs text-asset-light focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:shadow-green-glow transition-all duration-150"
          >
            <option value="">All Statuses</option>
            {ASSET_STATUSES.map((stat) => (
              <option key={stat} value={stat}>
                {stat}
              </option>
            ))}
          </select>
        </div>

        {/* Department Dropdown */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Department</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full bg-white/[0.03] border border-glass-border rounded px-3 py-1.5 text-xs text-asset-light focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:shadow-green-glow transition-all duration-150"
          >
            <option value="">All Departments</option>
            {departments.map((dept, index) => (
              <option key={dept._id || dept.id || `${dept.name}-${index}`} value={dept._id || dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area: Loading, Empty, or Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 glass-panel border border-glass-border shadow-glass-glow">
          <span className="h-6 w-6 rounded-full border-2 border-stone-850 border-t-emerald-500 animate-spin"></span>
          <p className="text-[10px] text-stone-500 font-mono tracking-wider uppercase">Loading Asset Registry...</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 glass-panel p-6 text-center border border-glass-border shadow-glass-glow">
          <p className="text-xs text-stone-400">No assets found. Register the first one.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-white/[0.02] border border-glass-border hover:bg-white/5 hover:border-white/20 text-stone-400 hover:text-asset-light rounded px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors mt-2"
          >
            Register Asset
          </button>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden border border-glass-border shadow-glass-glow">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-glass-border bg-white/[0.01]">
                  <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-stone-500">Tag</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-stone-500">Name</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-stone-500">Category</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-stone-500">Status</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-stone-500">Location</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset, index) => (
                  <tr
                    key={asset._id || asset.id || asset.assetTag || `${asset.name}-${index}`}
                    onClick={() => navigate(`/assets/${asset._id || asset.id}`)}
                    className="border-b border-glass-border/40 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 text-xs font-mono text-emerald-450 font-bold">{asset.assetTag || asset.tag || '—'}</td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-asset-light">{asset.name}</td>
                    <td className="py-3.5 px-4 text-xs text-stone-400">{asset.category?.name || asset.category || '—'}</td>
                    <td className="py-3.5 px-4 text-xs">
                      <StatusBadge status={asset.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-stone-400 font-mono">{asset.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      <RegisterAssetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchAssets}
      />
    </div>
  );
}
