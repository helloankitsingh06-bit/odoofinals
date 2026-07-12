const allocationService = require('../services/allocationService');

async function listAllocations(req, res, next) {
  try {
    const result = await allocationService.getAllocations(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function listOverdueAllocations(req, res, next) {
  try {
    const result = await allocationService.getOverdueAllocations();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function createAllocation(req, res, next) {
  try {
    const allocation = await allocationService.createAllocation(req.body, req.user);
    res.status(201).json(allocation);
  } catch (err) {
    if (err.statusCode === 409) {
      return res.status(409).json(err.payload);
    }
    return next(err);
  }
}

async function returnAllocation(req, res, next) {
  try {
    const allocation = await allocationService.returnAllocation(req.params.id, req.body, req.user);
    res.json(allocation);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listAllocations,
  listOverdueAllocations,
  createAllocation,
  returnAllocation
};
