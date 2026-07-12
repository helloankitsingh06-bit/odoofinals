import { assetService } from './assetService';
import { orgService } from './orgService';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory data store for prototyping (resets on page reload)
let allocations = [];
let transfers = [];

export const allocationService = {
  async allocateAsset(assetId, employeeId, departmentId, expectedReturnDate) {
    await delay(300);

    const asset = await assetService.getAssetById(assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    if (asset.status === 'Allocated') {
      // Find the active allocation record to get the holder name
      const activeAlloc = allocations.find(a => a.assetId === assetId && a.status === 'Active');
      if (activeAlloc) {
        const employees = await orgService.listEmployees();
        const depts = await orgService.listDepartments();
        const emp = employees.find(e => e.id === activeAlloc.employeeId);
        const dept = depts.find(d => d.id === activeAlloc.departmentId || d.name === activeAlloc.departmentId);
        const empName = emp ? emp.name : 'Unknown';
        const deptName = dept ? dept.name : 'Unknown';
        throw new Error(`Already allocated to ${empName} (${deptName})`);
      } else {
        throw new Error('Already allocated');
      }
    }

    const newAllocation = {
      id: `alloc-${Date.now()}`,
      assetId,
      employeeId,
      departmentId,
      allocatedDate: new Date().toISOString().split('T')[0],
      returnedDate: null,
      conditionNotes: null,
      expectedReturnDate: expectedReturnDate || null,
      status: 'Active'
    };

    allocations.push(newAllocation);
    await assetService.updateAssetStatus(assetId, 'Allocated');
    return newAllocation;
  },

  async requestTransfer(assetId, fromUserId, toUserId, requestedByUserId, reason) {
    await delay(300);

    if (!assetId || !fromUserId || !toUserId || !requestedByUserId || !reason || !reason.trim()) {
      throw new Error('All fields including reason are required for a transfer request');
    }

    const newTransfer = {
      id: `trans-${Date.now()}`,
      assetId,
      fromUserId,
      toUserId,
      requestedByUserId,
      reason: reason.trim(),
      status: 'Requested',
      requestedDate: new Date().toISOString().split('T')[0]
    };

    transfers.push(newTransfer);
    return newTransfer;
  },

  async approveTransfer(transferId) {
    await delay(300);

    const transfer = transfers.find(t => t.id === transferId);
    if (!transfer) {
      throw new Error('Transfer request not found');
    }

    transfer.status = 'Approved';

    // Close the current active allocation
    const activeAlloc = allocations.find(a => a.assetId === transfer.assetId && a.status === 'Active');
    if (activeAlloc) {
      activeAlloc.status = 'Returned';
      activeAlloc.returnedDate = new Date().toISOString().split('T')[0];
      activeAlloc.conditionNotes = 'Transferred to another user';
    }

    // Lookup new holder's department
    const employees = await orgService.listEmployees();
    const toEmp = employees.find(e => e.id === transfer.toUserId);
    const toDept = toEmp ? toEmp.department : '';

    const depts = await orgService.listDepartments();
    const deptObj = depts.find(d => d.name === toDept || d.id === toDept);
    const departmentId = deptObj ? deptObj.id : toDept;

    // Create a new allocation record
    const newAllocation = {
      id: `alloc-${Date.now()}`,
      assetId: transfer.assetId,
      employeeId: transfer.toUserId,
      departmentId: departmentId,
      allocatedDate: new Date().toISOString().split('T')[0],
      returnedDate: null,
      conditionNotes: null,
      expectedReturnDate: null,
      status: 'Active'
    };

    allocations.push(newAllocation);
    await assetService.updateAssetStatus(transfer.assetId, 'Allocated');
    return transfer;
  },

  async getAllocationHistory(assetId) {
    await delay(300);

    const employees = await orgService.listEmployees();
    const depts = await orgService.listDepartments();

    const events = [];
    const assetAllocs = allocations.filter(a => a.assetId === assetId);

    for (const alloc of assetAllocs) {
      const emp = employees.find(e => e.id === alloc.employeeId);
      const dept = depts.find(d => d.id === alloc.departmentId || d.name === alloc.departmentId);
      const empName = emp ? emp.name : 'Unknown';
      const deptName = dept ? dept.name : 'Unknown';

      events.push({
        date: alloc.allocatedDate,
        description: `Allocated to ${empName} - ${deptName}`
      });

      if (alloc.returnedDate) {
        events.push({
          date: alloc.returnedDate,
          description: `Returned by ${empName} - condition: ${alloc.conditionNotes || 'none'}`
        });
      }
    }

    // Sort by date descending
    events.sort((a, b) => b.date.localeCompare(a.date));
    return events;
  },

  async returnAsset(assetId, conditionNotes) {
    await delay(300);

    if (!conditionNotes || !conditionNotes.trim()) {
      throw new Error('Condition notes are required');
    }

    const activeAlloc = allocations.find(a => a.assetId === assetId && a.status === 'Active');
    if (!activeAlloc) {
      throw new Error('No active allocation found for this asset');
    }

    activeAlloc.status = 'Returned';
    activeAlloc.returnedDate = new Date().toISOString().split('T')[0];
    activeAlloc.conditionNotes = conditionNotes.trim();

    await assetService.updateAssetStatus(assetId, 'Available');
  },

  // Helper to fetch any pending transfer for a specific asset
  async getPendingTransferForAsset(assetId) {
    await delay(300);
    return transfers.find(t => t.assetId === assetId && t.status === 'Requested') || null;
  },

  // Helper to get active allocation for an asset
  async getActiveAllocationForAsset(assetId) {
    await delay(300);
    return allocations.find(a => a.assetId === assetId && a.status === 'Active') || null;
  }
};
