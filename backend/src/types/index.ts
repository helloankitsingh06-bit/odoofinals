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
}
