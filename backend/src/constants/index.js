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
};
