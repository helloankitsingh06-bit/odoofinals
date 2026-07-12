const mongoose = require('mongoose');

const assetStatusLogSchema = new mongoose.Schema({
  asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
  fromStatus: { type: String },
  toStatus: { type: String, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  reason: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('AssetStatusLog', assetStatusLogSchema);
