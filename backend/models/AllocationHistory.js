const mongoose = require('mongoose');

const allocationHistorySchema = new mongoose.Schema({
  asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  allocatedDate: { type: Date, default: Date.now },
  expectedReturnDate: { type: Date },
  actualReturnDate: { type: Date },
  conditionAtCheckout: { type: String },
  conditionAtCheckin: { type: String },
  checkinNotes: { type: String },
  status: {
    type: String,
    enum: ['Active', 'Returned', 'Overdue', 'Transferred'],
    default: 'Active'
  }
}, { timestamps: true });

module.exports = mongoose.model('AllocationHistory', allocationHistorySchema);
