import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Role, AttendanceStatus, TimeOffStatus } from '../src/types';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding for PeoplePay360 (100+ Users & Rich Relational Data)...');

  // 0. Clean existing tables cleanly in dependency order
  await prisma.payslipWarning.deleteMany();
  await prisma.payslipRuleLine.deleteMany();
  await prisma.payslip.deleteMany();
  await prisma.payrunEmployee.deleteMany();
  await prisma.payrun.deleteMany();
  await prisma.timeOffRequest.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.timeOffType.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.salaryStructureRule.deleteMany();
  await prisma.salaryStructure.deleteMany();
  await prisma.salaryRule.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workingScheduleDay.deleteMany();
  await prisma.workingSchedule.deleteMany();
  await prisma.employee.deleteMany();

  console.log('🧹 Cleaned existing database records.');

  // 1. Working Schedules
  const standardSchedule = await prisma.workingSchedule.create({
    data: {
      name: 'Standard Full-Time (40h/week)',
      type: 'Standard',
      totalWeeklyHours: 40.0,
      days: {
        create: [
          { day: 'Monday', startTime: '09:00', endTime: '18:00', breakMins: 60 },
          { day: 'Tuesday', startTime: '09:00', endTime: '18:00', breakMins: 60 },
          { day: 'Wednesday', startTime: '09:00', endTime: '18:00', breakMins: 60 },
          { day: 'Thursday', startTime: '09:00', endTime: '18:00', breakMins: 60 },
          { day: 'Friday', startTime: '09:00', endTime: '18:00', breakMins: 60 }
        ]
      }
    }
  });

  const shiftSchedule = await prisma.workingSchedule.create({
    data: {
      name: 'Shift Support (36h/week)',
      type: 'Shift',
      totalWeeklyHours: 36.0,
      days: {
        create: [
          { day: 'Monday', startTime: '12:00', endTime: '21:30', breakMins: 30 },
          { day: 'Tuesday', startTime: '12:00', endTime: '21:30', breakMins: 30 },
          { day: 'Wednesday', startTime: '12:00', endTime: '21:30', breakMins: 30 },
          { day: 'Thursday', startTime: '12:00', endTime: '21:30', breakMins: 30 }
        ]
      }
    }
  });

  const flexSchedule = await prisma.workingSchedule.create({
    data: {
      name: 'Flexible Engineering (40h/week)',
      type: 'Flexible',
      totalWeeklyHours: 40.0,
      days: {
        create: [
          { day: 'Monday', startTime: '10:00', endTime: '19:00', breakMins: 60 },
          { day: 'Tuesday', startTime: '10:00', endTime: '19:00', breakMins: 60 },
          { day: 'Wednesday', startTime: '10:00', endTime: '19:00', breakMins: 60 },
          { day: 'Thursday', startTime: '10:00', endTime: '19:00', breakMins: 60 },
          { day: 'Friday', startTime: '10:00', endTime: '19:00', breakMins: 60 }
        ]
      }
    }
  });

  // 2. Salary Rules
  const rBasic = await prisma.salaryRule.create({
    data: { name: 'Basic Salary', code: 'BASIC', category: 'Basic', sequence: 1, computeType: 'Fixed', value: 0 }
  });

  const rHra = await prisma.salaryRule.create({
    data: { name: 'House Rent Allowance', code: 'HRA', category: 'Allowance', sequence: 2, computeType: 'Percentage', value: 20, formula: 'BASIC' }
  });

  const rConveyance = await prisma.salaryRule.create({
    data: { name: 'Conveyance Allowance', code: 'CONVEYANCE', category: 'Allowance', sequence: 3, computeType: 'Fixed', value: 350 }
  });

  const rSpecial = await prisma.salaryRule.create({
    data: { name: 'Special Executive Allowance', code: 'EXEC_ALLOW', category: 'Allowance', sequence: 4, computeType: 'Fixed', value: 1200 }
  });

  const rTravel = await prisma.salaryRule.create({
    data: { name: 'Field Travel Allowance', code: 'TRAVEL_ALLOW', category: 'Allowance', sequence: 5, computeType: 'Fixed', value: 800 }
  });

  const rShift = await prisma.salaryRule.create({
    data: { name: 'Night Shift Differential', code: 'SHIFT_ALLOW', category: 'Allowance', sequence: 6, computeType: 'Fixed', value: 500 }
  });

  const rOvertime = await prisma.salaryRule.create({
    data: { name: 'Overtime Pay', code: 'OVERTIME', category: 'Allowance', sequence: 7, computeType: 'Formula', formula: 'OVERTIME_HOURS * (BASIC / 160) * 1.5' }
  });

  const rGross = await prisma.salaryRule.create({
    data: { name: 'Gross Salary', code: 'GROSS', category: 'Gross', sequence: 8, computeType: 'Formula', formula: 'BASIC + HRA + CONVEYANCE + OVERTIME' }
  });

  const rGrossExec = await prisma.salaryRule.create({
    data: { name: 'Executive Gross Salary', code: 'GROSS_EXEC', category: 'Gross', sequence: 9, computeType: 'Formula', formula: 'BASIC + HRA + EXEC_ALLOW + CONVEYANCE' }
  });

  const rGrossSales = await prisma.salaryRule.create({
    data: { name: 'Sales Gross Salary', code: 'GROSS_SALES', category: 'Gross', sequence: 10, computeType: 'Formula', formula: 'BASIC + HRA + TRAVEL_ALLOW' }
  });

  const rGrossSupport = await prisma.salaryRule.create({
    data: { name: 'Support Gross Salary', code: 'GROSS_SUPPORT', category: 'Gross', sequence: 11, computeType: 'Formula', formula: 'BASIC + HRA + SHIFT_ALLOW + OVERTIME' }
  });

  const rPf = await prisma.salaryRule.create({
    data: { name: 'Provident Fund (PF)', code: 'PF', category: 'Deduction', sequence: 12, computeType: 'Percentage', value: 12, formula: 'BASIC' }
  });

  const rHealth = await prisma.salaryRule.create({
    data: { name: 'Health Insurance', code: 'HEALTH_INS', category: 'Deduction', sequence: 13, computeType: 'Fixed', value: 250 }
  });

  const rUnpaidLeave = await prisma.salaryRule.create({
    data: { name: 'Unpaid Leave Deduction', code: 'UNPAID_LEAVE', category: 'Deduction', sequence: 14, computeType: 'Formula', formula: 'UNPAID_LEAVE_DAYS * (BASIC / 30)' }
  });

  const rNet = await prisma.salaryRule.create({
    data: { name: 'Net Salary', code: 'NET', category: 'Net', sequence: 15, computeType: 'Formula', formula: 'GROSS - PF - HEALTH_INS - UNPAID_LEAVE' }
  });

  const rNetExec = await prisma.salaryRule.create({
    data: { name: 'Executive Net Salary', code: 'NET_EXEC', category: 'Net', sequence: 16, computeType: 'Formula', formula: 'GROSS_EXEC - PF - HEALTH_INS - UNPAID_LEAVE' }
  });

  const rNetSales = await prisma.salaryRule.create({
    data: { name: 'Sales Net Salary', code: 'NET_SALES', category: 'Net', sequence: 17, computeType: 'Formula', formula: 'GROSS_SALES - PF - HEALTH_INS - UNPAID_LEAVE' }
  });

  const rNetSupport = await prisma.salaryRule.create({
    data: { name: 'Support Net Salary', code: 'NET_SUPPORT', category: 'Net', sequence: 18, computeType: 'Formula', formula: 'GROSS_SUPPORT - PF - HEALTH_INS - UNPAID_LEAVE' }
  });

  // 3. Salary Structures
  const engStructure = await prisma.salaryStructure.create({
    data: {
      name: 'Engineering & Product Structure',
      status: 'Active',
      rules: {
        create: [
          { salaryRuleId: rBasic.id, position: 1 },
          { salaryRuleId: rHra.id, position: 2 },
          { salaryRuleId: rConveyance.id, position: 3 },
          { salaryRuleId: rOvertime.id, position: 4 },
          { salaryRuleId: rGross.id, position: 5 },
          { salaryRuleId: rPf.id, position: 6 },
          { salaryRuleId: rHealth.id, position: 7 },
          { salaryRuleId: rUnpaidLeave.id, position: 8 },
          { salaryRuleId: rNet.id, position: 9 }
        ]
      }
    }
  });

  const execStructure = await prisma.salaryStructure.create({
    data: {
      name: 'Executive & Leadership Structure',
      status: 'Active',
      rules: {
        create: [
          { salaryRuleId: rBasic.id, position: 1 },
          { salaryRuleId: rHra.id, position: 2 },
          { salaryRuleId: rSpecial.id, position: 3 },
          { salaryRuleId: rConveyance.id, position: 4 },
          { salaryRuleId: rGrossExec.id, position: 5 },
          { salaryRuleId: rPf.id, position: 6 },
          { salaryRuleId: rHealth.id, position: 7 },
          { salaryRuleId: rUnpaidLeave.id, position: 8 },
          { salaryRuleId: rNetExec.id, position: 9 }
        ]
      }
    }
  });

  const salesStructure = await prisma.salaryStructure.create({
    data: {
      name: 'Sales & Marketing Structure',
      status: 'Active',
      rules: {
        create: [
          { salaryRuleId: rBasic.id, position: 1 },
          { salaryRuleId: rHra.id, position: 2 },
          { salaryRuleId: rTravel.id, position: 3 },
          { salaryRuleId: rGrossSales.id, position: 4 },
          { salaryRuleId: rPf.id, position: 5 },
          { salaryRuleId: rHealth.id, position: 6 },
          { salaryRuleId: rUnpaidLeave.id, position: 8 },
          { salaryRuleId: rNetSales.id, position: 9 }
        ]
      }
    }
  });

  const supportStructure = await prisma.salaryStructure.create({
    data: {
      name: 'Support & Operations Structure',
      status: 'Active',
      rules: {
        create: [
          { salaryRuleId: rBasic.id, position: 1 },
          { salaryRuleId: rHra.id, position: 2 },
          { salaryRuleId: rShift.id, position: 3 },
          { salaryRuleId: rOvertime.id, position: 4 },
          { salaryRuleId: rGrossSupport.id, position: 5 },
          { salaryRuleId: rPf.id, position: 6 },
          { salaryRuleId: rHealth.id, position: 7 },
          { salaryRuleId: rUnpaidLeave.id, position: 8 },
          { salaryRuleId: rNetSupport.id, position: 9 }
        ]
      }
    }
  });

  // 4. Time Off Types
  const annualLeave = await prisma.timeOffType.create({
    data: { name: 'Paid Annual Leave', unit: 'Days', requiresAllocation: true, requiresApproval: true, payrollIntegrated: true }
  });

  const sickLeave = await prisma.timeOffType.create({
    data: { name: 'Sick Leave', unit: 'Days', requiresAllocation: true, requiresApproval: true, payrollIntegrated: true }
  });

  const otherLeave = await prisma.timeOffType.create({
    data: { name: 'Other', unit: 'Days', requiresAllocation: true, requiresApproval: true, payrollIntegrated: true }
  });

  const unpaidLeave = await prisma.timeOffType.create({
    data: { name: 'Unpaid Leave', unit: 'Days', requiresAllocation: false, requiresApproval: true, payrollIntegrated: true }
  });

  // 5. Build Comprehensive Employee Hierarchy (Core 7 + ~98 Generated Employees)
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // --- Core 7 Leadership ---
  const empKrish = await prisma.employee.create({
    data: {
      name: 'Krish D R',
      email: 'krish@gmail.com',
      department: 'Executive',
      jobPosition: 'CEO',
      managerId: null,
      managerName: null,
      workingScheduleId: standardSchedule.id,
      status: 'Active'
    }
  });

  const empAnkit = await prisma.employee.create({
    data: {
      name: 'Ankit Singh',
      email: 'ankit@gmail.com',
      department: 'Finance & Payroll',
      jobPosition: 'Head',
      managerId: empKrish.id,
      managerName: empKrish.name,
      workingScheduleId: standardSchedule.id,
      status: 'Active'
    }
  });

  const empDiya = await prisma.employee.create({
    data: {
      name: 'Diya Ann Dennis',
      email: 'diya@gmail.com',
      department: 'Human Resources',
      jobPosition: 'Head',
      managerId: empAnkit.id,
      managerName: empAnkit.name,
      workingScheduleId: standardSchedule.id,
      status: 'Active'
    }
  });

  const empAnna = await prisma.employee.create({
    data: {
      name: 'Anna Theresa',
      email: 'anna@gmail.com',
      department: 'Engineering',
      jobPosition: 'System Engineer',
      managerId: empDiya.id,
      managerName: empDiya.name,
      workingScheduleId: standardSchedule.id,
      status: 'Active'
    }
  });

  const empKT = await prisma.employee.create({
    data: {
      name: 'KT',
      email: 'kt@gmail.com',
      department: 'Engineering',
      jobPosition: 'Software Engineer',
      managerId: empAnna.id,
      managerName: empAnna.name,
      workingScheduleId: flexSchedule.id,
      status: 'Active'
    }
  });

  const empSrikar = await prisma.employee.create({
    data: {
      name: 'Srikar',
      email: 'srikar@gmail.com',
      department: 'Human Resources',
      jobPosition: 'Assistant',
      managerId: empDiya.id,
      managerName: empDiya.name,
      workingScheduleId: standardSchedule.id,
      status: 'Active'
    }
  });

  const empKevin = await prisma.employee.create({
    data: {
      name: 'Kevin',
      email: 'kevin@gmail.com',
      department: 'Engineering',
      jobPosition: 'Software Developer',
      managerId: empKT.id,
      managerName: empKT.name,
      workingScheduleId: flexSchedule.id,
      status: 'Active'
    }
  });

  // Track all employees in list
  interface EmpRecord {
    id: string;
    name: string;
    email: string;
    department: string;
    jobPosition: string;
    role: string;
    wage: number;
    structureId: string;
    scheduleId: string;
    startDate: Date;
    endDate?: Date | null;
  }

  const allEmployeeList: EmpRecord[] = [
    {
      id: empKrish.id,
      name: empKrish.name,
      email: 'krish@gmail.com',
      department: 'Executive',
      jobPosition: 'CEO',
      role: Role.Admin,
      wage: 135000.0,
      structureId: engStructure.id,
      scheduleId: standardSchedule.id,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2027-08-31T23:59:59Z')
    },
    {
      id: empAnkit.id,
      name: empAnkit.name,
      email: 'ankit@gmail.com',
      department: 'Finance & Payroll',
      jobPosition: 'Head',
      role: Role.HRPayrollManager,
      wage: 100000.0,
      structureId: engStructure.id,
      scheduleId: standardSchedule.id,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2027-08-31T23:59:59Z')
    },
    {
      id: empDiya.id,
      name: empDiya.name,
      email: 'diya@gmail.com',
      department: 'Human Resources',
      jobPosition: 'Head',
      role: Role.HRManager,
      wage: 95000.0,
      structureId: engStructure.id,
      scheduleId: standardSchedule.id,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2027-08-31T23:59:59Z')
    },
    {
      id: empAnna.id,
      name: empAnna.name,
      email: 'anna@gmail.com',
      department: 'Engineering',
      jobPosition: 'System Engineer',
      role: Role.Employee,
      wage: 85000.0,
      structureId: engStructure.id,
      scheduleId: standardSchedule.id,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2027-08-31T23:59:59Z')
    },
    {
      id: empKT.id,
      name: empKT.name,
      email: 'kt@gmail.com',
      department: 'Engineering',
      jobPosition: 'Software Engineer',
      role: Role.Employee,
      wage: 65000.0,
      structureId: engStructure.id,
      scheduleId: flexSchedule.id,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: null
    },
    {
      id: empSrikar.id,
      name: empSrikar.name,
      email: 'srikar@gmail.com',
      department: 'Human Resources',
      jobPosition: 'Assistant',
      role: Role.HRPayrollUser,
      wage: 25000.0,
      structureId: engStructure.id,
      scheduleId: standardSchedule.id,
      startDate: new Date('2026-07-01T00:00:00Z'),
      endDate: null
    },
    {
      id: empKevin.id,
      name: empKevin.name,
      email: 'kevin@gmail.com',
      department: 'Engineering',
      jobPosition: 'Software Developer',
      role: Role.Employee,
      wage: 15000.0,
      structureId: engStructure.id,
      scheduleId: flexSchedule.id,
      startDate: new Date('2026-08-01T00:00:00Z'),
      endDate: null
    }
  ];

  // --- Procedural Generation of 98 Additional Realistic Employees ---
  const firstNames = [
    'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
    'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Advaith', 'Kabir', 'Ananya', 'Diya', 'Gauri', 'Aadhya',
    'Pari', 'Anika', 'Navya', 'Angel', 'Riya', 'Myra', 'Ira', 'Avani', 'Sara', 'Prisha',
    'Dev', 'Rohan', 'Amit', 'Priya', 'Sneha', 'Vikram', 'Tanya', 'Rahul', 'Pooja', 'Meera',
    'Siddharth', 'Neha', 'Rajesh', 'Karthik', 'Kavita', 'Varun', 'Sanjay', 'Deepika', 'Manish', 'Nisha',
    'Gaurav', 'Swati', 'Alok', 'Bhavna', 'Chetan', 'Divya', 'Eshaan', 'Farhan', 'Gayatri', 'Harsh',
    'Indu', 'Jatin', 'Kiran', 'Lokesh', 'Madhuri', 'Nikhil', 'Omkar', 'Pallavi', 'Qasim', 'Rashmi',
    'Sameer', 'Tarun', 'Urvashi', 'Vikas', 'Wasim', 'Yash', 'Zoya', 'Tanvi', 'Abhishek', 'Shweta',
    'Ramesh', 'Suresh', 'Preeti', 'Sunil', 'Komal', 'Mohit', 'Payal', 'Sachin', 'Sonali', 'Rohit',
    'Akash', 'Shruti', 'Mayank', 'Richa', 'Nitin', 'Shilpa', 'Vipul', 'Ritu'
  ];

  const lastNames = [
    'Sharma', 'Verma', 'Patel', 'Reddy', 'Nair', 'Rao', 'Joshi', 'Sen', 'Iyer', 'Pillai',
    'Roy', 'Kapoor', 'Gupta', 'Sundaram', 'Menon', 'Singhal', 'Bhat', 'Chopra', 'Malhotra', 'Mehta',
    'Deshmukh', 'Kulkarni', 'Banerjee', 'Chatterjee', 'Dutta', 'Ghosh', 'Das', 'Mukherjee', 'Saxena', 'Pandey',
    'Mishra', 'Tripathi', 'Trivedi', 'Aggarwal', 'Garg', 'Bansal', 'Jain', 'Shah', 'Patil', 'Pawar',
    'Shinde', 'Jadhav', 'More', 'Chavan', 'Gowda', 'Shetty', 'Hegde', 'Kamath', 'Pai', 'Shenoy'
  ];

  const departmentConfigs = [
    {
      dept: 'Engineering',
      managerId: empAnna.id,
      managerName: empAnna.name,
      structureId: engStructure.id,
      scheduleId: flexSchedule.id,
      positions: [
        { title: 'Senior Backend Engineer', wage: 82000, role: Role.Employee },
        { title: 'Full Stack Engineer', wage: 72000, role: Role.Employee },
        { title: 'Frontend Developer', wage: 62000, role: Role.Employee },
        { title: 'DevOps & Cloud Engineer', wage: 78000, role: Role.Employee },
        { title: 'QA Automation Engineer', wage: 58000, role: Role.Employee },
        { title: 'Site Reliability Engineer', wage: 75000, role: Role.Employee },
        { title: 'Data Engineer', wage: 74000, role: Role.Employee },
        { title: 'Mobile App Developer', wage: 65000, role: Role.Employee },
        { title: 'Junior Software Engineer', wage: 42000, role: Role.Employee },
        { title: 'Security Engineer', wage: 80000, role: Role.Employee }
      ]
    },
    {
      dept: 'Product & Design',
      managerId: empKrish.id,
      managerName: empKrish.name,
      structureId: engStructure.id,
      scheduleId: standardSchedule.id,
      positions: [
        { title: 'Principal Product Manager', wage: 115000, role: Role.Admin },
        { title: 'Senior Product Manager', wage: 92000, role: Role.Employee },
        { title: 'Lead UI/UX Designer', wage: 84000, role: Role.Employee },
        { title: 'Product Designer', wage: 68000, role: Role.Employee },
        { title: 'Design System Specialist', wage: 62000, role: Role.Employee },
        { title: 'Technical Product Owner', wage: 78000, role: Role.Employee }
      ]
    },
    {
      dept: 'Finance & Payroll',
      managerId: empAnkit.id,
      managerName: empAnkit.name,
      structureId: execStructure.id,
      scheduleId: standardSchedule.id,
      positions: [
        { title: 'Senior Payroll Manager', wage: 88000, role: Role.HRPayrollManager },
        { title: 'Lead Financial Analyst', wage: 82000, role: Role.HRPayrollManager },
        { title: 'Senior Accountant', wage: 65000, role: Role.HRPayrollUser },
        { title: 'Payroll Specialist', wage: 52000, role: Role.HRPayrollUser },
        { title: 'Internal Audit Associate', wage: 54000, role: Role.HRPayrollUser },
        { title: 'Accounts Payable Clerk', wage: 38000, role: Role.HRPayrollUser }
      ]
    },
    {
      dept: 'Human Resources',
      managerId: empDiya.id,
      managerName: empDiya.name,
      structureId: execStructure.id,
      scheduleId: standardSchedule.id,
      positions: [
        { title: 'Senior HR Business Partner', wage: 82000, role: Role.HRManager },
        { title: 'Talent Acquisition Lead', wage: 76000, role: Role.HRManager },
        { title: 'Technical Recruiter', wage: 58000, role: Role.HRPayrollUser },
        { title: 'HR Operations Specialist', wage: 48000, role: Role.HRPayrollUser },
        { title: 'People & Culture Associate', wage: 44000, role: Role.HRPayrollUser },
        { title: 'Learning & Development Lead', wage: 68000, role: Role.HRManager }
      ]
    },
    {
      dept: 'Sales & Marketing',
      managerId: empKrish.id,
      managerName: empKrish.name,
      structureId: salesStructure.id,
      scheduleId: standardSchedule.id,
      positions: [
        { title: 'VP of Global Sales', wage: 130000, role: Role.Admin },
        { title: 'Enterprise Account Executive', wage: 90000, role: Role.Employee },
        { title: 'Senior Marketing Manager', wage: 85000, role: Role.Employee },
        { title: 'Growth Specialist', wage: 62000, role: Role.Employee },
        { title: 'Business Development Rep', wage: 45000, role: Role.Employee },
        { title: 'Content & Social Lead', wage: 52000, role: Role.Employee }
      ]
    },
    {
      dept: 'Customer Support & Operations',
      managerId: empKrish.id,
      managerName: empKrish.name,
      structureId: supportStructure.id,
      scheduleId: shiftSchedule.id,
      positions: [
        { title: 'Operations Director', wage: 105000, role: Role.Admin },
        { title: 'Customer Support Lead', wage: 65000, role: Role.Employee },
        { title: 'Technical Support Specialist', wage: 48000, role: Role.Employee },
        { title: 'Operations Coordinator', wage: 42000, role: Role.Employee },
        { title: 'Customer Success Manager', wage: 58000, role: Role.Employee },
        { title: 'Support Representative', wage: 32000, role: Role.Employee }
      ]
    },
    {
      dept: 'Legal & Compliance',
      managerId: empKrish.id,
      managerName: empKrish.name,
      structureId: execStructure.id,
      scheduleId: standardSchedule.id,
      positions: [
        { title: 'Chief Legal Counsel', wage: 140000, role: Role.Admin },
        { title: 'Senior Compliance Officer', wage: 86000, role: Role.HRManager },
        { title: 'Data Privacy Specialist', wage: 72000, role: Role.Employee }
      ]
    }
  ];

  let nameIndex = 0;
  let targetTotal = 105; // 7 core + 98 generated = 105 total

  for (let i = 0; i < 98; i++) {
    const fn = firstNames[nameIndex % firstNames.length];
    const ln = lastNames[(nameIndex + Math.floor(nameIndex / firstNames.length)) % lastNames.length];
    nameIndex++;

    const fullName = `${fn} ${ln}`;
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i > 40 ? i : ''}@peoplepay360.com`;

    const deptConfig = departmentConfigs[i % departmentConfigs.length];
    const pos = deptConfig.positions[i % deptConfig.positions.length];

    // Stagger start dates: some in 2025, some in Jan 2026, some in March/June 2026
    const startMonths = [0, 1, 2, 4, 5];
    const startMonth = startMonths[i % startMonths.length];
    const startYear = i % 5 === 0 ? 2025 : 2026;
    const startDate = new Date(startYear, startMonth, 1);

    const emp = await prisma.employee.create({
      data: {
        name: fullName,
        email,
        department: deptConfig.dept,
        jobPosition: pos.title,
        managerId: deptConfig.managerId,
        managerName: deptConfig.managerName,
        workingScheduleId: deptConfig.scheduleId,
        status: 'Active'
      }
    });

    allEmployeeList.push({
      id: emp.id,
      name: fullName,
      email,
      department: deptConfig.dept,
      jobPosition: pos.title,
      role: pos.role,
      wage: pos.wage,
      structureId: deptConfig.structureId,
      scheduleId: deptConfig.scheduleId,
      startDate,
      endDate: null
    });
  }

  console.log(`✅ Created ${allEmployeeList.length} employees across all departments.`);

  // 6. Create Contracts for All Employees
  for (const item of allEmployeeList) {
    await prisma.contract.create({
      data: {
        employeeId: item.id,
        startDate: item.startDate,
        endDate: item.endDate || null,
        wage: item.wage,
        salaryStructureId: item.structureId,
        department: item.department,
        jobPosition: item.jobPosition,
        status: 'Active'
      }
    });
  }
  console.log(`✅ Created ${allEmployeeList.length} active employment contracts.`);

  // 7. Create User Accounts for All Employees
  for (const item of allEmployeeList) {
    await prisma.user.create({
      data: {
        name: item.name,
        email: item.email,
        passwordHash,
        role: item.role,
        employeeId: item.id,
        status: 'Active'
      }
    });
  }

  // Generic Demo Role Accounts (unlinked to allow independent role testing)
  await prisma.user.create({
    data: { name: 'System Administrator', email: 'admin@peoplepay360.com', passwordHash, role: Role.Admin, employeeId: null, status: 'Active' }
  });
  await prisma.user.create({
    data: { name: 'HR Manager', email: 'hrmanager@peoplepay360.com', passwordHash, role: Role.HRManager, employeeId: null, status: 'Active' }
  });
  await prisma.user.create({
    data: { name: 'HR Payroll Manager', email: 'payrollmgr@peoplepay360.com', passwordHash, role: Role.HRPayrollManager, employeeId: null, status: 'Active' }
  });
  await prisma.user.create({
    data: { name: 'HR Payroll User', email: 'payrolluser@peoplepay360.com', passwordHash, role: Role.HRPayrollUser, employeeId: null, status: 'Active' }
  });
  await prisma.user.create({
    data: { name: 'Employee', email: 'employee@peoplepay360.com', passwordHash, role: Role.Employee, employeeId: null, status: 'Active' }
  });

  console.log(`✅ Created ${allEmployeeList.length + 5} user accounts with password 'Password123!'.`);

  // 8. Time Off Allocations for All Employees
  const yearStart = new Date(2026, 0, 1);
  const nextYear = new Date(2027, 11, 31);

  for (const emp of allEmployeeList) {
    await prisma.allocation.create({
      data: {
        employeeId: emp.id,
        timeOffTypeId: annualLeave.id,
        allocatedAmount: 20.0,
        takenAmount: 0.0,
        remainingAmount: 20.0,
        validFrom: yearStart,
        validTo: nextYear,
        status: 'Approved'
      }
    });

    await prisma.allocation.create({
      data: {
        employeeId: emp.id,
        timeOffTypeId: sickLeave.id,
        allocatedAmount: 10.0,
        takenAmount: 0.0,
        remainingAmount: 10.0,
        validFrom: yearStart,
        validTo: nextYear,
        status: 'Approved'
      }
    });
  }
  console.log(`✅ Created ${allEmployeeList.length * 2} leave allocations (Annual & Sick Leaves).`);

  // 9. Time Off Requests (Realistic Spread of Paid, Sick, and Unpaid Leaves)
  const sampleRequestTemplates = [
    { typeId: annualLeave.id, days: 2, status: TimeOffStatus.Approved, reason: 'Family vacation and rest', month: 6, startDay: 10 },
    { typeId: sickLeave.id, days: 1, status: TimeOffStatus.Approved, reason: 'Doctor appointment and fever recovery', month: 6, startDay: 22 },
    { typeId: unpaidLeave.id, days: 2, status: TimeOffStatus.Approved, reason: 'Personal emergency leave', month: 7, startDay: 14 },
    { typeId: annualLeave.id, days: 3, status: TimeOffStatus.Approved, reason: 'Summer trip with family', month: 7, startDay: 25 },
    { typeId: unpaidLeave.id, days: 1, status: TimeOffStatus.Approved, reason: 'Extended relocation travel', month: 8, startDay: 6 },
    { typeId: sickLeave.id, days: 2, status: TimeOffStatus.Approved, reason: 'Viral infection medical rest', month: 8, startDay: 18 },
    { typeId: annualLeave.id, days: 4, status: TimeOffStatus.Pending, reason: 'Upcoming festival celebration', month: 8, startDay: 28 },
    { typeId: unpaidLeave.id, days: 3, status: TimeOffStatus.Pending, reason: 'Unpaid personal sabbatical request', month: 9, startDay: 2 },
    { typeId: otherLeave.id, days: 1, status: TimeOffStatus.Refused, reason: 'Short notice personal leave', month: 7, startDay: 5 }
  ];

  let totalRequests = 0;
  for (let idx = 0; idx < allEmployeeList.length; idx++) {
    // Generate ~1-2 requests per 2-3 employees
    if (idx % 2 === 0) {
      const tmpl = sampleRequestTemplates[(idx * 3) % sampleRequestTemplates.length];
      const sDate = new Date(2026, tmpl.month - 1, tmpl.startDay);
      const eDate = new Date(sDate);
      eDate.setDate(eDate.getDate() + tmpl.days - 1);

      await prisma.timeOffRequest.create({
        data: {
          employeeId: allEmployeeList[idx].id,
          timeOffTypeId: tmpl.typeId,
          startDate: sDate,
          endDate: eDate,
          duration: tmpl.days,
          status: tmpl.status,
          reason: tmpl.reason
        }
      });
      totalRequests++;
    }
  }
  console.log(`✅ Created ${totalRequests} realistic time off requests.`);

  // 10. Attendance Records (June 1, 2026 to Sept 5, 2026 across all employees)
  const attendanceStartDate = new Date(2026, 5, 1); // June 1, 2026
  const attendanceEndDate = new Date(2026, 8, 5);   // Sept 5, 2026

  let curDate = new Date(attendanceStartDate);
  let totalAttendanceCount = 0;
  let dayIndex = 0;
  const statusCounts = { Present: 0, Overtime: 0, Late: 0, MissingCheckout: 0, manualEdits: 0 };

  const attendanceBatch: any[] = [];

  while (curDate <= attendanceEndDate) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Monday to Friday
      dayIndex++;
      for (let empIdx = 0; empIdx < allEmployeeList.length; empIdx++) {
        const emp = allEmployeeList[empIdx];

        // If employee contract starts after this date, skip
        if (emp.startDate > curDate) continue;

        let status = AttendanceStatus.Present;
        let checkIn = new Date(curDate);
        let checkOut: Date | null = new Date(curDate);
        let workedHours = 8.0;
        let isManualEdit = false;

        // Missing checkouts (~2.5%)
        if ((dayIndex + empIdx * 7) % 37 === 13) {
          status = AttendanceStatus.MissingCheckout;
          checkIn.setHours(9, 0, 0, 0);
          checkOut = null;
          workedHours = 0.0;
          statusCounts.MissingCheckout++;
        }
        // Overtime (~7.5%)
        else if ((dayIndex + empIdx * 3) % 13 === 2) {
          status = AttendanceStatus.Overtime;
          checkIn.setHours(9, 0, 0, 0);
          checkOut.setHours(20, 30, 0, 0);
          workedHours = 10.5;
          statusCounts.Overtime++;
        }
        // Late arrivals (~4.5%)
        else if ((dayIndex + empIdx * 5) % 23 === 4) {
          status = AttendanceStatus.Late;
          checkIn.setHours(9, 45, 0, 0);
          checkOut.setHours(18, 0, 0, 0);
          workedHours = 7.25;
          statusCounts.Late++;
        }
        // Standard Present
        else {
          status = AttendanceStatus.Present;
          checkIn.setHours(9, 0, 0, 0);
          checkOut.setHours(18, 0, 0, 0);
          workedHours = 8.0;
          statusCounts.Present++;
        }

        // Manual HR Edits (~2%)
        if ((dayIndex + empIdx * 11) % 47 === 5) {
          isManualEdit = true;
          statusCounts.manualEdits++;
        }

        attendanceBatch.push({
          employeeId: emp.id,
          checkIn,
          checkOut,
          workedHours,
          status,
          isManualEdit
        });
      }
    }
    curDate.setDate(curDate.getDate() + 1);
  }

  // Insert attendances in chunks for optimal performance
  const chunkSize = 500;
  for (let c = 0; c < attendanceBatch.length; c += chunkSize) {
    const chunk = attendanceBatch.slice(c, c + chunkSize);
    await prisma.attendance.createMany({
      data: chunk
    });
  }
  totalAttendanceCount = attendanceBatch.length;

  console.log(`✅ Created ${totalAttendanceCount} attendance records from June 1, 2026 to September 5, 2026:`);
  console.log(`   • Present (On-Time):    ${statusCounts.Present}`);
  console.log(`   • Overtime Worked:      ${statusCounts.Overtime}`);
  console.log(`   • Late Arrivals:        ${statusCounts.Late}`);
  console.log(`   • Missing Check-Outs:   ${statusCounts.MissingCheckout}`);
  console.log(`   • Manual HR Edits:      ${statusCounts.manualEdits}`);
  console.log('✅ Seeding completed successfully! (Clean Payruns ready for wizard execution)');
  console.log('🔑 Primary Leadership Login Credentials (All Password: Password123!):');
  console.log('   • krish@gmail.com (CEO / Admin)');
  console.log('   • ankit@gmail.com (Finance Head / HRPayrollManager)');
  console.log('   • diya@gmail.com (HR Head / HRManager)');
  console.log('   • srikar@gmail.com (HR Assistant / HRPayrollUser)');
  console.log('   • kevin@gmail.com (Dev / Employee)');
  console.log('   • anna@gmail.com (System Engineer / Employee)');
  console.log('   • kt@gmail.com (Software Engineer / Employee)');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
