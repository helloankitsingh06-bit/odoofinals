import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { orgService } from '../lib/orgService';
import { assetService } from '../lib/assetService';

export default function OrgSetup() {
  const { user } = useAuth();

  // Admin-only route gating
  if (user?.role !== 'Admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Active Tab State
  const [activeTab, setActiveTab] = useState('departments');

  // Loaded Data States
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [errorToast, setErrorToast] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Form States
  // 1. Departments Form
  const [deptName, setDeptName] = useState('');
  const [deptHead, setDeptHead] = useState('');
  const [deptParent, setDeptParent] = useState('');
  const [deptStatus, setDeptStatus] = useState('Active');
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [deptFormError, setDeptFormError] = useState('');

  // 2. Categories Form
  const [catName, setCatName] = useState('');
  const [extraFields, setExtraFields] = useState([]); // Array of { key, value }
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [catFormError, setCatFormError] = useState('');

  // 3. Employee Promotion state
  const [promotingEmployeeId, setPromotingEmployeeId] = useState(null);
  const [newRoleSelection, setNewRoleSelection] = useState('');

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptsData, empsData, catsData] = await Promise.all([
        orgService.listDepartments(),
        orgService.listEmployees(),
        assetService.listCategories()
      ]);
      setDepartments(deptsData);
      setEmployees(empsData);
      setCategories(catsData);
    } catch (err) {
      triggerError('Failed to load organization data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Utility to trigger error banner/toast
  const triggerError = (message) => {
    setErrorToast(message);
    setTimeout(() => setErrorToast(null), 5000);
  };

  // Utility to trigger success banner
  const triggerSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Departments Handlers
  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    setDeptFormError('');

    // Validation
    if (!deptName.trim()) {
      setDeptFormError('Department name is required');
      return;
    }

    setActionPending(true);
    try {
      const deptData = {
        name: deptName.trim(),
        head: deptHead,
        parentDept: deptParent,
        status: deptStatus
      };

      if (editingDeptId) {
        await orgService.updateDepartment(editingDeptId, deptData);
        triggerSuccess(`Department "${deptName}" updated successfully.`);
      } else {
        await orgService.createDepartment(deptData);
        triggerSuccess(`Department "${deptName}" created successfully.`);
      }

      // Reset form
      setDeptName('');
      setDeptHead('');
      setDeptParent('');
      setDeptStatus('Active');
      setEditingDeptId(null);

      // Refresh list
      await fetchData();
    } catch (err) {
      triggerError(err.message || 'Error saving department.');
    } finally {
      setActionPending(false);
    }
  };

  const handleEditDept = (dept) => {
    setEditingDeptId(dept.id);
    setDeptName(dept.name);
    setDeptHead(dept.head || '');
    setDeptParent(dept.parentDept || '');
    setDeptStatus(dept.status || 'Active');
    setDeptFormError('');
  };

  const handleToggleDeptStatus = async (deptId, currentStatus) => {
    setActionPending(true);
    try {
      const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      await orgService.updateDepartment(deptId, { status: nextStatus });
      triggerSuccess(`Department status updated to ${nextStatus}.`);
      await fetchData();
    } catch (err) {
      triggerError('Failed to change status.');
    } finally {
      setActionPending(false);
    }
  };

  // Categories Handlers
  const handleAddExtraField = (e) => {
    e.preventDefault();
    if (!newFieldKey.trim() || !newFieldValue.trim()) {
      return;
    }
    setExtraFields([...extraFields, { key: newFieldKey.trim(), value: newFieldValue.trim() }]);
    setNewFieldKey('');
    setNewFieldValue('');
  };

  const handleRemoveExtraField = (index) => {
    setExtraFields(extraFields.filter((_, idx) => idx !== index));
  };

  const handleCatSubmit = async (e) => {
    e.preventDefault();
    setCatFormError('');

    if (!catName.trim()) {
      setCatFormError('Category name is required');
      return;
    }

    setActionPending(true);
    try {
      const catData = {
        name: catName.trim(),
        extraFields: extraFields
      };

      await assetService.createCategory(catData);
      triggerSuccess(`Category "${catName}" created successfully.`);

      // Reset form
      setCatName('');
      setExtraFields([]);
      setNewFieldKey('');
      setNewFieldValue('');

      await fetchData();
    } catch (err) {
      triggerError(err.message || 'Error saving category.');
    } finally {
      setActionPending(false);
    }
  };

  // Employee Promotion Handlers
  const handlePromoteClick = (empId, currentRole) => {
    setPromotingEmployeeId(empId);
    setNewRoleSelection(currentRole === 'Employee' ? 'DeptHead' : 'Employee');
  };

  const handleConfirmPromotion = async (empId) => {
    if (!newRoleSelection) return;

    setActionPending(true);
    try {
      await orgService.promoteUser(empId, newRoleSelection);
      triggerSuccess(`User promoted to ${newRoleSelection} successfully.`);
      setPromotingEmployeeId(null);
      setNewRoleSelection('');
      await fetchData();
    } catch (err) {
      triggerError(err.message || 'Failed to promote user.');
    } finally {
      setActionPending(false);
    }
  };

  if (loading && departments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <span className="h-8 w-8 rounded-full border-4 border-stone-800 border-t-asset-green animate-spin"></span>
        <p className="text-sm text-stone-500 font-mono">LOADING SYSTEM REGISTRY...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification Messages */}
      {errorToast && (
        <div className="bg-red-950/20 border border-red-900/30 text-red-200 px-4 py-3 rounded-lg flex items-center justify-between text-sm transition-all animate-fadeIn backdrop-blur-md">
          <span>⚠️ {errorToast}</span>
          <button onClick={() => setErrorToast(null)} className="text-red-400 hover:text-red-100 font-bold">×</button>
        </div>
      )}

      {successMessage && (
        <div className="bg-white/[0.02] border border-glass-border text-emerald-450 px-4 py-3 rounded-lg flex items-center justify-between text-sm transition-all animate-fadeIn backdrop-blur-md shadow-accent-glow">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-450 shadow-accent-glow animate-pulse"></span>
            {successMessage}
          </span>
          <button onClick={() => setSuccessMessage(null)} className="text-stone-500 hover:text-stone-300 font-bold">×</button>
        </div>
      )}

      {/* Tabs Headers */}
      <div className="flex border-b border-glass-border">
        {['departments', 'categories', 'employees'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-emerald-500 text-asset-light bg-white/[0.02] drop-shadow-[0_0_8px_rgba(52,211,153,0.25)]'
                : 'border-transparent text-stone-500 hover:text-stone-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Active Tab View */}
      <div className="mt-6">
        {/* TAB 1: DEPARTMENTS */}
        {activeTab === 'departments' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create/Edit Form */}
            <div className="glass-panel p-6 space-y-4 border border-glass-border shadow-glass-glow">
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">
                {editingDeptId ? 'Edit Department' : 'Create Department'}
              </h3>
              
              <form onSubmit={handleDeptSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    placeholder="e.g. Engineering"
                    className="w-full h-10 bg-white/[0.03] border border-glass-border hover:border-white/20 rounded-md px-3 py-2 text-xs text-asset-light placeholder-stone-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:shadow-green-glow transition-all duration-150"
                  />
                  {deptFormError && <p className="text-[10px] text-red-500 mt-1">{deptFormError}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                    Department Head
                  </label>
                  <select
                    value={deptHead}
                    onChange={(e) => setDeptHead(e.target.value)}
                    className="w-full h-10 bg-white/[0.03] border border-glass-border hover:border-white/20 rounded-md px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:shadow-green-glow transition-all duration-150"
                  >
                    <option value="">-- Select Head --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.name}>{emp.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                    Parent Department
                  </label>
                  <select
                    value={deptParent}
                    onChange={(e) => setDeptParent(e.target.value)}
                    className="w-full h-10 bg-white/[0.03] border border-glass-border hover:border-white/20 rounded-md px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:shadow-green-glow transition-all duration-150"
                  >
                    <option value="">-- None --</option>
                    {departments
                      .filter(d => d.id !== editingDeptId) // Prevent circular inheritance
                      .map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))
                    }
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                    Status
                  </label>
                  <div className="flex gap-4 mt-2">
                    {['Active', 'Inactive'].map(s => (
                      <label key={s} className="inline-flex items-center gap-2 text-xs cursor-pointer text-stone-300">
                        <input
                          type="radio"
                          name="status"
                          value={s}
                          checked={deptStatus === s}
                          onChange={(e) => setDeptStatus(e.target.value)}
                          className="accent-emerald-500"
                        />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={actionPending}
                    className="flex-1 h-10 bg-asset-green/35 border border-emerald-500/25 hover:bg-asset-green/45 hover:border-emerald-500/40 text-asset-light font-bold text-xs uppercase rounded-md tracking-wider transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-green-glow disabled:opacity-50 flex items-center justify-center"
                  >
                    {editingDeptId ? 'Save Changes' : 'Create'}
                  </button>
                  {editingDeptId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDeptId(null);
                        setDeptName('');
                        setDeptHead('');
                        setDeptParent('');
                        setDeptStatus('Active');
                      }}
                      className="h-10 px-4 bg-white/[0.05] border border-glass-border hover:bg-white/10 text-stone-300 font-bold text-xs uppercase rounded-md transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/20 flex items-center justify-center"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
            
            {/* List Table */}
            <div className="lg:col-span-2 glass-panel p-6 space-y-4 border border-glass-border shadow-glass-glow">
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">
                Department Directory
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-glass-border text-stone-400 uppercase tracking-widest text-[10px]">
                      <th className="py-3.5 px-4 font-bold align-middle">Department</th>
                      <th className="py-3.5 px-4 font-bold align-middle">Head</th>
                      <th className="py-3.5 px-4 font-bold align-middle">Parent Dept</th>
                      <th className="py-3.5 px-4 font-bold text-center align-middle">Status</th>
                      <th className="py-3.5 px-4 font-bold text-right align-middle">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((dept) => (
                      <tr key={dept.id} className="border-b border-glass-border/40 hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 font-medium text-asset-light align-middle">{dept.name}</td>
                        <td className="py-3.5 px-4 text-stone-400 align-middle">{dept.head || '—'}</td>
                        <td className="py-3.5 px-4 text-stone-400 align-middle">{dept.parentDept || '—'}</td>
                        <td className="py-3.5 px-4 text-center align-middle">
                          <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase font-mono tracking-wider border ${
                            dept.status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]'
                              : 'bg-stone-900/30 text-stone-500 border-stone-800'
                          }`}>
                            {dept.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2 align-middle">
                          <button
                            onClick={() => handleEditDept(dept)}
                            className="text-stone-400 hover:text-asset-light transition-all duration-150 text-[11px] font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleDeptStatus(dept.id, dept.status)}
                            className={`text-[11px] font-semibold transition-all duration-150 ${
                              dept.status === 'Active' ? 'text-red-400 hover:text-red-300' : 'text-emerald-400 hover:text-emerald-350'
                            }`}
                          >
                            {dept.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {departments.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-stone-500 font-mono uppercase align-middle">
                          No departments configured
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CATEGORIES */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create/Edit Form */}
            <div className="glass-panel p-6 space-y-4 border border-glass-border shadow-glass-glow">
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">
                Add Category
              </h3>
              
              <form onSubmit={handleCatSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="e.g. Laptops, Chairs"
                    className="w-full h-10 bg-white/[0.03] border border-glass-border hover:border-white/20 rounded-md px-3 py-2 text-xs text-asset-light placeholder-stone-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:shadow-green-glow transition-all duration-150"
                  />
                  {catFormError && <p className="text-[10px] text-red-500 mt-1">{catFormError}</p>}
                </div>

                {/* Optional Key-Value extra fields */}
                <div className="space-y-2 border-t border-glass-border pt-3">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                    Additional Custom Fields
                  </span>
                  
                  {/* Fields list */}
                  {extraFields.map((field, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white/[0.02] border border-glass-border rounded-md px-3 py-1.5 text-xs">
                      <span className="text-stone-300 font-semibold">{field.key}:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-stone-400 font-mono">{field.value}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExtraField(idx)}
                          className="text-stone-500 hover:text-red-400 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add Field Sub-Form */}
                  <div className="space-y-2 bg-white/[0.01] border border-glass-border p-3 rounded-md">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Field Name (Key)"
                        value={newFieldKey}
                        onChange={(e) => setNewFieldKey(e.target.value)}
                        className="w-full h-10 bg-white/[0.03] border border-glass-border hover:border-white/20 rounded-md px-3 py-2 text-xs text-asset-light placeholder-stone-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:shadow-green-glow transition-all duration-150"
                      />
                      <input
                        type="text"
                        placeholder="Default Value"
                        value={newFieldValue}
                        onChange={(e) => setNewFieldValue(e.target.value)}
                        className="w-full h-10 bg-white/[0.03] border border-glass-border hover:border-white/20 rounded-md px-3 py-2 text-xs text-asset-light placeholder-stone-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:shadow-green-glow transition-all duration-150"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddExtraField}
                      className="w-full h-10 bg-white/[0.05] border border-glass-border hover:bg-white/10 text-stone-300 font-bold text-xs uppercase rounded-md transition-all duration-150 active:scale-[0.98] focus:outline-none flex items-center justify-center"
                    >
                      + Add Custom Field
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={actionPending}
                    className="w-full h-10 bg-asset-green/35 border border-emerald-500/25 hover:bg-asset-green/45 hover:border-emerald-500/40 text-asset-light font-bold text-xs uppercase rounded-md tracking-wider transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-green-glow disabled:opacity-50 flex items-center justify-center"
                  >
                    Save Category
                  </button>
                </div>
              </form>
            </div>

            {/* List Table */}
            <div className="lg:col-span-2 glass-panel p-6 space-y-4 border border-glass-border shadow-glass-glow">
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">
                Category Schema
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-glass-border text-stone-400 uppercase tracking-widest text-[10px]">
                      <th className="py-3.5 px-4 font-bold w-1/3 align-middle">Category</th>
                      <th className="py-3.5 px-4 font-bold align-middle">Custom Metadata Fields</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => (
                      <tr key={cat.id} className="border-b border-glass-border/40 hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 font-medium text-asset-light align-middle">{cat.name}</td>
                        <td className="py-3.5 px-4 text-stone-400 align-middle">
                          {cat.extraFields && cat.extraFields.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {cat.extraFields.map((field, idx) => (
                                <span key={idx} className="inline-block bg-white/5 px-2.5 py-1 rounded-md text-[10px] border border-glass-border text-stone-300 font-mono">
                                  <strong className="text-stone-500 font-sans">{field.key}:</strong> {field.value}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-stone-600 font-mono italic">None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {categories.length === 0 && (
                      <tr>
                        <td colSpan="2" className="py-8 text-center text-stone-500 font-mono uppercase align-middle">
                          No categories defined
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EMPLOYEE DIRECTORY */}
        {activeTab === 'employees' && (
          <div className="glass-panel p-6 space-y-4 border border-glass-border shadow-glass-glow">
            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">
              Employee Directory
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-glass-border text-stone-400 uppercase tracking-widest text-[10px]">
                    <th className="py-3.5 px-4 font-bold align-middle">Employee Name</th>
                    <th className="py-3.5 px-4 font-bold align-middle">Email</th>
                    <th className="py-3.5 px-4 font-bold align-middle">Current Department</th>
                    <th className="py-3.5 px-4 font-bold align-middle">Role System</th>
                    <th className="py-3.5 px-4 font-bold text-right align-middle">Access Controls</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b border-glass-border/40 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-medium text-asset-light align-middle">{emp.name}</td>
                      <td className="py-3.5 px-4 text-stone-400 align-middle">{emp.email}</td>
                      <td className="py-3.5 px-4 text-stone-400 align-middle">{emp.department || 'Unassigned'}</td>
                      <td className="py-3.5 px-4 align-middle">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase font-mono tracking-wider border ${
                          emp.role === 'Admin'
                            ? 'bg-white/5 text-emerald-400 border-emerald-500/20 shadow-accent-glow'
                            : emp.role === 'Employee'
                            ? 'text-stone-400 bg-white/5 border border-glass-border'
                            : 'bg-white/5 text-emerald-400 border-emerald-500/20 shadow-accent-glow'
                        }`}>
                          {emp.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right align-middle">
                        {promotingEmployeeId === emp.id ? (
                          <div className="inline-flex items-center gap-2 animate-fadeIn">
                            <select
                              value={newRoleSelection}
                              onChange={(e) => setNewRoleSelection(e.target.value)}
                              className="h-8 bg-white/[0.03] border border-glass-border hover:border-white/20 rounded-md px-2 py-1 text-xs text-asset-light focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:shadow-green-glow transition-all duration-150"
                            >
                              <option value="Employee">Employee</option>
                              <option value="DeptHead">DeptHead</option>
                              <option value="AssetManager">AssetManager</option>
                              <option value="Admin">Admin</option>
                            </select>
                            <button
                              onClick={() => handleConfirmPromotion(emp.id)}
                              disabled={actionPending}
                              className="bg-asset-green/35 border border-emerald-500/25 hover:bg-asset-green/45 hover:border-emerald-500/40 text-asset-light font-bold text-[10px] h-8 px-3 rounded-md transition-all duration-150 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center shadow-green-glow"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => {
                                setPromotingEmployeeId(null);
                                setNewRoleSelection('');
                              }}
                              className="bg-white/[0.05] border border-glass-border hover:bg-white/10 text-stone-400 font-bold text-[10px] h-8 px-3 rounded-md transition-all duration-150 active:scale-[0.98] flex items-center justify-center"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <button
                              onClick={() => handlePromoteClick(emp.id, emp.role)}
                              className="bg-white/[0.02] border border-glass-border hover:bg-white/5 hover:border-white/20 text-stone-300 font-bold text-[10px] h-8 px-3 rounded-md uppercase tracking-wider hover:text-asset-light transition-all duration-150 active:scale-[0.98] flex items-center justify-center"
                            >
                              Modify Role
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-stone-500 font-mono uppercase align-middle">
                        No employees found in directory
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
