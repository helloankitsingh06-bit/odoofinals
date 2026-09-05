const timeOffRequestService = require('../services/timeOffRequestService');

/**
 * Time Off Request HTTP Controllers
 */

async function createTimeOffRequest(req, res, next) {
  try {
    let employeeId = req.body.employeeId;

    if (req.user.role === 'Employee') {
      employeeId = req.user.employeeId || employeeId;
    }

    const payload = {
      ...req.body,
      employeeId,
    };

    const record = await timeOffRequestService.createTimeOffRequest(payload);
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
}

async function listTimeOffRequests(req, res, next) {
  try {
    let employeeId = req.query.employeeId;

    if (req.user.role === 'Employee') {
      employeeId = req.user.employeeId || employeeId;
    }

    const records = await timeOffRequestService.listTimeOffRequests({
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

async function getTimeOffRequestById(req, res, next) {
  try {
    const record = await timeOffRequestService.getTimeOffRequestById(
      req.params.id
    );
    if (!record) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Time Off Request ${req.params.id} not found`,
      });
    }

    if (
      req.user.role === 'Employee' &&
      req.user.employeeId &&
      record.employeeId !== req.user.employeeId
    ) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view your own time off requests',
      });
    }

    res.json(record);
  } catch (error) {
    next(error);
  }
}

async function approveTimeOffRequest(req, res, next) {
  try {
    const result = await timeOffRequestService.approveTimeOffRequest(
      req.params.id,
      req.user.role
    );
    res.json({
      message: 'Time Off Request approved successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

async function refuseTimeOffRequest(req, res, next) {
  try {
    const record = await timeOffRequestService.refuseTimeOffRequest(
      req.params.id,
      req.user.role,
      req.body.reason
    );
    res.json({
      message: 'Time Off Request refused',
      request: record,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteTimeOffRequest(req, res, next) {
  try {
    await timeOffRequestService.deleteTimeOffRequest(
      req.params.id,
      req.user.role,
      req.user.uid
    );
    res.json({ message: 'Time Off Request deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createTimeOffRequest,
  listTimeOffRequests,
  getTimeOffRequestById,
  approveTimeOffRequest,
  refuseTimeOffRequest,
  deleteTimeOffRequest,
};
