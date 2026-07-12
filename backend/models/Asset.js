const mongoose = require('mongoose');
const Counter = require('./Counter');

const assetSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: mongoose.Schema.Types.Mixed, required: true },
  assetTag: { type: String, unique: true, sparse: true, trim: true },
  serialNumber: { type: String, unique: true, sparse: true, trim: true },
  qrCode: { type: String, unique: true, sparse: true, trim: true },
  acquisitionDate: { type: Date, required: true },
  acquisitionCost: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: (value) => value >= 0,
      message: 'acquisitionCost must be greater than or equal to 0'
    }
  },
  condition: {
    type: String,
    enum: ['New', 'Good', 'Fair', 'Poor', 'Damaged'],
    default: 'New'
  },
  location: { type: String, required: true, trim: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  photos: [{ type: String }],
  documents: [{
    name: { type: String },
    url: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],
  isBookable: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'],
    default: 'Available',
    required: true,
    index: true
  },
  currentHolder: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

assetSchema.index({ status: 1, category: 1 });
assetSchema.index({ department: 1, status: 1 });
assetSchema.index({ name: 'text', assetTag: 'text', serialNumber: 'text' });

assetSchema.pre('validate', async function(next) {
  if (this.acquisitionDate && this.acquisitionDate > new Date()) {
    return next(new Error('acquisitionDate cannot be in the future'));
  }

  if (this.isBookable && ['Lost', 'Retired', 'Disposed'].includes(this.status)) {
    return next(new Error('isBookable cannot be true for assets in Lost, Retired, or Disposed status'));
  }

  if (!this.assetTag) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { name: 'asset' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      this.assetTag = `AF-${String(counter.seq).padStart(4, '0')}`;
    } catch (error) {
      return next(error);
    }
  }

  next();
});

assetSchema.statics.canTransition = function(currentStatus, newStatus) {
  const allowed = {
    Available: ['Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired'],
    Allocated: ['Available', 'Under Maintenance', 'Lost'],
    Reserved: ['Allocated', 'Available'],
    'Under Maintenance': ['Available', 'Retired', 'Disposed'],
    Lost: ['Retired', 'Disposed', 'Available'],
    Retired: ['Disposed'],
    Disposed: []
  };

  return allowed[currentStatus]?.includes(newStatus);
};

module.exports = mongoose.model('Asset', assetSchema);
