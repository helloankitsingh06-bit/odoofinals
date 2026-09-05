const { test, describe } = require('node:test');
const assert = require('node:assert');
const workingScheduleService = require('../services/workingScheduleService');
const { SCHEDULE_TYPES } = require('../src/constants');

describe('Deliverable 4: Working Schedule Service & Computation Tests', () => {
  let createdScheduleId = null;

  test('Calculates totalWeeklyHours correctly for standard 5-day week (40 hrs worked - 5 hrs break = 35 hrs)', () => {
    const pattern = [
      { day: 'Monday', startTime: '09:00', endTime: '17:00', breakMins: 60 },
      { day: 'Tuesday', startTime: '09:00', endTime: '17:00', breakMins: 60 },
      { day: 'Wednesday', startTime: '09:00', endTime: '17:00', breakMins: 60 },
      { day: 'Thursday', startTime: '09:00', endTime: '17:00', breakMins: 60 },
      { day: 'Friday', startTime: '09:00', endTime: '17:00', breakMins: 60 },
    ];
    const total = workingScheduleService.calculateTotalWeeklyHours(pattern);
    assert.strictEqual(total, 35.0);
  });

  test('Throws 400 if endTime is before startTime on any day', () => {
    const invalidPattern = [
      { day: 'Monday', startTime: '17:00', endTime: '09:00', breakMins: 30 },
    ];
    assert.throws(
      () => {
        workingScheduleService.calculateTotalWeeklyHours(invalidPattern);
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.match(err.message, /End time.*cannot be before start time/);
        return true;
      }
    );
  });

  test('Throws 400 if breakMins exceed shift duration', () => {
    const invalidBreak = [
      { day: 'Monday', startTime: '09:00', endTime: '10:00', breakMins: 90 },
    ];
    assert.throws(
      () => {
        workingScheduleService.calculateTotalWeeklyHours(invalidBreak);
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.match(err.message, /Break minutes.*exceed total shift duration/);
        return true;
      }
    );
  });

  test('Server computes totalWeeklyHours and overrides client-supplied value', async () => {
    const pattern = [
      { day: 'Monday', startTime: '08:00', endTime: '16:30', breakMins: 30 }, // 8h
      { day: 'Tuesday', startTime: '08:00', endTime: '16:30', breakMins: 30 }, // 8h
      { day: 'Wednesday', startTime: '08:00', endTime: '16:30', breakMins: 30 }, // 8h
      { day: 'Thursday', startTime: '08:00', endTime: '16:30', breakMins: 30 }, // 8h
      { day: 'Friday', startTime: '08:00', endTime: '16:30', breakMins: 30 }, // 8h
    ];

    const created = await workingScheduleService.createSchedule({
      name: 'Standard 40h Schedule ' + Date.now(),
      type: SCHEDULE_TYPES.FIXED,
      weeklyPattern: pattern,
      totalWeeklyHours: 999, // Should be ignored and overwritten with 40
    });

    assert.ok(created.id);
    assert.strictEqual(created.totalWeeklyHours, 40.0);
    assert.strictEqual(created.type, 'Fixed');
    assert.strictEqual(created.weeklyPattern.length, 5);
    assert.strictEqual(created.weeklyPattern[0].breakMins, 30);

    createdScheduleId = created.id;
  });

  test('Reads schedule by ID and list all schedules', async () => {
    assert.ok(createdScheduleId);
    const schedule = await workingScheduleService.getScheduleById(createdScheduleId);
    assert.ok(schedule);
    assert.strictEqual(schedule.totalWeeklyHours, 40.0);

    const list = await workingScheduleService.getSchedules();
    assert.ok(Array.isArray(list));
    const found = list.find((s) => s.id === createdScheduleId);
    assert.ok(found);
  });

  test('Updates schedule pattern and recomputes totalWeeklyHours', async () => {
    assert.ok(createdScheduleId);
    const newPattern = [
      { day: 'Monday', startTime: '09:00', endTime: '13:00', breakMins: 0 }, // 4h
    ];
    const updated = await workingScheduleService.updateSchedule(createdScheduleId, {
      weeklyPattern: newPattern,
    });
    assert.strictEqual(updated.totalWeeklyHours, 4.0);
  });
});
