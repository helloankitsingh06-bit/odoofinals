const Asset = require('../models/Asset');
const AllocationHistory = require('../models/AllocationHistory');
const MaintenanceHistory = require('../models/MaintenanceHistory');
const AssetStatusLog = require('../models/AssetStatusLog');
const Category = require('../models/Category');

async function createAsset(data) {
  let categoryValue = data.category;

  if (typeof categoryValue === 'string' && categoryValue.trim()) {
    const categoryDoc = await Category.findOne({ name: new RegExp(`^${categoryValue.trim()}$`, 'i') });
    if (categoryDoc) {
      categoryValue = categoryDoc._id;
    } else {
      const createdCategory = await Category.create({ name: categoryValue.trim(), extraFields: [] });
      categoryValue = createdCategory._id;
    }
  }

  const assetPayload = {
    ...data,
    category: categoryValue,
    status: data.status || 'Available',
    isDeleted: false,
    createdBy: data.createdBy || '000000000000000000000000'
  };

  const asset = new Asset(assetPayload);
  await asset.save();
  return asset;
}

async function getAssets(query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const sortBy = query.sortBy || 'createdAt';
  const order = query.order === 'asc' ? 1 : -1;

  const filter = { isDeleted: false };

  if (query.assetTag) filter.assetTag = { $regex: query.assetTag, $options: 'i' };
  if (query.serialNumber) filter.serialNumber = { $regex: query.serialNumber, $options: 'i' };
  if (query.qrCode) filter.qrCode = { $regex: query.qrCode, $options: 'i' };
  if (query.category) filter.category = query.category;
  if (query.status) filter.status = query.status;
  if (query.department) filter.department = query.department;
  if (query.location) filter.location = query.location;
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { assetTag: { $regex: query.search, $options: 'i' } },
      { serialNumber: { $regex: query.search, $options: 'i' } }
    ];
  }

  const [items, total] = await Promise.all([
    Asset.find(filter)
      .populate('category', 'name')
      .populate('department', 'name')
      .populate('currentHolder', 'name')
      .sort({ [sortBy]: order })
      .skip((page - 1) * limit)
      .limit(limit),
    Asset.countDocuments(filter)
  ]);

  return { items, total, page, limit };
}

async function getAssetById(id) {
  return Asset.findById(id)
    .populate('category', 'name')
    .populate('department', 'name')
    .populate('currentHolder', 'name');
}

async function updateAsset(id, updates) {
  const asset = await Asset.findById(id);
  if (!asset) throw new Error('Asset not found');

  const forbidden = ['status', 'currentHolder'];
  for (const field of forbidden) {
    if (updates[field] !== undefined) {
      throw new Error(`${field} updates must go through dedicated flows`);
    }
  }

  Object.assign(asset, updates);
  await asset.save();
  return asset;
}

async function softDeleteAsset(id) {
  const asset = await Asset.findById(id);
  if (!asset) throw new Error('Asset not found');

  const hasRelatedRecords = await Promise.all([
    AllocationHistory.exists({ asset: id }),
    MaintenanceHistory.exists({ asset: id })
  ]);

  if (hasRelatedRecords.some(Boolean)) {
    throw new Error('Cannot delete asset with allocation or maintenance history');
  }

  asset.isDeleted = true;
  await asset.save();
  return asset;
}

async function transitionAssetStatus(id, { newStatus, changedBy, reason }) {
  const asset = await Asset.findById(id);
  if (!asset) throw new Error('Asset not found');

  if (!Asset.canTransition(asset.status, newStatus)) {
    throw new Error(`Invalid status transition from ${asset.status} to ${newStatus}`);
  }

  const logEntry = await AssetStatusLog.create({
    asset: asset._id,
    fromStatus: asset.status,
    toStatus: newStatus,
    changedBy,
    reason,
    timestamp: new Date()
  });

  asset.status = newStatus;
  await asset.save();
  return { asset, logEntry };
}

async function getAssetHistory(id) {
  const [allocationHistory, maintenanceHistory, statusLogs] = await Promise.all([
    AllocationHistory.find({ asset: id }).sort({ createdAt: 1 }),
    MaintenanceHistory.find({ asset: id }).sort({ createdAt: 1 }),
    AssetStatusLog.find({ asset: id }).sort({ timestamp: 1 })
  ]);

  return [...allocationHistory, ...maintenanceHistory, ...statusLogs].sort((a, b) => {
    const dateA = a.createdAt || a.timestamp || a.allocatedDate || new Date(0);
    const dateB = b.createdAt || b.timestamp || b.allocatedDate || new Date(0);
    return new Date(dateA) - new Date(dateB);
  });
}

module.exports = {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  softDeleteAsset,
  transitionAssetStatus,
  getAssetHistory
};
