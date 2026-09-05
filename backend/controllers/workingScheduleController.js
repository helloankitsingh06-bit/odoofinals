const workingScheduleService = require('../services/workingScheduleService');

/**
 * Working Schedule Controller
 */

async function listSchedules(req, res, next) {
  try {
    const schedules = await workingScheduleService.getSchedules();
    res.json(schedules);
  } catch (err) {
    next(err);
  }
}

async function createSchedule(req, res, next) {
  try {
    const schedule = await workingScheduleService.createSchedule(req.body);
    res.status(201).json(schedule);
  } catch (err) {
    next(err);
  }
}

async function getSchedule(req, res, next) {
  try {
    const schedule = await workingScheduleService.getScheduleById(req.params.id);
    if (!schedule) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: `Schedule with id "${req.params.id}" not found`,
      });
    }
    res.json(schedule);
  } catch (err) {
    next(err);
  }
}

async function updateSchedule(req, res, next) {
  try {
    const schedule = await workingScheduleService.updateSchedule(
      req.params.id,
      req.body
    );
    if (!schedule) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: `Schedule with id "${req.params.id}" not found`,
      });
    }
    res.json(schedule);
  } catch (err) {
    next(err);
  }
}

async function deleteSchedule(req, res, next) {
  try {
    const deleted = await workingScheduleService.deleteSchedule(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: `Schedule with id "${req.params.id}" not found`,
      });
    }
    res.json({ message: 'Working schedule deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listSchedules,
  createSchedule,
  getSchedule,
  updateSchedule,
  deleteSchedule,
};
