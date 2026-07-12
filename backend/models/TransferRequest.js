const mongoose = require('mongoose');

const transferRequestSchema = new mongoose.Schema({
  asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
  fromHolderType: { type: String, enum: ['Employee', 'Department'], default: 'Employee' },
  fromHolder: { type: mongoose.Schema.Types.ObjectId, refPath: 'fromHolderType' },
  toHolderType: { type: String, enum: ['Employee', 'Department'], default: 'Employee' },
  toHolder: { type: mongoose.Schema.Types.ObjectId, refPath: 'toHolderType' },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  requestedDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Requested', 'Approved', 'Rejected', 'Completed'], default: 'Requested', index: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  approvedDate: { type: Date },
  rejectionReason: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('TransferRequest', transferRequestSchema);
