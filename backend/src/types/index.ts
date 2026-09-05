export enum Role {
  Employee = 'Employee',
  HRManager = 'HRManager',
  HRPayrollUser = 'HRPayrollUser',
  HRPayrollManager = 'HRPayrollManager',
  Admin = 'Admin'
}

export enum AttendanceStatus {
  Present = 'Present',
  Late = 'Late',
  Absent = 'Absent',
  Overtime = 'Overtime',
  MissingCheckout = 'MissingCheckout'
}

export enum ContractStatus {
  Draft = 'Draft',
  Active = 'Active',
  Expired = 'Expired'
}

export enum TimeOffUnit {
  Days = 'Days',
  Hours = 'Hours'
}

export enum TimeOffStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Refused = 'Refused'
}

export enum RuleCategory {
  Basic = 'Basic',
  Allowance = 'Allowance',
  Gross = 'Gross',
  Deduction = 'Deduction',
  Net = 'Net'
}

export enum ComputeType {
  Fixed = 'Fixed',
  Percentage = 'Percentage',
  Formula = 'Formula'
}

export enum PayrunStatus {
  Draft = 'Draft',
  Computed = 'Computed',
  Validated = 'Validated',
  Paid = 'Paid'
}

export enum WarningType {
  Warning = 'Warning',
  Error = 'Error',
  Info = 'Info'
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  employeeId?: string | null;
  mustChangePassword?: boolean;
}

export const VALID_ROLES: Role[] = [
  Role.Employee,
  Role.HRManager,
  Role.HRPayrollUser,
  Role.HRPayrollManager,
  Role.Admin
];

/**
 * Generate a random temporary password (10-char alphanumeric, mixed case + digits).
 * Used when an Admin creates an Employee and we provision their User account.
 */
export function generateTempPassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
