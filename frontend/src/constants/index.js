/**
 * Shared Schema Contract Constants (P1 - P3)
 * Locked cross-team constants for Frontend. Do not deviate or alter casing.
 */

export const ROLES = {
  EMPLOYEE: 'Employee',
  HR_MANAGER: 'HRManager',
  HR_PAYROLL_USER: 'HRPayrollUser',
  HR_PAYROLL_MANAGER: 'HRPayrollManager',
  ADMIN: 'Admin',
};

export const VALID_ROLES = Object.values(ROLES);

export const EMPLOYEE_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

export const VALID_EMPLOYEE_STATUSES = Object.values(EMPLOYEE_STATUS);

export const CONTRACT_STATUS = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
};

export const VALID_CONTRACT_STATUSES = Object.values(CONTRACT_STATUS);

export const SCHEDULE_TYPES = {
  FIXED: 'Fixed',
  FLEXIBLE: 'Flexible',
};

export const VALID_SCHEDULE_TYPES = Object.values(SCHEDULE_TYPES);

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
