import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Role, AttendanceStatus, TimeOffStatus } from '../src/types';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for PeoplePay360...');

  // Clean existing tables
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

  const rOvertime = await prisma.salaryRule.create({
    data: { name: 'Overtime Pay', code: 'OVERTIME', category: 'Allowance', sequence: 5, computeType: 'Formula', formula: 'OVERTIME_HOURS * (BASIC / 160) * 1.5' }
  });

  const rGross = await prisma.salaryRule.create({
    data: { name: 'Gross Salary', code: 'GROSS', category: 'Gross', sequence: 6, computeType: 'Formula', formula: 'BASIC + HRA + CONVEYANCE + OVERTIME' }
  });

  const rPf = await prisma.salaryRule.create({
    data: { name: 'Provident Fund (PF)', code: 'PF', category: 'Deduction', sequence: 7, computeType: 'Percentage', value: 12, formula: 'BASIC' }
  });

  const rHealth = await prisma.salaryRule.create({
    data: { name: 'Health Insurance', code: 'HEALTH_INS', category: 'Deduction', sequence: 8, computeType: 'Fixed', value: 250 }
  });

  const rUnpaidLeave = await prisma.salaryRule.create({
    data: { name: 'Unpaid Leave Deduction', code: 'UNPAID_LEAVE', category: 'Deduction', sequence: 9, computeType: 'Formula', formula: 'UNPAID_LEAVE_DAYS * (BASIC / 30)' }
  });

  const rNet = await prisma.salaryRule.create({
    data: { name: 'Net Salary', code: 'NET', category: 'Net', sequence: 10, computeType: 'Formula', formula: 'GROSS - PF - HEALTH_INS - UNPAID_LEAVE' }
  });

  // 3. Salary Structures
  const techStructure = await prisma.salaryStructure.create({
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

  // 5. Employees in hierarchy
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
      workingScheduleId: standardSchedule.id,
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
      workingScheduleId: standardSchedule.id,
      status: 'Active'
    }
  });

  const allEmployees = [empKrish, empAnkit, empDiya, empAnna, empKT, empSrikar, empKevin];

  // 6. Contracts matching exact specification
  await prisma.contract.create({
    data: {
      employeeId: empKevin.id,
      startDate: new Date('2026-08-01T00:00:00Z'),
      endDate: null,
      wage: 15000.0,
      salaryStructureId: techStructure.id,
      department: 'Engineering',
      jobPosition: 'Software Developer',
      status: 'Active'
    }
  });

  await prisma.contract.create({
    data: {
      employeeId: empSrikar.id,
      startDate: new Date('2026-07-01T00:00:00Z'),
      endDate: null,
      wage: 25000.0,
      salaryStructureId: techStructure.id,
      department: 'Human Resources',
      jobPosition: 'Assistant',
      status: 'Active'
    }
  });

  await prisma.contract.create({
    data: {
      employeeId: empKrish.id,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2027-08-31T23:59:59Z'),
      wage: 135000.0,
      salaryStructureId: techStructure.id,
      department: 'Executive',
      jobPosition: 'CEO',
      status: 'Active'
    }
  });

  await prisma.contract.create({
    data: {
      employeeId: empAnkit.id,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2027-08-31T23:59:59Z'),
      wage: 100000.0,
      salaryStructureId: techStructure.id,
      department: 'Finance & Payroll',
      jobPosition: 'Head',
      status: 'Active'
    }
  });

  await prisma.contract.create({
    data: {
      employeeId: empDiya.id,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2027-08-31T23:59:59Z'),
      wage: 95000.0,
      salaryStructureId: techStructure.id,
      department: 'Human Resources',
      jobPosition: 'Head',
      status: 'Active'
    }
  });

  await prisma.contract.create({
    data: {
      employeeId: empAnna.id,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2027-08-31T23:59:59Z'),
      wage: 85000.0,
      salaryStructureId: techStructure.id,
      department: 'Engineering',
      jobPosition: 'System Engineer',
      status: 'Active'
    }
  });

  await prisma.contract.create({
    data: {
      employeeId: empKT.id,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: null,
      wage: 65000.0,
      salaryStructureId: techStructure.id,
      department: 'Engineering',
      jobPosition: 'Software Engineer',
      status: 'Active'
    }
  });

  // 7. Users (Password: Password123!)
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // Direct accounts for all 7 employees
  await prisma.user.create({
    data: {
      name: 'Krish D R',
      email: 'krish@gmail.com',
      passwordHash,
      role: Role.Admin,
      employeeId: empKrish.id,
      status: 'Active'
    }
  });

  await prisma.user.create({
    data: {
      name: 'Diya Ann Dennis',
      email: 'diya@gmail.com',
      passwordHash,
      role: Role.HRManager,
      employeeId: empDiya.id,
      status: 'Active'
    }
  });

  await prisma.user.create({
    data: {
      name: 'Ankit Singh',
      email: 'ankit@gmail.com',
      passwordHash,
      role: Role.HRPayrollManager,
      employeeId: empAnkit.id,
      status: 'Active'
    }
  });

  await prisma.user.create({
    data: {
      name: 'Srikar',
      email: 'srikar@gmail.com',
      passwordHash,
      role: Role.HRPayrollUser,
      employeeId: empSrikar.id,
      status: 'Active'
    }
  });

  await prisma.user.create({
    data: {
      name: 'Kevin',
      email: 'kevin@gmail.com',
      passwordHash,
      role: Role.Employee,
      employeeId: empKevin.id,
      status: 'Active'
    }
  });

  await prisma.user.create({
    data: {
      name: 'Anna Theresa',
      email: 'anna@gmail.com',
      passwordHash,
      role: Role.Employee,
      employeeId: empAnna.id,
      status: 'Active'
    }
  });

  await prisma.user.create({
    data: {
      name: 'KT',
      email: 'kt@gmail.com',
      passwordHash,
      role: Role.Employee,
      employeeId: empKT.id,
      status: 'Active'
    }
  });

  // Generic role demo accounts (employeeId: null to avoid unique constraint collisions)
  await prisma.user.create({
    data: {
      name: 'System Administrator',
      email: 'admin@peoplepay360.com',
      passwordHash,
      role: Role.Admin,
      employeeId: null,
      status: 'Active'
    }
  });

  await prisma.user.create({
    data: {
      name: 'HR Manager',
      email: 'hrmanager@peoplepay360.com',
      passwordHash,
      role: Role.HRManager,
      employeeId: null,
      status: 'Active'
    }
  });

  await prisma.user.create({
    data: {
      name: 'HR Payroll Manager',
      email: 'payrollmgr@peoplepay360.com',
      passwordHash,
      role: Role.HRPayrollManager,
      employeeId: null,
      status: 'Active'
    }
  });

  await prisma.user.create({
    data: {
      name: 'HR Payroll User',
      email: 'payrolluser@peoplepay360.com',
      passwordHash,
      role: Role.HRPayrollUser,
      employeeId: null,
      status: 'Active'
    }
  });

  await prisma.user.create({
    data: {
      name: 'Employee',
      email: 'employee@peoplepay360.com',
      passwordHash,
      role: Role.Employee,
      employeeId: null,
      status: 'Active'
    }
  });

  // 8. Leave Allocations
  const yearStart = new Date(2026, 0, 1);
  const nextYear = new Date(2027, 11, 31);

  for (const emp of allEmployees) {
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

  // 9. Attendance Records (June 1, 2026 to Sept 5, 2026 with Overtime, Late, Missing Check-outs, Manual Edits)
  const attendanceStartDate = new Date(2026, 5, 1); // June 1, 2026
  const attendanceEndDate = new Date(2026, 8, 5);   // Sept 5, 2026

  let curDate = new Date(attendanceStartDate);
  let totalAttendanceCount = 0;
  let dayIndex = 0;
  const statusCounts = { Present: 0, Overtime: 0, Late: 0, MissingCheckout: 0, manualEdits: 0 };

  while (curDate <= attendanceEndDate) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Monday to Friday
      dayIndex++;
      for (let empIdx = 0; empIdx < allEmployees.length; empIdx++) {
        const emp = allEmployees[empIdx];
        let status = AttendanceStatus.Present;
        let checkIn = new Date(curDate);
        let checkOut: Date | null = new Date(curDate);
        let workedHours = 8.0;
        let isManualEdit = false;

        // Missing checkouts (~14 occurrences)
        if ((dayIndex + empIdx * 7) % 35 === 13) {
          status = AttendanceStatus.MissingCheckout;
          checkIn.setHours(9, 0, 0, 0);
          checkOut = null;
          workedHours = 0.0;
          statusCounts.MissingCheckout++;
        }
        // Overtime (~43 occurrences)
        else if ((dayIndex + empIdx * 3) % 11 === 2) {
          status = AttendanceStatus.Overtime;
          checkIn.setHours(9, 0, 0, 0);
          checkOut.setHours(20, 30, 0, 0);
          workedHours = 10.5;
          statusCounts.Overtime++;
        }
        // Late arrivals (~25 occurrences)
        else if ((dayIndex + empIdx * 5) % 17 === 3) {
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

        // Manual HR Edits (~13 occurrences)
        if ((dayIndex + empIdx * 11) % 37 === 5) {
          isManualEdit = true;
          statusCounts.manualEdits++;
        }

        await prisma.attendance.create({
          data: {
            employeeId: emp.id,
            checkIn,
            checkOut,
            workedHours,
            status,
            isManualEdit
          }
        });
        totalAttendanceCount++;
      }
    }
    curDate.setDate(curDate.getDate() + 1);
  }

  console.log(`✅ Created ${totalAttendanceCount} attendance records from June 1, 2026 to September 5, 2026:`);
  console.log(`   • Present (On-Time):    ${statusCounts.Present}`);
  console.log(`   • Overtime Worked:      ${statusCounts.Overtime}`);
  console.log(`   • Late Arrivals:        ${statusCounts.Late}`);
  console.log(`   • Missing Check-Outs:   ${statusCounts.MissingCheckout}`);
  console.log(`   • Manual HR Edits:      ${statusCounts.manualEdits}`);
  console.log('✅ Seeding completed successfully! (No pre-computed payruns - ready for wizard run)');
  console.log('🔑 Demo Login Credentials:');
  console.log('   • krish@gmail.com / Password123! (CEO / Admin)');
  console.log('   • ankit@gmail.com / Password123! (Finance Head / Payroll Manager)');
  console.log('   • diya@gmail.com / Password123! (HR Head / HR Manager)');
  console.log('   • srikar@gmail.com / Password123! (HR Assistant / Payroll User)');
  console.log('   • kevin@gmail.com / Password123! (Dev / Employee)');
  console.log('   • anna@gmail.com / Password123! (Engineer / Employee)');
  console.log('   • kt@gmail.com / Password123! (Engineer / Employee)');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
