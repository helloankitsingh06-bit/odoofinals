const allocationService = require('../services/allocationService');

/**
 * Allocation HTTP Controllers
 */

async function createAllocation(req, res, next) {
  try {
    const record = await allocationService.createAllocation(req.body);
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
}

async function listAllocations(req, res, next) {
  try {
    let employeeId = req.query.employeeId;

    // If Employee role, restrict to their own allocations
    if (req.user.role === 'Employee') {
      employeeId = req.user.employeeId || employeeId;
    }

    const records = await allocationService.listAllocations({
      employeeId,
      timeOffTypeId: req.query.timeOffTypeId,
      status: req.query.status,
      limit: req.query.limit ? parseInt(req.query.limit, 10) : 100,
    });

    res.json(records);
  } catch (error) {
    next(error);
  }
}

async function getAllocationById(req, res, next) {
  try {
    const record = await allocationService.getAllocationById(req.params.id);
    if (!record) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Allocation ${req.params.id} not found`,
      });
    }

    if (
      req.user.role === 'Employee' &&
      req.user.employeeId &&
      record.employeeId !== req.user.employeeId
    ) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view your own allocations',
      });
    }

    res.json(record);
  } catch (error) {
    next(error);
  }
}

async function approveAllocation(req, res, next) {
  try {
    const record = await allocationService.approveAllocation(
      req.params.id,
      req.user.role
    );
    res.json(record);
  } catch (error) {
    next(error);
  }
}

async function getAvailableBalance(req, res, next) {
  try {
    let employeeId = req.params.employeeId;
    const timeOffTypeId = req.params.timeOffTypeId;

    if (
      req.user.role === 'Employee' &&
      req.user.employeeId &&
      employeeId !== req.user.employeeId
    ) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only check your own balance',
      });
    }

    const balance = await allocationService.getAvailableBalance(
      employeeId,
      timeOffTypeId,
      req.query.date
    );

    res.json(balance);
  } catch (error) {
    next(error);
  }
}

async function deleteAllocation(req, res, next) {
  try {
    await allocationService.deleteAllocation(req.params.id, req.user.role);
    res.json({ message: 'Allocation deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createAllocation,
  listAllocations,
  getAllocationById,
  approveAllocation,
  getAvailableBalance,
  deleteAllocation,
};
