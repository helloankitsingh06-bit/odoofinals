// services/dashboardService.js
const { db } = require('../firebase');   // <-- THIS PATH IS CORRECT for YOUR structure

/**
 * Count assets by status (returns a map).
 * Example: { Available: 4, Allocated: 2, Under Maintenance: 2 }
 */
async function countByStatus() {
  const snapshot = await db.collection('assets').get();
  const counts = {};
  snapshot.forEach(doc => {
    const status = doc.data().status || 'Unknown';
    counts[status] = (counts[status] || 0) + 1;
  });
  return counts;
}

/**
 * Count active bookings (status = 'Upcoming' or 'Ongoing').
 */
async function countActiveBookings() {
  const snapshot = await db.collection('bookings')
    .where('status', 'in', ['Upcoming', 'Ongoing'])
    .get();
  return snapshot.size;
}

/**
 * Count pending transfers (allocations with status = 'Requested').
 */
async function countPendingTransfers() {
  const snapshot = await db.collection('allocations')
    .where('status', '==', 'Requested')
    .get();
  return snapshot.size;
}

/**
 * Get overdue returns – allocations where expectedReturnDate < now AND status = 'Active'.
 * Returns full array with asset and employee names attached.
 */
async function getOverdueReturns() {
  const now = new Date();
  const snapshot = await db.collection('allocations')
    .where('expectedReturnDate', '<', now)
    .where('status', '==', 'Active')
    .get();

  const overdue = [];
  for (const doc of snapshot.docs) {
    const data = doc.data();
    // Fetch asset name
    const assetDoc = await db.collection('assets').doc(data.assetId).get();
    const employeeDoc = await db.collection('employees').doc(data.employeeId).get();
    overdue.push({
      id: doc.id,
      ...data,
      assetName: assetDoc.exists ? assetDoc.data().name : 'Unknown',
      employeeName: employeeDoc.exists ? employeeDoc.data().name : 'Unknown',
    });
  }
  return overdue;
}

/**
 * Get ALL KPI numbers for the dashboard in one object.
 * This is what Frontend A will call.
 */
async function getDashboardKPIs() {
  const statusCounts = await countByStatus();
  const activeBookings = await countActiveBookings();
  const pendingTransfers = await countPendingTransfers();
  const overdue = await getOverdueReturns();

  return {
    available: statusCounts['Available'] || 0,
    allocated: statusCounts['Allocated'] || 0,
    maintenanceToday: statusCounts['Under Maintenance'] || 0,
    activeBookings,
    pendingTransfers,
    overdueCount: overdue.length,
    overdueReturns: overdue, // full list for frontend to render
  };
}

/**
 * Get recent activity for the dashboard mini-feed (3 items by default).
 * THIS is the extra function you asked for earlier.
 */
async function getRecentActivity(limit = 3) {
  const snapshot = await db.collection('activityLogs')
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();

  const logs = [];
  snapshot.forEach(doc => {
    logs.push({ id: doc.id, ...doc.data() });
  });
  return logs;
}

// Export everything
module.exports = {
  countByStatus,
  countActiveBookings,
  countPendingTransfers,
  getOverdueReturns,
  getDashboardKPIs,
  getRecentActivity,
};
