import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { computeEmployeePayslip, RuleDefinition } from '../src/services/payrollEngine';
import { Role, AttendanceStatus, TimeOffStatus, PayrunStatus } from '../src/types';

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

  const rGross = await prisma.salaryRule.create({
    data: { name: 'Gross Salary', code: 'GROSS', category: 'Gross', sequence: 5, computeType: 'Formula', formula: 'BASIC + HRA + CONVEYANCE' }
  });

  const rPf = await prisma.salaryRule.create({
    data: { name: 'Provident Fund (PF)', code: 'PF', category: 'Deduction', sequence: 6, computeType: 'Percentage', value: 12, formula: 'BASIC' }
  });

  const rHealth = await prisma.salaryRule.create({
    data: { name: 'Health Insurance', code: 'HEALTH_INS', category: 'Deduction', sequence: 7, computeType: 'Fixed', value: 250 }
  });

  const rNet = await prisma.salaryRule.create({
    data: { name: 'Net Salary', code: 'NET', category: 'Net', sequence: 8, computeType: 'Formula', formula: 'GROSS - PF - HEALTH_INS' }
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
          { salaryRuleId: rGross.id, position: 4 },
          { salaryRuleId: rPf.id, position: 5 },
          { salaryRuleId: rHealth.id, position: 6 },
          { salaryRuleId: rNet.id, position: 7 }
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

  const hourlyOff = await prisma.timeOffType.create({
    data: { name: 'Personal Floating Time', unit: 'Hours', requiresAllocation: true, requiresApproval: true, payrollIntegrated: true }
  });

  // 5. Employees
  const empCEO = await prisma.employee.create({
    data: {
      name: 'Eleanor Vance',
      email: 'eleanor.vance@peoplepay360.com',
      department: 'Executive',
      jobPosition: 'Chief Executive Officer',
      workingScheduleId: standardSchedule.id,
      status: 'Active'
    }
  });

  const empHRLead = await prisma.employee.create({
    data: {
      name: 'Marcus Sterling',
      email: 'marcus.sterling@peoplepay360.com',
      department: 'Human Resources',
      jobPosition: 'Head of People & Culture',
      managerId: empCEO.id,
      workingScheduleId: standardSchedule.id,
      status: 'Active'
    }
  });

  const empPayrollMgr = await prisma.employee.create({
    data: {
      name: 'Sophia Chen',
      email: 'sophia.chen@peoplepay360.com',
      department: 'Finance & Payroll',
      jobPosition: 'Payroll Director',
      managerId: empCEO.id,
      workingScheduleId: standardSchedule.id,
      status: 'Active'
    }
  });

  const empSeniorDev = await prisma.employee.create({
    data: {
      name: 'Devon Hayes',
      email: 'devon.hayes@peoplepay360.com',
      department: 'Engineering',
      jobPosition: 'Principal Staff Engineer',
      managerId: empCEO.id,
      workingScheduleId: standardSchedule.id,
      status: 'Active'
    }
  });

  const empDev2 = await prisma.employee.create({
    data: {
      name: 'Aaliyah Patel',
      email: 'aaliyah.patel@peoplepay360.com',
      department: 'Engineering',
      jobPosition: 'Senior Full Stack Engineer',
      managerId: empSeniorDev.id,
      workingScheduleId: standardSchedule.id,
      status: 'Active'
    }
  });

  const empDev3 = await prisma.employee.create({
    data: {
      name: 'Lucas Thorne',
      email: 'lucas.thorne@peoplepay360.com',
      department: 'Engineering',
      jobPosition: 'Frontend Architect',
      managerId: empSeniorDev.id,
      workingScheduleId: standardSchedule.id,
      status: 'Active'
    }
  });

  // 6. Contracts
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const nextYear = new Date(now.getFullYear() + 1, 11, 31);

  const contractDevon = await prisma.contract.create({
    data: {
      employeeId: empSeniorDev.id,
      startDate: yearStart,
      endDate: nextYear,
      wage: 8500.0,
      salaryStructureId: techStructure.id,
      department: 'Engineering',
      jobPosition: 'Principal Staff Engineer',
      status: 'Active'
    }
  });

  const contractAaliyah = await prisma.contract.create({
    data: {
      employeeId: empDev2.id,
      startDate: yearStart,
      endDate: nextYear,
      wage: 6800.0,
      salaryStructureId: techStructure.id,
      department: 'Engineering',
      jobPosition: 'Senior Full Stack Engineer',
      status: 'Active'
    }
  });

  const contractLucas = await prisma.contract.create({
    data: {
      employeeId: empDev3.id,
      startDate: yearStart,
      endDate: nextYear,
      wage: 6200.0,
      salaryStructureId: techStructure.id,
      department: 'Engineering',
      jobPosition: 'Frontend Architect',
      status: 'Active'
    }
  });

  const contractHR = await prisma.contract.create({
    data: {
      employeeId: empHRLead.id,
      startDate: yearStart,
      endDate: nextYear,
      wage: 7200.0,
      salaryStructureId: techStructure.id,
      department: 'Human Resources',
      jobPosition: 'Head of People & Culture',
      status: 'Active'
    }
  });

  const contractPayroll = await prisma.contract.create({
    data: {
      employeeId: empPayrollMgr.id,
      startDate: yearStart,
      endDate: nextYear,
      wage: 7500.0,
      salaryStructureId: techStructure.id,
      department: 'Finance & Payroll',
      jobPosition: 'Payroll Director',
      status: 'Active'
    }
  });

  // 7. Users with 5 distinct roles (Password: Password123!)
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // NOTE: these are login accounts. Their `name` is a generic role label, never a
  // specific person's name — so removing seed employees never leaves a stale
  // "Marcus Sterling"-style reference on the login/role display.
  await prisma.user.create({
    data: {
      name: 'Employee',
      email: 'employee@peoplepay360.com',
      passwordHash,
      role: Role.Employee,
      employeeId: empSeniorDev.id,
      status: 'Active'
    }
  });

  await prisma.user.create({
    data: {
      name: 'HR Manager',
      email: 'hrmanager@peoplepay360.com',
      passwordHash,
      role: Role.HRManager,
      employeeId: empHRLead.id,
      status: 'Active'
    }
  });

  await prisma.user.create({
    data: {
      name: 'HR Payroll User',
      email: 'payrolluser@peoplepay360.com',
      passwordHash,
      role: Role.HRPayrollUser,
      employeeId: empDev2.id,
      status: 'Active'
    }
  });

  await prisma.user.create({
    data: {
      name: 'HR Payroll Manager',
      email: 'payrollmgr@peoplepay360.com',
      passwordHash,
      role: Role.HRPayrollManager,
      employeeId: empPayrollMgr.id,
      status: 'Active'
    }
  });

  await prisma.user.create({
    data: {
      name: 'System Administrator',
      email: 'admin@peoplepay360.com',
      passwordHash,
      role: Role.Admin,
      employeeId: empCEO.id,
      status: 'Active'
    }
  });

  // 8. Leave Allocations
  for (const emp of [empSeniorDev, empDev2, empDev3, empHRLead, empPayrollMgr]) {
    await prisma.allocation.create({
      data: {
        employeeId: emp.id,
        timeOffTypeId: annualLeave.id,
        allocatedAmount: 20.0,
        takenAmount: 2.0,
        remainingAmount: 18.0,
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

    await prisma.allocation.create({
      data: {
        employeeId: emp.id,
        timeOffTypeId: hourlyOff.id,
        allocatedAmount: 32.0,
        takenAmount: 4.0,
        remainingAmount: 28.0,
        validFrom: yearStart,
        validTo: nextYear,
        status: 'Approved'
      }
    });
  }

  // 9. Time Off Requests (1 Pending, 1 Approved)
  await prisma.timeOffRequest.create({
    data: {
      employeeId: empSeniorDev.id,
      timeOffTypeId: annualLeave.id,
      startDate: new Date(now.getFullYear(), now.getMonth(), 15),
      endDate: new Date(now.getFullYear(), now.getMonth(), 16),
      duration: 2.0,
      status: TimeOffStatus.Approved,
      reason: 'Personal travel'
    }
  });

  await prisma.timeOffRequest.create({
    data: {
      employeeId: empDev2.id,
      timeOffTypeId: annualLeave.id,
      startDate: new Date(now.getFullYear(), now.getMonth(), 22),
      endDate: new Date(now.getFullYear(), now.getMonth(), 24),
      duration: 3.0,
      status: TimeOffStatus.Pending,
      reason: 'Family event'
    }
  });

  // 10. Attendance Records
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  for (let d = 1; d <= 15; d++) {
    const dayDate = new Date(now.getFullYear(), now.getMonth(), d);
    if (dayDate.getDay() === 0 || dayDate.getDay() === 6) continue;

    for (const emp of [empSeniorDev, empDev2, empDev3, empHRLead, empPayrollMgr]) {
      const checkIn = new Date(dayDate);
      checkIn.setHours(9, 0, 0);
      const checkOut = new Date(dayDate);
      checkOut.setHours(18, 0, 0);

      // Add a missing checkout for Devon on day 10 to demonstrate warnings
      if (emp.id === empSeniorDev.id && d === 10) {
        await prisma.attendance.create({
          data: {
            employeeId: emp.id,
            checkIn,
            checkOut: null,
            workedHours: 8.0,
            status: AttendanceStatus.MissingCheckout
          }
        });
      } else {
        await prisma.attendance.create({
          data: {
            employeeId: emp.id,
            checkIn,
            checkOut,
            workedHours: 8.0,
            status: AttendanceStatus.Present
          }
        });
      }
    }
  }

  // 11. Completed Real Payrun Processed through Real Engine
  const payrunName = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()} Regular Payroll`;
  const payrun = await prisma.payrun.create({
    data: {
      name: payrunName,
      salaryStructureId: techStructure.id,
      periodStart: currentMonthStart,
      periodEnd: currentMonthEnd,
      status: PayrunStatus.Paid,
      employees: {
        create: [
          { employeeId: empSeniorDev.id },
          { employeeId: empDev2.id },
          { employeeId: empDev3.id },
          { employeeId: empHRLead.id },
          { employeeId: empPayrollMgr.id }
        ]
      }
    }
  });

  const structureRules: RuleDefinition[] = [
    { id: rBasic.id, name: rBasic.name, code: rBasic.code, category: rBasic.category, sequence: 1, computeType: rBasic.computeType, value: rBasic.value },
    { id: rHra.id, name: rHra.name, code: rHra.code, category: rHra.category, sequence: 2, computeType: rHra.computeType, value: rHra.value, formula: rHra.formula },
    { id: rConveyance.id, name: rConveyance.name, code: rConveyance.code, category: rConveyance.category, sequence: 3, computeType: rConveyance.computeType, value: rConveyance.value },
    { id: rGross.id, name: rGross.name, code: rGross.code, category: rGross.category, sequence: 4, computeType: rGross.computeType, formula: rGross.formula },
    { id: rPf.id, name: rPf.name, code: rPf.code, category: rPf.category, sequence: 5, computeType: rPf.computeType, value: rPf.value, formula: rPf.formula },
    { id: rHealth.id, name: rHealth.name, code: rHealth.code, category: rHealth.category, sequence: 6, computeType: rHealth.computeType, value: rHealth.value },
    { id: rNet.id, name: rNet.name, code: rNet.code, category: rNet.category, sequence: 7, computeType: rNet.computeType, formula: rNet.formula }
  ];

  const employeeContracts = [
    { emp: empSeniorDev, contract: contractDevon },
    { emp: empDev2, contract: contractAaliyah },
    { emp: empDev3, contract: contractLucas },
    { emp: empHRLead, contract: contractHR },
    { emp: empPayrollMgr, contract: contractPayroll }
  ];

  for (const item of employeeContracts) {
    const calc = computeEmployeePayslip({
      employee: { id: item.emp.id, name: item.emp.name, department: item.emp.department, jobPosition: item.emp.jobPosition },
      contract: {
        id: item.contract.id,
        employeeId: item.emp.id,
        wage: item.contract.wage,
        startDate: item.contract.startDate,
        endDate: item.contract.endDate,
        status: item.contract.status,
        salaryStructureId: item.contract.salaryStructureId
      },
      periodStart: currentMonthStart,
      periodEnd: currentMonthEnd,
      rules: structureRules
    });

    await prisma.payslip.create({
      data: {
        payrunId: payrun.id,
        employeeId: item.emp.id,
        contractId: item.contract.id,
        periodStart: currentMonthStart,
        periodEnd: currentMonthEnd,
        workedDays: calc.workedDays,
        grossTotal: calc.grossTotal,
        netTotal: calc.netTotal,
        status: PayrunStatus.Paid,
        lines: {
          create: calc.ruleLines.map(l => ({
            salaryRuleId: l.salaryRuleId,
            name: l.name,
            code: l.code,
            category: l.category,
            amount: l.amount
          }))
        },
        warnings: {
          create: calc.warnings.map(w => ({
            message: w.message,
            type: w.type
          }))
        }
      }
    });
  }

  console.log('✅ Seeding completed successfully!');
  console.log('🔑 Demo Login Credentials:');
  console.log('   • Employee:         employee@peoplepay360.com / Password123!');
  console.log('   • HR Manager:       hrmanager@peoplepay360.com / Password123!');
  console.log('   • Payroll User:     payrolluser@peoplepay360.com / Password123!');
  console.log('   • Payroll Manager:  payrollmgr@peoplepay360.com / Password123!');
  console.log('   • Administrator:    admin@peoplepay360.com / Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
