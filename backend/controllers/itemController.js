const itemService = require('../services/itemService');

/**
 * Thin HTTP layer. All business logic lives in itemService.
 * Each handler forwards errors to the centralized error handler via next(err).
 */

async function listItems(req, res, next) {
  try {
    const items = await itemService.getItems();
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function createItem(req, res, next) {
  try {
    const item = await itemService.createItem(req.body);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

async function getItem(req, res, next) {
  try {
    const item = await itemService.getItemById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function updateItem(req, res, next) {
  try {
    const item = await itemService.updateItem(req.params.id, req.body);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function deleteItem(req, res, next) {
  try {
    const deleted = await itemService.deleteItem(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listItems,
  createItem,
  getItem,
  updateItem,
  deleteItem,
};
