const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  role: { type: String, enum: ['AssetManager', 'DeptHead', 'Employee', 'Viewer'], default: 'Employee', index: true },
  department: { type: String, ref: 'Department' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
