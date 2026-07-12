const Allocation = require('../models/Allocation');
const Asset = require('../models/Asset');
const AssetStatusLog = require('../models/AssetStatusLog');

async function runOverdueCheck() {
  const now = new Date();
  const overdueAllocations = await Allocation.find({ status: 'Active', expectedReturnDate: { $lt: now } });

  for (const allocation of overdueAllocations) {
    allocation.status = 'Overdue';
    await allocation.save();

    const asset = await Asset.findById(allocation.asset);
    if (asset && asset.status !== 'Overdue') {
      asset.status = 'Overdue';
      await asset.save();
    }

    await AssetStatusLog.create({
      asset: allocation.asset,
      fromStatus: 'Allocated',
      toStatus: 'Overdue',
      reason: 'Overdue allocation detected'
    });
  }

  return overdueAllocations.length;
}

module.exports = { runOverdueCheck };
