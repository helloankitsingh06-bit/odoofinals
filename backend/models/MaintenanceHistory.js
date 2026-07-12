const mongoose = require('mongoose');

const maintenanceHistorySchema = new mongoose.Schema({
  asset: { type: String, ref: 'Asset', required: true, index: true },
  raisedBy: { type: String, ref: 'Employee', required: true },
  issueDescription: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Technician Assigned', 'In Progress', 'Resolved'],
    default: 'Pending'
  },
  approvedBy: { type: String, ref: 'Employee' },
  resolvedDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('MaintenanceHistory', maintenanceHistorySchema);
