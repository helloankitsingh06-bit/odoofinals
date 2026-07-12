import React, { useState, useEffect } from 'react';
import { assetService } from '../lib/assetService';

/**
 * RegisterAssetModal is a modal dialog that registers a new asset into the database.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is visible.
 * @param {Function} props.onClose - Callback function to close the modal.
 * @param {Function} props.onSuccess - Callback function called after successful asset registration.
 */
export default function RegisterAssetModal({ isOpen, onClose, onSuccess }) {

  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Form fields state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    serialNumber: '',
    acquisitionDate: '',
    acquisitionCost: '',
    condition: 'Good', // default value
    location: '',
    isShared: false,
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Fetch categories on mount to populate the category dropdown
  useEffect(() => {
    async function loadCategories() {
      try {
        setLoadingCats(true);
        const cats = await assetService.listCategories();
        setCategories(cats);
        if (cats.length > 0) {
          setFormData(prev => ({ ...prev, category: cats[0].name }));
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      } finally {
        setLoadingCats(false);
      }
    }
    loadCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear field-specific error when modified
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Asset name is required';
    if (!formData.category || formData.category === '__add_new__') newErrors.category = 'Category is required';
    if (!formData.serialNumber.trim()) newErrors.serialNumber = 'Serial number is required';
    if (!formData.acquisitionDate) newErrors.acquisitionDate = 'Acquisition date is required';
    
    const cost = Number(formData.acquisitionCost);
    if (formData.acquisitionCost === '' || isNaN(cost) || cost < 0) {
      newErrors.acquisitionCost = 'Acquisition cost must be a positive number';
    }
    
    if (!formData.condition) newErrors.condition = 'Condition is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setSubmitting(true);
    try {
      await assetService.registerAsset(formData);
      onSuccess();
      onClose();
    } catch (err) {
      setSubmitError(err.message || 'Failed to register asset.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCategory = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      setErrors(prev => ({ ...prev, category: 'Category name is required' }));
      return;
    }

    try {
      setCreatingCategory(true);
      const created = await assetService.createCategory({ name: trimmedName });
      setCategories(prev => [...prev, created]);
      setFormData(prev => ({ ...prev, category: created.name }));
      setNewCategoryName('');
      setErrors(prev => ({ ...prev, category: null }));
    } catch (err) {
      setErrors(prev => ({ ...prev, category: err.message || 'Unable to add category' }));
    } finally {
      setCreatingCategory(false);
    }
  };

  const conditions = ['New', 'Good', 'Fair', 'Poor'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-stone-950 border border-stone-850 rounded-lg max-w-lg w-full overflow-hidden shadow-2xl animate-fadeIn flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-850 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-asset-light">
            Register New Asset
          </h2>
          <button 
            onClick={onClose}
            className="text-stone-500 hover:text-stone-300 font-bold text-lg"
          >
            ×
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {submitError && (
            <div className="bg-red-950/80 border border-red-900 text-red-200 px-4 py-3 rounded text-xs">
              ⚠️ {submitError}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
              Asset Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. MacBook Pro M3"
              className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-asset-green transition-colors"
            />
            {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
              Category *
            </label>
            {loadingCats ? (
              <div className="text-stone-500 text-xs font-mono">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="text-amber-500 text-xs font-mono border border-amber-900/50 bg-amber-950/20 px-3 py-2 rounded">
                No categories available. Please configure them in Organization Setup first.
              </div>
            ) : (
              <>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-asset-green transition-colors"
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                  <option value="__add_new__">+ Add new category</option>
                </select>
                {formData.category === '__add_new__' && (
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="New category name"
                      className="flex-1 bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-asset-green transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      disabled={creatingCategory}
                      className="bg-asset-green hover:bg-opacity-90 text-asset-light rounded px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                      {creatingCategory ? 'Adding…' : 'Add Category'}
                    </button>
                  </div>
                )}
              </>
            )}
            {errors.category && <p className="text-[10px] text-red-500 mt-1">{errors.category}</p>}
            <p className="text-[10px] text-stone-500 mt-1">Preset options are available instantly, or you can add a custom category.</p>
          </div>

          {/* Serial Number */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
              Serial Number *
            </label>
            <input
              type="text"
              name="serialNumber"
              value={formData.serialNumber}
              onChange={handleChange}
              placeholder="e.g. C02X8123LVDG"
              className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-asset-green transition-colors"
            />
            {errors.serialNumber && <p className="text-[10px] text-red-500 mt-1">{errors.serialNumber}</p>}
          </div>

          {/* Grid for Acquisition Info */}
          <div className="grid grid-cols-2 gap-4">
            {/* Acquisition Date */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                Acquisition Date *
              </label>
              <input
                type="date"
                name="acquisitionDate"
                value={formData.acquisitionDate}
                onChange={handleChange}
                className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-asset-green transition-colors"
              />
              {errors.acquisitionDate && <p className="text-[10px] text-red-500 mt-1">{errors.acquisitionDate}</p>}
            </div>

            {/* Acquisition Cost */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                Acquisition Cost ($) *
              </label>
              <input
                type="number"
                name="acquisitionCost"
                value={formData.acquisitionCost}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-asset-green transition-colors"
              />
              {errors.acquisitionCost && <p className="text-[10px] text-red-500 mt-1">{errors.acquisitionCost}</p>}
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
              Condition *
            </label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-asset-green transition-colors"
            >
              {conditions.map(cond => (
                <option key={cond} value={cond}>
                  {cond}
                </option>
              ))}
            </select>
            {errors.condition && <p className="text-[10px] text-red-500 mt-1">{errors.condition}</p>}
          </div>

          {/* Location */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
              Location *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. HQ - Room 402"
              className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-asset-green transition-colors"
            />
            {errors.location && <p className="text-[10px] text-red-500 mt-1">{errors.location}</p>}
          </div>

          {/* Shared Checkbox */}
          <div className="flex items-center pt-2">
            <input
              type="checkbox"
              id="isShared"
              name="isShared"
              checked={formData.isShared}
              onChange={handleChange}
              className="h-4 w-4 rounded border-stone-800 bg-stone-900 text-asset-green focus:ring-0 focus:ring-offset-0 mr-2"
            />
            <label htmlFor="isShared" className="text-xs text-stone-300 font-medium select-none cursor-pointer">
              Mark as shared / bookable resource
            </label>
          </div>

          {/* Footer inside Form */}
          <div className="pt-4 border-t border-stone-850 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="border border-stone-800 hover:bg-stone-900 text-stone-400 hover:text-asset-light rounded px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-asset-green hover:bg-opacity-90 text-asset-light rounded px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 min-w-[120px]"
            >
              {submitting ? 'Registering…' : 'Register Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
