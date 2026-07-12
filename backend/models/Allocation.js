const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema({
  asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  allocatedDate: { type: Date, default: Date.now },
  expectedReturnDate: { type: Date },
  actualReturnDate: { type: Date },
  status: { type: String, enum: ['Active', 'Returned', 'Overdue', 'Transferred'], default: 'Active', index: true },
  conditionAtCheckout: { type: String },
  conditionAtCheckin: { type: String },
  checkinNotes: { type: String },
  allocatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }
}, { timestamps: true });

allocationSchema.pre('validate', function(next) {
  if (!this.employee && !this.department) {
    return next(new Error('Either employee or department is required for an allocation'));
  }
  next();
});

module.exports = mongoose.model('Allocation', allocationSchema);
