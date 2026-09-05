/**
 * Shared Schema Contract Constants (P1 - P3)
 * Locked cross-team constants. Do not deviate or alter casing.
 */

const ROLES = {
  EMPLOYEE: 'Employee',
  HR_MANAGER: 'HRManager',
  HR_PAYROLL_USER: 'HRPayrollUser',
  HR_PAYROLL_MANAGER: 'HRPayrollManager',
  ADMIN: 'Admin',
};

const VALID_ROLES = Object.values(ROLES);

const EMPLOYEE_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

const VALID_EMPLOYEE_STATUSES = Object.values(EMPLOYEE_STATUS);

const CONTRACT_STATUS = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
};

const VALID_CONTRACT_STATUSES = Object.values(CONTRACT_STATUS);

const SCHEDULE_TYPES = {
  FIXED: 'Fixed',
  FLEXIBLE: 'Flexible',
};

const VALID_SCHEDULE_TYPES = Object.values(SCHEDULE_TYPES);

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const ATTENDANCE_STATUS = {
  PRESENT: 'Present',
  LATE: 'Late',
  ABSENT: 'Absent',
  OVERTIME: 'Overtime',
  MISSING_CHECKOUT: 'MissingCheckout',
};

const VALID_ATTENDANCE_STATUSES = Object.values(ATTENDANCE_STATUS);

const TIME_OFF_UNITS = {
  DAYS: 'Days',
  HOURS: 'Hours',
};

const VALID_TIME_OFF_UNITS = Object.values(TIME_OFF_UNITS);

const ALLOCATION_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
};

const VALID_ALLOCATION_STATUSES = Object.values(ALLOCATION_STATUS);

const TIME_OFF_REQUEST_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REFUSED: 'Refused',
};

const VALID_TIME_OFF_REQUEST_STATUSES = Object.values(TIME_OFF_REQUEST_STATUS);

module.exports = {
  ROLES,
  VALID_ROLES,
  EMPLOYEE_STATUS,
  VALID_EMPLOYEE_STATUSES,
  CONTRACT_STATUS,
  VALID_CONTRACT_STATUSES,
  SCHEDULE_TYPES,
  VALID_SCHEDULE_TYPES,
  DAYS_OF_WEEK,
  ATTENDANCE_STATUS,
  VALID_ATTENDANCE_STATUSES,
  TIME_OFF_UNITS,
  VALID_TIME_OFF_UNITS,
  ALLOCATION_STATUS,
  VALID_ALLOCATION_STATUSES,
  TIME_OFF_REQUEST_STATUS,
  VALID_TIME_OFF_REQUEST_STATUSES,
};
