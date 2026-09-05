const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { getDashboardMetrics } = require('../services/dashboardService');

async function runTests() {
  console.log('🧪 Starting Dashboard Service Test Suite...\n');

  try {
    console.log('--- 1. Testing Live Firestore Aggregation & Empty Collection Resilience ---');
    const metrics = await getDashboardMetrics();

    assert.ok(metrics.kpis, 'Metrics must include kpis');
    assert.ok(metrics.charts, 'Metrics must include charts');
    assert.ok(metrics.meta, 'Metrics must include meta');

    // KPI validations
    assert.strictEqual(typeof metrics.kpis.totalNetSalaryPaid, 'number');
    assert.strictEqual(typeof metrics.kpis.payslipsGenerated, 'number');
    assert.strictEqual(typeof metrics.kpis.averageSalary, 'number');

    // Time Off discipline: unit separation
    assert.ok('days' in metrics.kpis.approvedTimeOff);
    assert.ok('hours' in metrics.kpis.approvedTimeOff);
    assert.strictEqual(typeof metrics.kpis.approvedTimeOff.days, 'number');
    assert.strictEqual(typeof metrics.kpis.approvedTimeOff.hours, 'number');
    console.log(`  ✅ Approved Time Off: ${metrics.kpis.approvedTimeOff.days} Days, ${metrics.kpis.approvedTimeOff.hours} Hours`);

    // Attendance Health Ratio
    assert.ok('score' in metrics.kpis.attendanceHealth);
    assert.strictEqual(typeof metrics.kpis.attendanceHealth.score, 'number');
    assert.ok(
      metrics.kpis.attendanceHealth.score >= 0 && metrics.kpis.attendanceHealth.score <= 100,
      'Score must be between 0 and 100'
    );
    console.log(`  ✅ Attendance Health Ratio: ${metrics.kpis.attendanceHealth.score}% (from ${metrics.kpis.attendanceHealth.totalRecords} records)`);

    // Department Breakdown
    assert.ok(Array.isArray(metrics.charts.salaryCostByDepartment));
    console.log(`  ✅ Department Cost Breakdown: ${metrics.charts.salaryCostByDepartment.length} department(s) mapped`);
    metrics.charts.salaryCostByDepartment.forEach((dept) => {
      assert.ok(dept.department, 'Department name must exist');
      assert.strictEqual(typeof dept.netTotal, 'number');
      assert.strictEqual(typeof dept.percentage, 'number');
      console.log(`     - ${dept.department}: Net ₹${dept.netTotal} (${dept.percentage}%, ${dept.employeeCount} employee(s))`);
    });

    // Monthly Trends
    assert.ok(Array.isArray(metrics.charts.monthlyTrends));
    console.log(`  ✅ Monthly Trends: ${metrics.charts.monthlyTrends.length} payrun period(s) aggregated`);

    // Date range filter test
    console.log('\n--- 2. Testing Date Range Filter ---');
    const filteredMetrics = await getDashboardMetrics({
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
    assert.ok(filteredMetrics.kpis);
    console.log('  ✅ Period filter applied successfully');

    console.log('\n🎉 ALL DASHBOARD SERVICE TESTS PASSED! 🚀');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
}

runTests();
