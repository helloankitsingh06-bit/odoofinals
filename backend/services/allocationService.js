const Allocation = require('../models/Allocation');
const TransferRequest = require('../models/TransferRequest');
const Asset = require('../models/Asset');
const AssetStatusLog = require('../models/AssetStatusLog');
const Employee = require('../models/Employee');
const Department = require('../models/Department');

async function getAllocations(query = {}) {
  const filter = {};
  if (query.asset) filter.asset = query.asset;
  if (query.employee) filter.employee = query.employee;
  if (query.department) filter.department = query.department;
  if (query.status) filter.status = query.status;

  return Allocation.find(filter)
    .populate('asset')
    .populate('employee')
    .populate('department')
    .populate('allocatedBy')
    .sort({ allocatedDate: -1 });
}

async function getOverdueAllocations() {
  const now = new Date();
  return Allocation.find({ status: 'Active', expectedReturnDate: { $lt: now } })
    .populate('asset')
    .populate('employee')
    .populate('department')
    .sort({ expectedReturnDate: 1 });
}

async function createAllocation(data, actor) {
  if (!data.employee && !data.department) {
    const err = new Error('Either employee or department is required for an allocation');
    err.statusCode = 400;
    throw err;
  }

  let asset;
  try {
    asset = await Asset.findById(data.asset);
  } catch (e) {
    const err = new Error('Invalid Asset ID');
    err.statusCode = 400;
    throw err;
  }

  if (!asset) {
    const err = new Error('Asset not found');
    err.statusCode = 404;
    throw err;
  }

  if (asset.status !== 'Available') {
    const currentHolder = await Employee.findById(asset.currentHolder).lean();
    const error = {
      error: 'ASSET_ALREADY_ALLOCATED',
      currentHolder: currentHolder ? { id: currentHolder._id.toString(), name: currentHolder.name } : null,
      allowTransferRequest: true
    };
    const err = new Error('Asset already allocated');
    err.statusCode = 409;
    err.payload = error;
    throw err;
  }

  const allocation = await Allocation.create({
    asset: asset._id,
    employee: data.employee || undefined,
    department: data.department || undefined,
    expectedReturnDate: data.expectedReturnDate || undefined,
    conditionAtCheckout: data.conditionAtCheckout,
    allocatedBy: actor?.id || undefined,
    status: 'Active'
  });

  asset.status = 'Allocated';
  asset.currentHolder = data.employee || undefined;
  await asset.save();

  await AssetStatusLog.create({
    asset: asset._id,
    fromStatus: 'Available',
    toStatus: 'Allocated',
    changedBy: actor?.id || undefined,
    reason: 'Allocated'
  });

  return allocation;
}

async function returnAllocation(id, payload, actor) {
  const allocation = await Allocation.findById(id);
  if (!allocation) throw new Error('Allocation not found');

  allocation.actualReturnDate = new Date();
  allocation.conditionAtCheckin = payload.conditionAtCheckin;
  allocation.checkinNotes = payload.checkinNotes;
  allocation.status = 'Returned';
  await allocation.save();

  const asset = await Asset.findById(allocation.asset);
  if (asset) {
    asset.status = 'Available';
    asset.currentHolder = undefined;
    await asset.save();
  }

  await AssetStatusLog.create({
    asset: allocation.asset,
    fromStatus: 'Allocated',
    toStatus: 'Available',
    changedBy: actor?.id || undefined,
    reason: 'Returned'
  });

  return allocation;
}

async function createTransferRequest(data, actor) {
  const asset = await Asset.findById(data.asset);
  if (!asset) throw new Error('Asset not found');

  const existing = await TransferRequest.findOne({ asset: asset._id, status: 'Requested' });
  if (existing) {
    return existing;
  }

  return TransferRequest.create({
    asset: asset._id,
    fromHolder: data.fromHolder,
    toHolder: data.toHolder,
    requestedBy: actor?.id || data.requestedBy,
    status: 'Requested'
  });
}

async function listTransferRequests(query = {}) {
  const filter = {};
  if (query.status) filter.status = query.status;
  return TransferRequest.find(filter)
    .populate('asset')
    .populate('fromHolder')
    .populate('toHolder')
    .populate('requestedBy')
    .sort({ requestedDate: -1 });
}

async function approveTransferRequest(id, actor) {
  const transfer = await TransferRequest.findById(id);
  if (!transfer) throw new Error('Transfer request not found');

  const allocation = await Allocation.findOne({ asset: transfer.asset, status: 'Active' });
  if (allocation) {
    allocation.status = 'Transferred';
    await allocation.save();
  }

  const newAllocation = await Allocation.create({
    asset: transfer.asset,
    employee: transfer.toHolder,
    department: undefined,
    status: 'Active',
    allocatedBy: actor?.id || undefined
  });

  const asset = await Asset.findById(transfer.asset);
  if (asset) {
    asset.currentHolder = transfer.toHolder;
    asset.status = 'Allocated';
    await asset.save();
  }

  transfer.status = 'Approved';
  transfer.approvedBy = actor?.id || undefined;
  transfer.approvedDate = new Date();
  await transfer.save();

  return { transfer, newAllocation };
}

async function rejectTransferRequest(id, payload, actor) {
  const transfer = await TransferRequest.findById(id);
  if (!transfer) throw new Error('Transfer request not found');

  transfer.status = 'Rejected';
  transfer.rejectionReason = payload.rejectionReason || 'Rejected';
  transfer.approvedBy = actor?.id || undefined;
  await transfer.save();
  return transfer;
}

module.exports = {
  getAllocations,
  getOverdueAllocations,
  createAllocation,
  returnAllocation,
  createTransferRequest,
  listTransferRequests,
  approveTransferRequest,
  rejectTransferRequest
};
