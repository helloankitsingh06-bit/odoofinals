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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification Messages */}
      {errorToast && (
        <div className="bg-red-950/80 border border-red-900 text-red-200 px-4 py-3 rounded-lg flex items-center justify-between text-sm transition-all animate-fadeIn">
          <span>⚠️ {errorToast}</span>
          <button onClick={() => setErrorToast(null)} className="text-red-400 hover:text-red-100 font-bold">×</button>
        </div>
      )}

      {successMessage && (
        <div className="bg-stone-900 border border-asset-green text-asset-light px-4 py-3 rounded-lg flex items-center justify-between text-sm transition-all animate-fadeIn">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-asset-green"></span>
            {successMessage}
          </span>
          <button onClick={() => setSuccessMessage(null)} className="text-stone-500 hover:text-stone-300 font-bold">×</button>
        </div>
      )}

      {/* Tabs Headers */}
      <div className="flex border-b border-stone-850">
        {['departments', 'categories', 'employees'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-asset-green text-asset-light bg-stone-950/20'
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create/Edit Form */}
            <div className="bg-stone-950 border border-stone-850 p-6 rounded-lg space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-asset-light">
                {editingDeptId ? 'Edit Department' : 'Create Department'}
              </h3>
              
              <form onSubmit={handleDeptSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    placeholder="e.g. Engineering"
                    className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-asset-green transition-colors"
                  />
                  {deptFormError && <p className="text-[10px] text-red-500 mt-1">{deptFormError}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                    Department Head
                  </label>
                  <select
                    value={deptHead}
                    onChange={(e) => setDeptHead(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-asset-green transition-colors"
                  >
                    <option value="">-- Select Head --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.name}>{emp.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                    Parent Department
                  </label>
                  <select
                    value={deptParent}
                    onChange={(e) => setDeptParent(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-asset-green transition-colors"
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
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
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
                          className="accent-asset-green"
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
                    className="flex-1 bg-asset-green hover:bg-opacity-90 text-asset-light font-bold text-xs uppercase py-2.5 rounded tracking-wider transition-colors disabled:opacity-50"
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
                      className="bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs uppercase px-4 py-2.5 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List Table */}
            <div className="lg:col-span-2 bg-stone-950 border border-stone-850 p-6 rounded-lg space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-asset-light">
                Department Directory
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-850 text-stone-500 uppercase tracking-widest text-[10px]">
                      <th className="py-3 px-4 font-bold">Department</th>
                      <th className="py-3 px-4 font-bold">Head</th>
                      <th className="py-3 px-4 font-bold">Parent Dept</th>
                      <th className="py-3 px-4 font-bold text-center">Status</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((dept) => (
                      <tr key={dept.id} className="border-b border-stone-850 hover:bg-stone-900/20 transition-colors">
                        <td className="py-3 px-4 font-medium text-asset-light">{dept.name}</td>
                        <td className="py-3 px-4 text-stone-400">{dept.head || '—'}</td>
                        <td className="py-3 px-4 text-stone-400">{dept.parentDept || '—'}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            dept.status === 'Active'
                              ? 'bg-asset-green/10 text-asset-green border border-asset-green/20'
                              : 'bg-stone-900 text-stone-500 border border-stone-800'
                          }`}>
                            {dept.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleEditDept(dept)}
                            className="text-stone-400 hover:text-asset-light transition-colors text-[11px]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleDeptStatus(dept.id, dept.status)}
                            className={`text-[11px] transition-colors ${
                              dept.status === 'Active' ? 'text-red-400 hover:text-red-300' : 'text-asset-green hover:text-opacity-80'
                            }`}
                          >
                            {dept.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {departments.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-stone-500 font-mono uppercase">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create/Edit Form */}
            <div className="bg-stone-950 border border-stone-850 p-6 rounded-lg space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-asset-light">
                Add Category
              </h3>
              
              <form onSubmit={handleCatSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="e.g. Laptops, Chairs"
                    className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-asset-green transition-colors"
                  />
                  {catFormError && <p className="text-[10px] text-red-500 mt-1">{catFormError}</p>}
                </div>

                {/* Optional Key-Value extra fields */}
                <div className="space-y-2 border-t border-stone-850 pt-3">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Additional Custom Fields
                  </span>
                  
                  {/* Fields list */}
                  {extraFields.map((field, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-stone-900/50 border border-stone-800 rounded px-3 py-1.5 text-xs">
                      <span className="text-stone-300 font-semibold">{field.key}:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-stone-400">{field.value}</span>
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
                  <div className="space-y-2 bg-stone-900/20 border border-stone-850 p-3 rounded">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Field Name (Key)"
                        value={newFieldKey}
                        onChange={(e) => setNewFieldKey(e.target.value)}
                        className="bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-asset-light focus:outline-none focus:border-asset-green"
                      />
                      <input
                        type="text"
                        placeholder="Default Value"
                        value={newFieldValue}
                        onChange={(e) => setNewFieldValue(e.target.value)}
                        className="bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-asset-light focus:outline-none focus:border-asset-green"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddExtraField}
                      className="w-full bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-[10px] uppercase py-1.5 rounded transition-colors"
                    >
                      + Add Custom Field
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={actionPending}
                    className="w-full bg-asset-green hover:bg-opacity-90 text-asset-light font-bold text-xs uppercase py-2.5 rounded tracking-wider transition-colors disabled:opacity-50"
                  >
                    Save Category
                  </button>
                </div>
              </form>
            </div>

            {/* List Table */}
            <div className="lg:col-span-2 bg-stone-950 border border-stone-850 p-6 rounded-lg space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-asset-light">
                Category Schema
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-850 text-stone-500 uppercase tracking-widest text-[10px]">
                      <th className="py-3 px-4 font-bold w-1/3">Category</th>
                      <th className="py-3 px-4 font-bold">Custom Metadata Fields</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => (
                      <tr key={cat.id} className="border-b border-stone-850 hover:bg-stone-900/20 transition-colors">
                        <td className="py-3 px-4 font-medium text-asset-light">{cat.name}</td>
                        <td className="py-3 px-4 text-stone-400">
                          {cat.extraFields && cat.extraFields.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {cat.extraFields.map((field, idx) => (
                                <span key={idx} className="inline-block bg-stone-900 px-2 py-0.5 rounded text-[10px] border border-stone-800 text-stone-300">
                                  <strong className="text-stone-500">{field.key}:</strong> {field.value}
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
                        <td colSpan="2" className="py-8 text-center text-stone-500 font-mono uppercase">
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
          <div className="bg-stone-950 border border-stone-850 p-6 rounded-lg space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-asset-light">
              Employee Directory
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-850 text-stone-500 uppercase tracking-widest text-[10px]">
                    <th className="py-3 px-4 font-bold">Employee Name</th>
                    <th className="py-3 px-4 font-bold">Email</th>
                    <th className="py-3 px-4 font-bold">Current Department</th>
                    <th className="py-3 px-4 font-bold">Role System</th>
                    <th className="py-3 px-4 font-bold text-right">Access Controls</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b border-stone-850 hover:bg-stone-900/20 transition-colors">
                      <td className="py-3 px-4 font-medium text-asset-light">{emp.name}</td>
                      <td className="py-3 px-4 text-stone-400">{emp.email}</td>
                      <td className="py-3 px-4 text-stone-400">{emp.department || 'Unassigned'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          emp.role === 'Admin'
                            ? 'bg-asset-green/10 text-asset-light border border-asset-green/30'
                            : emp.role === 'Employee'
                            ? 'text-stone-400 bg-stone-900 border border-stone-800'
                            : 'bg-asset-green text-asset-light border border-transparent'
                        }`}>
                          {emp.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {promotingEmployeeId === emp.id ? (
                          <div className="inline-flex items-center gap-2 animate-fadeIn">
                            <select
                              value={newRoleSelection}
                              onChange={(e) => setNewRoleSelection(e.target.value)}
                              className="bg-stone-900 border border-stone-800 rounded px-2 py-1 text-xs text-asset-light focus:outline-none focus:border-asset-green"
                            >
                              <option value="Employee">Employee</option>
                              <option value="DeptHead">DeptHead</option>
                              <option value="AssetManager">AssetManager</option>
                              <option value="Admin">Admin</option>
                            </select>
                            <button
                              onClick={() => handleConfirmPromotion(emp.id)}
                              disabled={actionPending}
                              className="bg-asset-green hover:bg-opacity-90 text-asset-light font-bold text-[10px] px-2 py-1 rounded disabled:opacity-50"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => {
                                setPromotingEmployeeId(null);
                                setNewRoleSelection('');
                              }}
                              className="bg-stone-850 hover:bg-stone-800 text-stone-400 font-bold text-[10px] px-2 py-1 rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePromoteClick(emp.id, emp.role)}
                            className="bg-stone-900 hover:bg-stone-850 text-stone-300 font-bold border border-stone-800 text-[10px] px-3 py-1 rounded uppercase tracking-wider hover:text-asset-light transition-all"
                          >
                            Modify Role
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-stone-500 font-mono uppercase">
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
