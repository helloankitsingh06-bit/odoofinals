const attendanceService = require('../services/attendanceService');

/**
 * Attendance HTTP Controllers
 */

async function checkIn(req, res, next) {
  try {
    let employeeId = req.body.employeeId;

    // If Employee role, restrict to their own employeeId
    if (req.user.role === 'Employee') {
      employeeId = req.user.employeeId || employeeId;
    }

    if (!employeeId) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'employeeId is required',
      });
    }

    const record = await attendanceService.checkIn({
      employeeId,
      checkInTime: req.body.checkInTime,
    });

    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
}

async function checkOut(req, res, next) {
  try {
    let employeeId = req.body.employeeId;
    const attendanceId = req.body.attendanceId;

    if (req.user.role === 'Employee') {
      employeeId = req.user.employeeId || employeeId;
    }

    const record = await attendanceService.checkOut({
      employeeId,
      attendanceId,
      checkOutTime: req.body.checkOutTime,
    });

    res.json(record);
  } catch (error) {
    next(error);
  }
}

async function listAttendance(req, res, next) {
  try {
    let employeeId = req.query.employeeId;

    // If Employee role, they can only see their own attendance
    if (req.user.role === 'Employee') {
      employeeId = req.user.employeeId || employeeId;
    }

    const records = await attendanceService.listAttendance({
      employeeId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      status: req.query.status,
      limit: req.query.limit ? parseInt(req.query.limit, 10) : 100,
    });

    res.json(records);
  } catch (error) {
    next(error);
  }
}

async function getAttendanceById(req, res, next) {
  try {
    const record = await attendanceService.getAttendanceById(req.params.id);
    if (!record) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Attendance record ${req.params.id} not found`,
      });
    }

    // Role check: Employee can only view their own record
    if (
      req.user.role === 'Employee' &&
      req.user.employeeId &&
      record.employeeId !== req.user.employeeId
    ) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view your own attendance records',
      });
    }

    res.json(record);
  } catch (error) {
    next(error);
  }
}

async function manualCorrection(req, res, next) {
  try {
    const record = await attendanceService.manualCorrection(
      req.params.id,
      req.body,
      req.user.role
    );
    res.json(record);
  } catch (error) {
    next(error);
  }
}

async function recordAbsent(req, res, next) {
  try {
    const record = await attendanceService.recordAbsent({
      employeeId: req.body.employeeId,
      date: req.body.date,
      reason: req.body.reason,
    });
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  checkIn,
  checkOut,
  listAttendance,
  getAttendanceById,
  manualCorrection,
  recordAbsent,
};
