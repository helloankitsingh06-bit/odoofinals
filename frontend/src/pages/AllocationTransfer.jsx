import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { assetService } from '../lib/assetService';
import { orgService } from '../lib/orgService';
import { allocationService } from '../lib/allocationService';
import StatusBadge from '../components/StatusBadge';

/**
 * AllocationTransfer page allows users to assign assets to employees,
 * request transfers, approve pending transfers, and mark assets as returned.
 */
export default function AllocationTransfer() {
  const { user: currentUser } = useAuth();

  // Core options list states
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [initialError, setInitialError] = useState(null);

  // Selected asset detail states
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [activeAllocation, setActiveAllocation] = useState(null);
  const [pendingTransfer, setPendingTransfer] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  // Action status / banner states
  const [actionPending, setActionPending] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }

  // Form states
  // 1. Allocation Form
  const [allocateEmployeeId, setAllocateEmployeeId] = useState('');
  const [allocateDepartmentId, setAllocateDepartmentId] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [allocFormError, setAllocFormError] = useState('');

  // 2. Transfer Form
  const [transferToUserId, setTransferToUserId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferFormError, setTransferFormError] = useState('');

  // 3. Return Form
  const [returnNotes, setReturnNotes] = useState('');
  const [returnFormError, setReturnFormError] = useState('');

  // Load basic option data lists on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoadingInitial(true);
        const [assetList, empList, deptList] = await Promise.all([
          assetService.listAssets(),
          orgService.listEmployees(),
          orgService.listDepartments()
        ]);
        setAssets(assetList);
        setEmployees(empList);
        setDepartments(deptList);
      } catch (err) {
        console.error('Failed to load initial data:', err);
        setInitialError('Failed to load dropdown option lists.');
      } finally {
        setLoadingInitial(false);
      }
    }
    loadInitialData();
  }, []);

  // Reload selected asset details
  const refreshDetails = async (assetId) => {
    if (!assetId) {
      setSelectedAsset(null);
      setActiveAllocation(null);
      setPendingTransfer(null);
      setHistory([]);
      return;
    }

    setLoadingDetails(true);
    setDetailsError(null);
    try {
      const [asset, alloc, trans, hist] = await Promise.all([
        assetService.getAssetById(assetId),
        allocationService.getActiveAllocationForAsset(assetId),
        allocationService.getPendingTransferForAsset(assetId),
        allocationService.getAllocationHistory(assetId)
      ]);
      setSelectedAsset(asset);
      setActiveAllocation(alloc);
      setPendingTransfer(trans);
      setHistory(hist);

      // Default the allocation forms when changing assets
      if (empListExcluding(alloc?.employeeId).length > 0) {
        setTransferToUserId(empListExcluding(alloc?.employeeId)[0].id);
      }
    } catch (err) {
      console.error('Failed to load asset details:', err);
      setDetailsError('Failed to load asset details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAssetSelectChange = (e) => {
    const assetId = e.target.value;
    setSelectedAssetId(assetId);
    refreshDetails(assetId);
    // Reset forms
    setAllocateEmployeeId(employees[0]?._id || employees[0]?.id || '');
    setAllocateDepartmentId(departments[0]?._id || departments[0]?.id || '');
    setExpectedReturnDate('');
    setTransferReason('');
    setReturnNotes('');
    setAllocFormError('');
    setTransferFormError('');
    setReturnFormError('');
    setToast(null);
  };

  const triggerToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // Helper lists
  const empListExcluding = (excludeId) => {
    return employees.filter(emp => (emp._id || emp.id) !== excludeId);
  };

  const getEmployeeName = (id) => {
    const emp = employees.find(e => (e._id || e.id) === id);
    return emp ? emp.name : id;
  };

  const getDepartmentName = (id) => {
    const dept = departments.find(d => (d._id || d.id) === id || d.name === id);
    return dept ? dept.name : id;
  };

  // Submit allocation handler
  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    setAllocFormError('');

    if (!allocateEmployeeId && !allocateDepartmentId) {
      setAllocFormError('Employee or department selection is required');
      return;
    }

    setActionPending(true);
    try {
      await allocationService.allocateAsset(
        selectedAssetId,
        allocateEmployeeId,
        allocateDepartmentId,
        expectedReturnDate
      );
      triggerToast('success', 'Asset allocated successfully!');
      // Refresh list to update status in dropdown
      const updatedAssets = await assetService.listAssets();
      setAssets(updatedAssets);
      // Refresh details
      await refreshDetails(selectedAssetId);
    } catch (err) {
      if (err.status === 409 && err.payload?.error === 'ASSET_ALREADY_ALLOCATED') {
        triggerToast('error', `Currently held by ${err.payload.currentHolder?.name || 'another user'}`);
      } else {
        triggerToast('error', err.message || 'Failed to allocate asset');
      }
    } finally {
      setActionPending(false);
    }
  };

  // Submit transfer request handler
  const handleTransferRequestSubmit = async (e) => {
    e.preventDefault();
    setTransferFormError('');

    if (!transferToUserId) {
      setTransferFormError('Recipient employee selection is required');
      return;
    }
    if (!transferReason || !transferReason.trim()) {
      setTransferFormError('Transfer reason is required');
      return;
    }

    setActionPending(true);
    try {
      await allocationService.requestTransfer(
        selectedAssetId,
        activeAllocation.employeeId,
        transferToUserId,
        currentUser.uid,
        transferReason
      );
      triggerToast('success', 'Transfer request submitted!');
      setTransferReason('');
      await refreshDetails(selectedAssetId);
    } catch (err) {
      triggerToast('error', err.message || 'Failed to submit transfer request');
    } finally {
      setActionPending(false);
    }
  };

  // Approve transfer handler
  const handleApproveTransfer = async () => {
    if (!pendingTransfer) return;
    setActionPending(true);
    try {
      await allocationService.approveTransfer(pendingTransfer.id);
      triggerToast('success', 'Transfer approved and asset reallocated!');
      // Refresh assets for dropdown status
      const updatedAssets = await assetService.listAssets();
      setAssets(updatedAssets);
      await refreshDetails(selectedAssetId);
    } catch (err) {
      triggerToast('error', err.message || 'Failed to approve transfer');
    } finally {
      setActionPending(false);
    }
  };

  // Return asset handler
  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    setReturnFormError('');

    if (!returnNotes || !returnNotes.trim()) {
      setReturnFormError('Condition notes are required to process returns');
      return;
    }

    setActionPending(true);
    try {
      await allocationService.returnAsset(selectedAssetId, returnNotes);
      triggerToast('success', 'Asset returned successfully!');
      setReturnNotes('');
      // Refresh assets for dropdown status
      const updatedAssets = await assetService.listAssets();
      setAssets(updatedAssets);
      await refreshDetails(selectedAssetId);
    } catch (err) {
      triggerToast('error', err.message || 'Failed to process return');
    } finally {
      setActionPending(false);
    }
  };

  const canApprove = currentUser?.role === 'AssetManager' || currentUser?.role === 'DeptHead';

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold uppercase tracking-wider text-asset-light">Allocation & Transfer</h2>
        <p className="text-xs text-stone-500 font-mono mt-0.5">MANAGE ASSET ASSIGNMENTS AND HANDOVERS</p>
      </div>

      {/* Global notifications */}
      {initialError && (
        <div className="bg-red-950/20 border border-red-900/30 text-red-200 px-4 py-3 rounded-lg text-xs backdrop-blur-md">
          ⚠️ {initialError}
        </div>
      )}

      {toast && (
        <div className={`border px-4 py-3 rounded-lg flex items-center justify-between text-xs transition-all animate-fadeIn backdrop-blur-md ${
          toast.type === 'success' 
            ? 'bg-white/[0.02] border-glass-border text-emerald-400 shadow-accent-glow' 
            : 'bg-red-950/20 border-red-900/30 text-red-200'
        }`}>
          <span className="flex items-center gap-2">
            {toast.type === 'success' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-450 shadow-accent-glow animate-pulse"></span>}
            {toast.message}
          </span>
          <button onClick={() => setToast(null)} className="font-bold">×</button>
        </div>
      )}

      {/* Asset Picker Section */}
      <div className="glass-panel p-6 space-y-4 border border-glass-border shadow-glass-glow">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
            Select Asset to Manage *
          </label>
          {loadingInitial ? (
            <div className="text-stone-500 text-xs font-mono">LOADING REGISTRY...</div>
          ) : assets.length === 0 ? (
            <div className="text-amber-500 text-xs font-mono border border-amber-900/50 bg-amber-950/20 px-3 py-2 rounded">
              No assets available in system registry. Please register an asset first.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <select
                value={selectedAssetId}
                onChange={handleAssetSelectChange}
                className="w-full sm:flex-1 bg-white/[0.03] border border-glass-border rounded px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:shadow-green-glow transition-all duration-150"
              >
                <option value="">-- Choose an Asset --</option>
                {assets.map((asset, index) => (
                  <option key={asset.id || asset._id || `${asset.name}-${index}`} value={asset.id || asset._id || ''}>
                    {asset.tag || asset.assetTag || '—'} - {asset.name} ({asset.status})
                  </option>
                ))}
              </select>
              {selectedAsset && (
                <div className="shrink-0">
                  <StatusBadge status={selectedAsset.status} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Workspace Grid */}
      {selectedAssetId && (
        loadingDetails ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 glass-panel border border-glass-border shadow-glass-glow">
            <span className="h-6 w-6 rounded-full border-2 border-stone-850 border-t-emerald-500 animate-spin"></span>
            <p className="text-[10px] text-stone-500 font-mono tracking-wider uppercase">Loading asset details...</p>
          </div>
        ) : detailsError ? (
          <div className="bg-red-950/20 border border-red-900/30 text-red-200 px-4 py-3 rounded-lg text-xs backdrop-blur-md">
            ⚠️ {detailsError}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Forms Section: Allocation or Transfer Forms (Spans 2 columns) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Conflict State (Currently Allocated) */}
              {selectedAsset.status === 'Allocated' && (
                <div className="space-y-6">
                  {/* Warning Banner */}
                  <div className="bg-red-950/20 border border-red-900/30 text-red-200 p-4 rounded-lg text-xs leading-relaxed backdrop-blur-md">
                    Already allocated to <strong className="text-white">{activeAllocation ? getEmployeeName(activeAllocation.employeeId) : 'Unknown'}</strong> ({activeAllocation ? getDepartmentName(activeAllocation.departmentId) : 'Unknown'}). Direct re-allocation is blocked — submit a transfer request below.
                  </div>

                  {/* Pending Transfer Notice & Approval */}
                  {pendingTransfer ? (
                    <div className="bg-white/[0.01] border border-glass-border shadow-glass-glow p-4 rounded-lg text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider mb-1 shadow-[0_0_8px_rgba(245,158,11,0.1)]">
                          Transfer Pending
                        </span>
                        <p className="text-stone-300">
                          Transfer requested from <strong>{pendingTransfer.fromHolder?.name || pendingTransfer.fromHolder || 'Unknown'}</strong> to <strong>{pendingTransfer.toHolder?.name || pendingTransfer.toHolder || 'Unknown'}</strong>.
                        </p>
                        {pendingTransfer.reason ? (
                          <p className="text-stone-500 font-mono text-[10px]">Reason: "{pendingTransfer.reason}"</p>
                        ) : null}
                      </div>

                      {/* Approval flow */}
                      <div className="shrink-0">
                        {canApprove ? (
                          <button
                            onClick={handleApproveTransfer}
                            disabled={actionPending}
                            className="bg-asset-green/35 border border-emerald-500/25 hover:bg-asset-green/45 hover:border-emerald-500/40 text-asset-light rounded px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-green-glow disabled:opacity-50"
                          >
                            {actionPending ? 'Approving…' : 'Approve Transfer'}
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                            Awaiting Manager Approval
                          </span>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {/* Transfer Request Form (Only if no pending request already exists) */}
                  {!pendingTransfer && (
                    <div className="glass-panel p-6 space-y-4 border border-glass-border shadow-glass-glow">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-asset-light">Submit Transfer Request</h3>
                      
                      <form onSubmit={handleTransferRequestSubmit} className="space-y-4">
                        {/* From (Read-only Current Holder) */}
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">From (Current Holder)</label>
                          <input
                            type="text"
                            value={activeAllocation ? `${getEmployeeName(activeAllocation.employeeId)} (${getDepartmentName(activeAllocation.departmentId)})` : 'Unknown'}
                            disabled
                            className="w-full bg-white/[0.01] border border-glass-border/30 rounded px-3 py-2 text-xs text-stone-500 focus:outline-none"
                          />
                        </div>

                        {/* To (Dropdown of other employees) */}
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">To (New Holder) *</label>
                          {empListExcluding(activeAllocation?.employeeId).length === 0 ? (
                            <div className="text-stone-500 text-xs font-mono">No other employees available in directory to transfer to.</div>
                          ) : (
                            <select
                              value={transferToUserId}
                              onChange={(e) => setTransferToUserId(e.target.value)}
                              className="w-full bg-white/[0.03] border border-glass-border rounded px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:shadow-green-glow transition-all duration-150"
                            >
                              {empListExcluding(activeAllocation?.employeeId).map((emp) => (
                                <option key={emp._id || emp.id} value={emp._id || emp.id}>
                                  {emp.name} ({emp.department})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        {/* Reason */}
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Reason for Transfer *</label>
                          <textarea
                            value={transferReason}
                            onChange={(e) => setTransferReason(e.target.value)}
                            placeholder="State the reason for this handover..."
                            rows="3"
                            className="w-full bg-white/[0.03] border border-glass-border rounded px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:shadow-green-glow transition-all duration-150"
                          />
                          {transferFormError && <p className="text-[10px] text-red-500 mt-1">{transferFormError}</p>}
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={actionPending || empListExcluding(activeAllocation?.employeeId).length === 0}
                          className="w-full bg-asset-green/35 border border-emerald-500/25 hover:bg-asset-green/45 hover:border-emerald-500/40 text-asset-light rounded py-2 text-xs font-bold uppercase tracking-wider transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-green-glow disabled:opacity-50"
                        >
                          {actionPending ? 'Submitting…' : 'Submit Transfer Request'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* No Conflict State (Currently Available) */}
              {selectedAsset.status === 'Available' && (
                <div className="glass-panel p-6 space-y-4 border border-glass-border shadow-glass-glow">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-asset-light">Allocate Asset</h3>
                  
                  <form onSubmit={handleAllocateSubmit} className="space-y-4">
                    {/* Employee picker */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Assign to Employee *</label>
                      {employees.length === 0 ? (
                        <div className="text-stone-500 text-xs font-mono">No employees found. Please configure them in setup.</div>
                      ) : (
                        <select
                          value={allocateEmployeeId}
                          onChange={(e) => setAllocateEmployeeId(e.target.value)}
                          className="w-full bg-white/[0.03] border border-glass-border rounded px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:shadow-green-glow transition-all duration-150"
                        >
                          <option value="">-- Choose Employee --</option>
                          {employees.map((emp) => (
                            <option key={emp._id || emp.id} value={emp._id || emp.id}>
                              {emp.name} ({emp.department})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Department picker */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Cost Center / Department *</label>
                      {departments.length === 0 ? (
                        <div className="text-stone-500 text-xs font-mono">No departments configured.</div>
                      ) : (
                        <select
                          value={allocateDepartmentId}
                          onChange={(e) => setAllocateDepartmentId(e.target.value)}
                          className="w-full bg-white/[0.03] border border-glass-border rounded px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:shadow-green-glow transition-all duration-150"
                        >
                          <option value="">-- Choose Department --</option>
                          {departments.map((dept) => (
                            <option key={dept._id || dept.id} value={dept._id || dept.id}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Return Date */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Expected Return Date (Optional)</label>
                      <input
                        type="date"
                        value={expectedReturnDate}
                        onChange={(e) => setExpectedReturnDate(e.target.value)}
                        className="w-full bg-white/[0.03] border border-glass-border rounded px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:shadow-green-glow transition-all duration-150"
                      />
                      {allocFormError && <p className="text-[10px] text-red-500 mt-1">{allocFormError}</p>}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={actionPending || employees.length === 0}
                      className="w-full bg-asset-green/35 border border-emerald-500/25 hover:bg-asset-green/45 hover:border-emerald-500/40 text-asset-light rounded py-2 text-xs font-bold uppercase tracking-wider transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-green-glow disabled:opacity-50"
                    >
                      {actionPending ? 'Allocating…' : 'Allocate Asset'}
                    </button>
                  </form>
                </div>
              )}

              {/* Notice for other statuses (e.g. Lost, Under Maintenance) */}
              {selectedAsset.status !== 'Available' && selectedAsset.status !== 'Allocated' && (
                <div className="glass-panel p-6 text-center text-xs text-stone-400 border border-glass-border shadow-glass-glow">
                  ⚠️ This asset is currently <strong>{selectedAsset.status}</strong> and cannot be allocated or transferred.
                </div>
              )}
            </div>

            {/* Sidebar Column: Return flow & Allocation History */}
            <div className="space-y-6">
              
              {/* Return Form (Only visible when Allocated) */}
              {selectedAsset.status === 'Allocated' && (
                <div className="glass-panel p-6 space-y-4 border border-glass-border shadow-glass-glow">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-asset-light">Mark Returned</h3>
                  
                  <form onSubmit={handleReturnSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Condition Notes *</label>
                      <textarea
                        value={returnNotes}
                        onChange={(e) => setReturnNotes(e.target.value)}
                        placeholder="e.g. Returned with normal wear, no display scratches."
                        rows="3"
                        className="w-full bg-white/[0.03] border border-glass-border rounded px-3 py-2 text-xs text-asset-light focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:shadow-green-glow transition-all duration-150"
                      />
                      {returnFormError && <p className="text-[10px] text-red-500 mt-1">{returnFormError}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={actionPending}
                      className="w-full bg-white/[0.05] border border-glass-border hover:bg-white/10 text-stone-300 hover:text-asset-light rounded py-2 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                      {actionPending ? 'Processing…' : 'Return Asset'}
                    </button>
                  </form>
                </div>
              )}

              {/* History Section */}
              <div className="glass-panel p-6 space-y-4 border border-glass-border shadow-glass-glow">
                <h3 className="text-sm font-bold uppercase tracking-wider text-asset-light">Allocation History</h3>
                
                {history.length === 0 ? (
                  <p className="text-xs text-stone-500 font-mono uppercase">No history records found</p>
                ) : (
                  <ul className="space-y-4">
                    {history.map((evt, idx) => (
                      <li key={idx} className="border-l-2 border-glass-border/40 pl-3 py-0.5 text-xs text-stone-300 font-sans">
                        <div className="text-[9px] text-stone-500 font-bold uppercase font-mono">{evt.date}</div>
                        <div className="mt-0.5 leading-snug">{evt.description}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
