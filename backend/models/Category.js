const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  extraFields: [{ type: Object }]
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
