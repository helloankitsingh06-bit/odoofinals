const { db } = require('../firebase');
const { serializeTimestamps } = require('../utils/serializeTimestamps');

/**
 * Attendance Service (P2 Scope)
 *
 * Firestore collection: "attendance"
 * Schema:
 *   - id: string
 *   - employeeId: string
 *   - checkIn: Timestamp / ISO string (or null for Absent)
 *   - checkOut: Timestamp / ISO string (or null if open / Absent)
 *   - workedHours: number (computed) or null
 *   - status: "Present" | "Late" | "Absent" | "Overtime" | "MissingCheckout"
 *   - isManualEdit: boolean
 *   - createdAt: Timestamp
 */
const COLLECTION = 'attendance';

const VALID_STATUSES = [
  'Present',
  'Late',
  'Absent',
  'Overtime',
  'MissingCheckout',
];

const HR_ROLES = ['HRManager', 'HRPayrollManager', 'Admin'];

/**
 * Normalize a Date or timestamp string into a JavaScript Date object.
 */
function toDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val.toDate === 'function') return val.toDate();
  if (typeof val._seconds === 'number') return new Date(val._seconds * 1000);
  if (typeof val.seconds === 'number') return new Date(val.seconds * 1000);
  return new Date(val);
}

/**
 * Parses time string like "09:00" or "17:30" into hours and minutes.
 */
function parseTimeString(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return { hours, minutes };
}

/**
 * Matches a JavaScript Date to an item in weeklyPattern.
 * Supports day as:
 *   - Full name: "Monday", "Tuesday", etc. (case-insensitive)
 *   - Short name: "Mon", "Tue", etc. (case-insensitive)
 *   - Integer 0-6 (0=Sunday) or 1-7 (1=Monday)
 */
function findScheduledDayPattern(weeklyPattern, dateObj) {
  if (!Array.isArray(weeklyPattern) || weeklyPattern.length === 0) return null;

  const dayNames = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  const shortDayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  const dayIndex = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const fullDay = dayNames[dayIndex];
  const shortDay = shortDayNames[dayIndex];
  const isoDayNumber = dayIndex === 0 ? 7 : dayIndex; // 1 = Monday ... 7 = Sunday

  return (
    weeklyPattern.find((p) => {
      if (!p || p.day === undefined || p.day === null) return false;
      if (typeof p.day === 'string') {
        const d = p.day.trim().toLowerCase();
        return d === fullDay || d === shortDay;
      }
      if (typeof p.day === 'number') {
        return p.day === dayIndex || p.day === isoDayNumber;
      }
      return false;
    }) || null
  );
}

/**
 * Calculates scheduled daily work hours from pattern.
 * e.g. "09:00" to "17:00" with breakMins: 60 => 8h - 1h = 7 hours.
 */
function calculateDailyScheduledHours(pattern) {
  if (!pattern) return 8; // fallback 8 hours
  const start = parseTimeString(pattern.startTime);
  const end = parseTimeString(pattern.endTime);
  if (!start || !end) return 8;

  const totalMinutes =
    end.hours * 60 + end.minutes - (start.hours * 60 + start.minutes);
  const breakMinutes = Number(pattern.breakMins) || 0;
  const netMinutes = Math.max(0, totalMinutes - breakMinutes);
  return Math.round((netMinutes / 60) * 100) / 100;
}

/**
 * Calculates workedHours = (checkOut - checkIn) - breakMins.
 * Returns null if checkOut is missing.
 */
function calculateWorkedHours(checkInDate, checkOutDate, breakMins = 0) {
  if (!checkInDate || !checkOutDate) return null;
  const diffMs = checkOutDate.getTime() - checkInDate.getTime();
  if (diffMs <= 0) return 0;

  const totalHours = diffMs / (1000 * 60 * 60);
  const breakHours = (Number(breakMins) || 0) / 60;
  const netHours = Math.max(0, totalHours - breakHours);
  return Math.round(netHours * 100) / 100;
}

/**
 * Retrieve the employee's assigned working schedule from Firestore.
 */
async function getEmployeeWorkingSchedule(employeeId) {
  if (!employeeId) return null;

  try {
    const empDoc = await db.collection('employees').doc(employeeId).get();
    if (!empDoc.exists) return null;

    const empData = empDoc.data();
    const workingScheduleId = empData.workingScheduleId;
    if (!workingScheduleId) return null;

    const wsDoc = await db
      .collection('workingSchedules')
      .doc(workingScheduleId)
      .get();
    if (!wsDoc.exists) return null;

    return { id: wsDoc.id, ...wsDoc.data() };
  } catch (error) {
    console.warn(`Could not fetch schedule for employee ${employeeId}:`, error.message);
    return null;
  }
}

/**
 * Evaluates attendance status on check-in or after check-out.
 */
function evaluateStatus({
  checkInDate,
  checkOutDate,
  pattern,
  workedHours,
  graceMins = 15,
  overtimeThresholdHours = 0.5,
}) {
  if (!checkInDate) {
    return 'Absent';
  }

  // 1. Check if check-in was late against scheduled start
  let isLate = false;
  if (pattern && pattern.startTime) {
    const parsedStart = parseTimeString(pattern.startTime);
    if (parsedStart) {
      const scheduledStart = new Date(checkInDate);
      scheduledStart.setHours(parsedStart.hours, parsedStart.minutes, 0, 0);

      const lateThreshold = new Date(
        scheduledStart.getTime() + graceMins * 60 * 1000
      );
      if (checkInDate > lateThreshold) {
        isLate = true;
      }
    }
  }

  // 2. If not checked out yet:
  if (!checkOutDate) {
    // If checkIn was from an earlier day or shift has passed, flag MissingCheckout
    const now = new Date();
    const isSameDay =
      now.getFullYear() === checkInDate.getFullYear() &&
      now.getMonth() === checkInDate.getMonth() &&
      now.getDate() === checkInDate.getDate();

    if (!isSameDay) {
      return 'MissingCheckout';
    }

    // If day is today but past scheduled end time + 2 hours without check-out
    if (pattern && pattern.endTime) {
      const parsedEnd = parseTimeString(pattern.endTime);
      if (parsedEnd) {
        const scheduledEnd = new Date(checkInDate);
        scheduledEnd.setHours(parsedEnd.hours + 2, parsedEnd.minutes, 0, 0);
        if (now > scheduledEnd) {
          return 'MissingCheckout';
        }
      }
    }

    return isLate ? 'Late' : 'Present';
  }

  // 3. Checked out: evaluate Overtime
  const scheduledHours = calculateDailyScheduledHours(pattern);
  if (
    workedHours !== null &&
    workedHours > scheduledHours + overtimeThresholdHours
  ) {
    return 'Overtime';
  }

  return isLate ? 'Late' : 'Present';
}

/**
 * Check-in: records employee arrival.
 */
async function checkIn({ employeeId, checkInTime }) {
  if (!employeeId) {
    const err = new Error('Field "employeeId" is required');
    err.statusCode = 400;
    throw err;
  }

  const checkInDate = checkInTime ? toDate(checkInTime) : new Date();

  // Check if employee already has an open check-in
  const openSnapshot = await db
    .collection(COLLECTION)
    .where('employeeId', '==', employeeId)
    .where('checkOut', '==', null)
    .limit(1)
    .get();

  if (!openSnapshot.empty) {
    const openDoc = openSnapshot.docs[0];
    const data = openDoc.data();
    // If from today, prevent double check-in
    const existingCheckIn = toDate(data.checkIn);
    const isSameDay =
      existingCheckIn &&
      existingCheckIn.toDateString() === checkInDate.toDateString();

    if (isSameDay) {
      const err = new Error(
        'Employee is already checked in. Please check out before checking in again.'
      );
      err.statusCode = 400;
      throw err;
    }
  }

  // Fetch working schedule
  const schedule = await getEmployeeWorkingSchedule(employeeId);
  const pattern = schedule
    ? findScheduledDayPattern(schedule.weeklyPattern, checkInDate)
    : null;

  const status = evaluateStatus({
    checkInDate,
    checkOutDate: null,
    pattern,
    workedHours: null,
  });

  const record = {
    employeeId,
    checkIn: checkInDate,
    checkOut: null,
    workedHours: null,
    status,
    isManualEdit: false,
    createdAt: new Date(),
  };

  const docRef = await db.collection(COLLECTION).add(record);
  return serializeTimestamps({ id: docRef.id, ...record });
}

/**
 * Check-out: records employee departure and computes workedHours + final status.
 */
async function checkOut({ employeeId, attendanceId, checkOutTime }) {
  let docRef;
  let recordData;

  if (attendanceId) {
    docRef = db.collection(COLLECTION).doc(attendanceId);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      const err = new Error(`Attendance record ${attendanceId} not found`);
      err.statusCode = 404;
      throw err;
    }
    recordData = snapshot.data();
  } else if (employeeId) {
    // Find the latest open record for this employee
    const openSnapshot = await db
      .collection(COLLECTION)
      .where('employeeId', '==', employeeId)
      .where('checkOut', '==', null)
      .orderBy('checkIn', 'desc')
      .limit(1)
      .get();

    if (openSnapshot.empty) {
      const err = new Error(
        `No active check-in record found for employee ${employeeId}`
      );
      err.statusCode = 404;
      throw err;
    }

    const openDoc = openSnapshot.docs[0];
    docRef = openDoc.ref;
    recordData = openDoc.data();
  } else {
    const err = new Error('Either "employeeId" or "attendanceId" is required');
    err.statusCode = 400;
    throw err;
  }

  const checkInDate = toDate(recordData.checkIn);
  if (!checkInDate) {
    const err = new Error('Cannot check out an attendance record with no checkIn');
    err.statusCode = 400;
    throw err;
  }

  const checkOutDate = checkOutTime ? toDate(checkOutTime) : new Date();
  if (checkOutDate < checkInDate) {
    const err = new Error('Check-out time cannot be earlier than check-in time');
    err.statusCode = 400;
    throw err;
  }

  // Fetch working schedule to compute break and scheduled hours
  const schedule = await getEmployeeWorkingSchedule(recordData.employeeId);
  const pattern = schedule
    ? findScheduledDayPattern(schedule.weeklyPattern, checkInDate)
    : null;
  const breakMins = pattern ? Number(pattern.breakMins) || 0 : 0;

  const workedHours = calculateWorkedHours(checkInDate, checkOutDate, breakMins);
  const status = evaluateStatus({
    checkInDate,
    checkOutDate,
    pattern,
    workedHours,
  });

  const updates = {
    checkOut: checkOutDate,
    workedHours,
    status,
  };

  await docRef.update(updates);
  const updatedSnap = await docRef.get();
  return serializeTimestamps({ id: updatedSnap.id, ...updatedSnap.data() });
}

/**
 * List attendance records with optional filters.
 * Reconciles open records whose checkout is missing past the shift day.
 */
async function listAttendance({
  employeeId,
  startDate,
  endDate,
  status,
  limit = 100,
} = {}) {
  let query = db.collection(COLLECTION);

  if (employeeId) {
    query = query.where('employeeId', '==', employeeId);
  }
  if (status && VALID_STATUSES.includes(status)) {
    query = query.where('status', '==', status);
  }

  // Order by createdAt descending
  const snapshot = await query.orderBy('createdAt', 'desc').limit(limit).get();

  const now = new Date();
  const records = [];

  for (const doc of snapshot.docs) {
    const item = { id: doc.id, ...doc.data() };
    const checkInDate = toDate(item.checkIn);
    const checkOutDate = toDate(item.checkOut);

    // Dynamic MissingCheckout reconciliation if not already marked
    if (
      checkInDate &&
      !checkOutDate &&
      item.status !== 'MissingCheckout' &&
      !item.isManualEdit
    ) {
      const isPastDay =
        now.toDateString() !== checkInDate.toDateString() && now > checkInDate;
      if (isPastDay) {
        item.status = 'MissingCheckout';
        // Auto-persist status update in background
        doc.ref.update({ status: 'MissingCheckout' }).catch(() => {});
      }
    }

    // Filter by date range in memory if provided
    if (startDate && checkInDate && checkInDate < new Date(startDate)) {
      continue;
    }
    if (endDate && checkInDate && checkInDate > new Date(endDate)) {
      continue;
    }

    records.push(serializeTimestamps(item));
  }

  return records;
}

/**
 * Get single attendance record by ID.
 */
async function getAttendanceById(id) {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return serializeTimestamps({ id: doc.id, ...doc.data() });
}

/**
 * Manual Correction: Restricted to HRManager+ (HRManager, HRPayrollManager, Admin).
 * Sets isManualEdit: true.
 */
async function manualCorrection(id, updates = {}, userRole) {
  if (!HR_ROLES.includes(userRole)) {
    const err = new Error(
      'Forbidden: Only HRManager, HRPayrollManager, or Admin can manually correct attendance records'
    );
    err.statusCode = 403;
    throw err;
  }

  const docRef = db.collection(COLLECTION).doc(id);
  const snap = await docRef.get();
  if (!snap.exists) {
    const err = new Error(`Attendance record ${id} not found`);
    err.statusCode = 404;
    throw err;
  }

  const current = snap.data();
  const payload = {
    isManualEdit: true,
  };

  if (updates.status !== undefined) {
    if (!VALID_STATUSES.includes(updates.status)) {
      const err = new Error(
        `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }
    payload.status = updates.status;
  }

  let finalCheckIn = current.checkIn;
  let finalCheckOut = current.checkOut;

  if (updates.checkIn !== undefined) {
    payload.checkIn = updates.checkIn ? toDate(updates.checkIn) : null;
    finalCheckIn = payload.checkIn;
  }
  if (updates.checkOut !== undefined) {
    payload.checkOut = updates.checkOut ? toDate(updates.checkOut) : null;
    finalCheckOut = payload.checkOut;
  }

  if (updates.workedHours !== undefined) {
    payload.workedHours =
      updates.workedHours === null ? null : Number(updates.workedHours);
  } else if (payload.checkIn !== undefined || payload.checkOut !== undefined) {
    // Recompute workedHours if dates were modified and workedHours was not manually supplied
    const inDate = toDate(finalCheckIn);
    const outDate = toDate(finalCheckOut);
    payload.workedHours = calculateWorkedHours(inDate, outDate, 0);
  }

  await docRef.update(payload);
  const updatedSnap = await docRef.get();
  return serializeTimestamps({ id: updatedSnap.id, ...updatedSnap.data() });
}

/**
 * Record an Absent entry for an employee on a scheduled workday.
 */
async function recordAbsent({ employeeId, date, reason = '' }) {
  if (!employeeId) {
    const err = new Error('Field "employeeId" is required');
    err.statusCode = 400;
    throw err;
  }

  const absentDate = date ? toDate(date) : new Date();

  const record = {
    employeeId,
    checkIn: null,
    checkOut: null,
    workedHours: null,
    status: 'Absent',
    isManualEdit: false,
    createdAt: absentDate,
  };

  const docRef = await db.collection(COLLECTION).add(record);
  return serializeTimestamps({ id: docRef.id, ...record });
}

module.exports = {
  COLLECTION,
  VALID_STATUSES,
  checkIn,
  checkOut,
  listAttendance,
  getAttendanceById,
  manualCorrection,
  recordAbsent,
  calculateWorkedHours,
  evaluateStatus,
  findScheduledDayPattern,
  calculateDailyScheduledHours,
};
