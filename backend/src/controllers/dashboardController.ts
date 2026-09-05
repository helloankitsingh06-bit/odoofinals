import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { PayrunStatus, TimeOffStatus, AttendanceStatus } from '../types';

export const getDashboardMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { department, startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(String(startDate));
    if (endDate) dateFilter.lte = new Date(String(endDate));

    // 1. Total Net Salary Paid & Average Salary
    const paidPayslipsWhere: any = {
      status: PayrunStatus.Paid
    };
    if (department && department !== 'All') {
      paidPayslipsWhere.employee = { department: String(department) };
    }
    if (startDate || endDate) {
      paidPayslipsWhere.periodStart = dateFilter;
    }

    const paidPayslips = await prisma.payslip.findMany({
      where: paidPayslipsWhere,
      include: { employee: true }
    });

    const totalNetSalaryPaid = paidPayslips.reduce((sum, p) => sum + p.netTotal, 0);
    const averageSalaryPaid = paidPayslips.length > 0 ? totalNetSalaryPaid / paidPayslips.length : 0;

    // 2. Payslips Generated (Total in period regardless of status)
    const allPayslipsWhere: any = {};
    if (department && department !== 'All') {
      allPayslipsWhere.employee = { department: String(department) };
    }
    if (startDate || endDate) {
      allPayslipsWhere.periodStart = dateFilter;
    }

    const payslipsGeneratedCount = await prisma.payslip.count({
      where: allPayslipsWhere
    });

    // 3. Approved Time Off (Separated by Days vs Hours - NEVER SUM TOGETHER)
    const approvedRequestsWhere: any = {
      status: TimeOffStatus.Approved
    };
    if (department && department !== 'All') {
      approvedRequestsWhere.employee = { department: String(department) };
    }
    if (startDate || endDate) {
      approvedRequestsWhere.startDate = dateFilter;
    }

    const approvedRequests = await prisma.timeOffRequest.findMany({
      where: approvedRequestsWhere,
      include: { timeOffType: true }
    });

    let approvedTimeOffDays = 0;
    let approvedTimeOffHours = 0;

    for (const req of approvedRequests) {
      if (req.timeOffType.unit === 'Hours') {
        approvedTimeOffHours += req.duration;
      } else {
        approvedTimeOffDays += req.duration;
      }
    }

    // 4. Attendance Health Index
    const attendanceWhere: any = {};
    if (department && department !== 'All') {
      attendanceWhere.employee = { department: String(department) };
    }
    if (startDate || endDate) {
      attendanceWhere.checkIn = dateFilter;
    }

    const attendances = await prisma.attendance.findMany({
      where: attendanceWhere
    });

    let presentCount = 0;
    let lateCount = 0;
    let overtimeCount = 0;
    let absentCount = 0;
    let missingCheckoutCount = 0;
    let manualEditCount = 0;

    for (const att of attendances) {
      if (att.isManualEdit) manualEditCount++;
      switch (att.status) {
        case AttendanceStatus.Present:
          presentCount++;
          break;
        case AttendanceStatus.Late:
          lateCount++;
          break;
        case AttendanceStatus.Overtime:
          overtimeCount++;
          break;
        case AttendanceStatus.Absent:
          absentCount++;
          break;
        case AttendanceStatus.MissingCheckout:
          missingCheckoutCount++;
          break;
        default:
          presentCount++;
      }
    }

    const totalAttendanceLogs = attendances.length;
    const positiveLogs = presentCount + overtimeCount + (lateCount * 0.8);
    const attendanceHealthScore = totalAttendanceLogs > 0
      ? Math.min(100, Math.round((positiveLogs / totalAttendanceLogs) * 100))
      : 100;

    // 5. Salary Cost by Department (Chart Data)
    const departmentCostMap: Record<string, { gross: number; net: number; count: number }> = {};
    for (const p of paidPayslips) {
      const dept = p.employee.department || 'General';
      if (!departmentCostMap[dept]) {
        departmentCostMap[dept] = { gross: 0, net: 0, count: 0 };
      }
      departmentCostMap[dept].gross += p.grossTotal;
      departmentCostMap[dept].net += p.netTotal;
      departmentCostMap[dept].count += 1;
    }

    const departmentSalaryChart = Object.entries(departmentCostMap).map(([dept, val]) => ({
      department: dept,
      grossTotal: Math.round(val.gross),
      netTotal: Math.round(val.net),
      employeeCount: val.count
    }));

    // 6. Monthly Net Salary Trends
    const allPaidPayslips = await prisma.payslip.findMany({
      where: { status: PayrunStatus.Paid },
      orderBy: { periodStart: 'asc' }
    });

    const monthlyMap: Record<string, { month: string; netTotal: number; grossTotal: number }> = {};
    for (const p of allPaidPayslips) {
      const monthStr = new Date(p.periodStart).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!monthlyMap[monthStr]) {
        monthlyMap[monthStr] = { month: monthStr, netTotal: 0, grossTotal: 0 };
      }
      monthlyMap[monthStr].netTotal += p.netTotal;
      monthlyMap[monthStr].grossTotal += p.grossTotal;
    }
    const monthlyTrends = Object.values(monthlyMap);

    // 7. Operational Alerts Panel
    const alerts = [];

    // Expiring contracts (next 30 days)
    const thirtyDaysAhead = new Date();
    thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);

    const expiringContracts = await prisma.contract.findMany({
      where: {
        status: 'Active',
        endDate: {
          not: null,
          lte: thirtyDaysAhead
        }
      },
      include: { employee: true }
    });

    for (const c of expiringContracts) {
      alerts.push({
        id: `exp_${c.id}`,
        type: 'Warning',
        category: 'Contract',
        message: `Contract for ${c.employee.name} (${c.jobPosition}) is ending on ${new Date(c.endDate!).toISOString().slice(0, 10)}`,
        actionLink: '/contracts'
      });
    }

    // Pending Time-Off Requests
    const pendingTimeOffCount = await prisma.timeOffRequest.count({
      where: { status: TimeOffStatus.Pending }
    });
    if (pendingTimeOffCount > 0) {
      alerts.push({
        id: 'pending_timeoff',
        type: 'Info',
        category: 'Time Off',
        message: `${pendingTimeOffCount} pending leave request(s) waiting for HR approval`,
        actionLink: '/time-off'
      });
    }

    // Missing Checkouts
    if (missingCheckoutCount > 0) {
      alerts.push({
        id: 'missing_checkouts',
        type: 'Warning',
        category: 'Attendance',
        message: `${missingCheckoutCount} attendance record(s) with missing check-out requiring review`,
        actionLink: '/attendance'
      });
    }

    // Draft / Unvalidated Payruns
    const openPayruns = await prisma.payrun.findMany({
      where: { status: { in: [PayrunStatus.Draft, PayrunStatus.Computed] } }
    });
    for (const pr of openPayruns) {
      alerts.push({
        id: `payrun_${pr.id}`,
        type: 'Info',
        category: 'Payroll',
        message: `Payrun '${pr.name}' is currently in ${pr.status} state and needs final validation`,
        actionLink: `/payruns`
      });
    }

    res.json({
      kpis: {
        totalNetSalaryPaid: Math.round(totalNetSalaryPaid * 100) / 100,
        payslipsGeneratedCount,
        averageSalaryPaid: Math.round(averageSalaryPaid * 100) / 100,
        approvedTimeOffDays,
        approvedTimeOffHours,
        attendanceHealthScore
      },
      attendanceSummary: {
        totalLogs: totalAttendanceLogs,
        present: presentCount,
        late: lateCount,
        overtime: overtimeCount,
        absent: absentCount,
        missingCheckout: missingCheckoutCount,
        manualEdits: manualEditCount
      },
      charts: {
        departmentSalaryChart,
        monthlyTrends
      },
      alerts
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
