const timeOffTypeService = require('../services/timeOffTypeService');

/**
 * Time Off Type HTTP Controllers
 */

async function createTimeOffType(req, res, next) {
  try {
    const record = await timeOffTypeService.createTimeOffType(req.body);
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
}

async function getTimeOffTypes(req, res, next) {
  try {
    const records = await timeOffTypeService.getTimeOffTypes();
    res.json(records);
  } catch (error) {
    next(error);
  }
}

async function getTimeOffTypeById(req, res, next) {
  try {
    const record = await timeOffTypeService.getTimeOffTypeById(req.params.id);
    if (!record) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Time Off Type ${req.params.id} not found`,
      });
    }
    res.json(record);
  } catch (error) {
    next(error);
  }
}

async function updateTimeOffType(req, res, next) {
  try {
    const record = await timeOffTypeService.updateTimeOffType(
      req.params.id,
      req.body
    );
    res.json(record);
  } catch (error) {
    next(error);
  }
}

async function deleteTimeOffType(req, res, next) {
  try {
    await timeOffTypeService.deleteTimeOffType(req.params.id);
    res.json({ message: 'Time Off Type deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createTimeOffType,
  getTimeOffTypes,
  getTimeOffTypeById,
  updateTimeOffType,
  deleteTimeOffType,
};
