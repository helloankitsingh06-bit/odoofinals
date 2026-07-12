const Category = require('../models/Category');

async function listCategories(req, res, next) {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const name = (req.body.name || '').trim();
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const existing = await Category.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (existing) {
      return res.status(200).json(existing);
    }

    const category = await Category.create({ name, extraFields: req.body.extraFields || [] });
    return res.status(201).json(category);
  } catch (err) {
    return next(err);
  }
}

module.exports = { listCategories, createCategory };
