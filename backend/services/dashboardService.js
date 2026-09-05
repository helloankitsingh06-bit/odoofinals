const { db } = require('../firebase');
const { serializeTimestamps } = require('../utils/serializeTimestamps');

const COLLECTIONS = {
  PAYRUNS: 'payruns',
  PAYSLIPS: 'payslips',
  EMPLOYEES: 'employees',
  CONTRACTS: 'contracts',
  ATTENDANCE: 'attendances',
  TIME_OFF: 'timeOffRequests',
  TIME_OFF_ALT: 'time_off_requests',
};

/**
 * ----------------------------------------------------------------------------
 * LIVE FIRESTORE DASHBOARD AGGREGATIONS
 * ----------------------------------------------------------------------------
 * Computes live, non-hardcoded KPI metrics and chart roll-ups across:
 * - Payslips (Total Net Paid, Average Salary, Generated Count)
 * - Time Off Requests (Approved Days / Hours)
 * - Attendance (Health Ratio)
 * - Departmental Cost Allocation (Employee / Contract snapshot)
 * - Monthly Payrun Trends
 *
 * @param {Object} [filters={}] - Optional filters: { startDate, endDate, payrunId }
 * @returns {Promise<Object>} Formatted dashboard KPI and chart metrics
 */
async function getDashboardMetrics(filters = {}) {
  const { startDate, endDate, payrunId } = filters;

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  // 1. Fetch Payslips
  let payslipQuery = db.collection(COLLECTIONS.PAYSLIPS);
  if (payrunId) {
    payslipQuery = payslipQuery.where('payrunId', '==', payrunId);
  }

  const payslipsSnap = await payslipQuery.get();
  let allPayslips = payslipsSnap.docs.map((doc) =>
    serializeTimestamps({ id: doc.id, ...doc.data() })
  );

  // Filter payslips by period date range if specified
  if (start || end) {
    allPayslips = allPayslips.filter((ps) => {
      if (!ps.period?.startDate) return true;
      const psStart = new Date(ps.period.startDate);
      if (start && psStart < start) return false;
      if (end && psStart > end) return false;
      return true;
    });
  }

  // 2. Fetch Employees & Contracts for Department mapping
  const [empSnap, contractSnap] = await Promise.all([
    db.collection(COLLECTIONS.EMPLOYEES).get(),
    db.collection(COLLECTIONS.CONTRACTS).get(),
  ]);

  const empMap = new Map(
    empSnap.docs.map((d) => [d.id, serializeTimestamps({ id: d.id, ...d.data() })])
  );
  const contractMap = new Map(
    contractSnap.docs.map((d) => [d.id, serializeTimestamps({ id: d.id, ...d.data() })])
  );

  // 3. Aggregate Payslip KPIs
  let totalNetSalaryPaid = 0;
  let paidCount = 0;
  let totalGrossPaid = 0;

  allPayslips.forEach((ps) => {
    if (ps.status === 'Paid') {
      totalNetSalaryPaid += ps.netTotal || 0;
      totalGrossPaid += ps.grossTotal || 0;
      paidCount++;
    }
  });

  const payslipsGenerated = allPayslips.length;
  const averageSalary = paidCount > 0 ? Math.round(totalNetSalaryPaid / paidCount) : 0;

  // 4. Aggregate Approved Time Off (with Days vs Hours unit discipline)
  let timeOffSnap = await db.collection(COLLECTIONS.TIME_OFF).get();
  if (timeOffSnap.empty) {
    timeOffSnap = await db.collection(COLLECTIONS.TIME_OFF_ALT).get();
  }

  let approvedTimeOffDays = 0;
  let approvedTimeOffHours = 0;
  let approvedTimeOffCount = 0;

  if (!timeOffSnap.empty) {
    timeOffSnap.docs.forEach((doc) => {
      const req = doc.data();
      if ((req.status || '').toLowerCase() === 'approved') {
        // Filter by period if dates exist
        if (req.startDate && (start || end)) {
          const reqDate = new Date(req.startDate);
          if (start && reqDate < start) return;
          if (end && reqDate > end) return;
        }

        const unit = (req.unit || 'Days').toLowerCase();
        const duration = Number(req.duration || req.days || req.hours || 1);

        if (unit.includes('hour')) {
          approvedTimeOffHours += duration;
        } else {
          approvedTimeOffDays += duration;
        }
        approvedTimeOffCount++;
      }
    });
  }

  // 5. Aggregate Attendance Health
  // Simple, explainable formula: (Present + Overtime) / Total Expected Records * 100
  // Absent and MissingCheckout appear in denominator and reduce ratio
  const attendanceSnap = await db.collection(COLLECTIONS.ATTENDANCE).get();
  let presentCount = 0;
  let overtimeCount = 0;
  let lateCount = 0;
  let absentCount = 0;
  let missingCheckoutCount = 0;
  let totalAttendanceRecords = 0;

  if (!attendanceSnap.empty) {
    attendanceSnap.docs.forEach((doc) => {
      const att = doc.data();
      if (att.date && (start || end)) {
        const attDate = new Date(att.date);
        if (start && attDate < start) return;
        if (end && attDate > end) return;
      }

      totalAttendanceRecords++;
      const status = (att.status || '').trim();
      if (status === 'Present') presentCount++;
      else if (status === 'Overtime') overtimeCount++;
      else if (status === 'Late') lateCount++;
      else if (status === 'Absent') absentCount++;
      else if (status === 'MissingCheckout') missingCheckoutCount++;
    });
  }

  const attendanceHealth =
    totalAttendanceRecords > 0
      ? Math.round(((presentCount + overtimeCount + lateCount * 0.9) / totalAttendanceRecords) * 100)
      : 100;

  // 6. Chart: Salary Cost by Department
  // Source of truth: employees.department, fallback to contracts.department, fallback to "General / Operations"
  const departmentTotals = new Map();

  allPayslips.forEach((ps) => {
    const emp = empMap.get(ps.employeeId);
    const contract = contractMap.get(ps.contractId);

    const department =
      emp?.department ||
      contract?.department ||
      'General Operations';

    if (!departmentTotals.has(department)) {
      departmentTotals.set(department, {
        department,
        grossTotal: 0,
        netTotal: 0,
        employeeCount: 0,
        employeeIds: new Set(),
      });
    }

    const dept = departmentTotals.get(department);
    dept.grossTotal += ps.grossTotal || 0;
    dept.netTotal += ps.netTotal || 0;
    dept.employeeIds.add(ps.employeeId);
  });

  const grandTotalNet = Array.from(departmentTotals.values()).reduce(
    (acc, d) => acc + d.netTotal,
    0
  );

  const salaryCostByDepartment = Array.from(departmentTotals.values()).map((d) => ({
    department: d.department,
    grossTotal: Math.round(d.grossTotal * 100) / 100,
    netTotal: Math.round(d.netTotal * 100) / 100,
    employeeCount: d.employeeIds.size,
    percentage: grandTotalNet > 0 ? Math.round((d.netTotal / grandTotalNet) * 100) : 0,
  }));

  // 7. Chart: Monthly Trends (Total Net Salary Paid per period)
  const payrunSnap = await db.collection(COLLECTIONS.PAYRUNS).get();
  const allPayruns = payrunSnap.docs.map((doc) =>
    serializeTimestamps({ id: doc.id, ...doc.data() })
  );

  allPayruns.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const monthlyTrends = allPayruns.map((pr) => {
    const prPeriod = pr.period || {};
    let label = pr.name;
    if (prPeriod.startDate) {
      const d = new Date(prPeriod.startDate);
      label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
    }

    return {
      payrunId: pr.id,
      name: pr.name,
      label,
      period: prPeriod,
      status: pr.status,
      netTotal: pr.totalNet || 0,
      grossTotal: pr.totalGross || 0,
      employeeCount: pr.totalEmployees || pr.employeeIds?.length || 0,
    };
  });

  return {
    kpis: {
      totalNetSalaryPaid: Math.round(totalNetSalaryPaid * 100) / 100,
      totalGrossSalaryPaid: Math.round(totalGrossPaid * 100) / 100,
      payslipsGenerated,
      paidPayslipsCount: paidCount,
      pendingPayslipsCount: payslipsGenerated - paidCount,
      averageSalary,
      approvedTimeOff: {
        days: approvedTimeOffDays,
        hours: approvedTimeOffHours,
        totalRequests: approvedTimeOffCount,
        summary:
          approvedTimeOffDays > 0 && approvedTimeOffHours > 0
            ? `${approvedTimeOffDays}d ${approvedTimeOffHours}h`
            : approvedTimeOffHours > 0
            ? `${approvedTimeOffHours}h`
            : `${approvedTimeOffDays} Days`,
      },
      attendanceHealth: {
        score: Math.min(100, Math.max(0, attendanceHealth)),
        totalRecords: totalAttendanceRecords,
        present: presentCount,
        overtime: overtimeCount,
        late: lateCount,
        absent: absentCount,
        missingCheckout: missingCheckoutCount,
      },
    },
    charts: {
      salaryCostByDepartment,
      monthlyTrends,
    },
    meta: {
      filteredPeriod: { startDate: startDate || null, endDate: endDate || null },
      payrunId: payrunId || null,
      generatedAt: new Date().toISOString(),
    },
  };
}

module.exports = {
  getDashboardMetrics,
};
