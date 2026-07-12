const mongoose = require('mongoose');

const transferRequestSchema = new mongoose.Schema({
  asset: { type: String, ref: 'Asset', required: true, index: true },
  fromHolderType: { type: String, enum: ['Employee', 'Department'], default: 'Employee' },
  fromHolder: { type: String, refPath: 'fromHolderType' },
  toHolderType: { type: String, enum: ['Employee', 'Department'], default: 'Employee' },
  toHolder: { type: String, refPath: 'toHolderType' },
  requestedBy: { type: String, ref: 'Employee' },
  requestedDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Requested', 'Approved', 'Rejected', 'Completed'], default: 'Requested', index: true },
  approvedBy: { type: String, ref: 'Employee' },
  approvedDate: { type: Date },
  rejectionReason: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('TransferRequest', transferRequestSchema);
