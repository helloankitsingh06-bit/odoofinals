const express = require('express');
const router = express.Router();
const { db } = require('../firebase');

/**
 * GET /api/employee/me
 * Returns the logged-in employee's profile info.
 * Resolves the departmentId to a department name.
 */
router.get('/me', async (req, res) => {
  // If the requester is the Admin and they have no employee record, return details from claims
  if (!req.employee && req.user && req.user.role === 'Admin') {
    return res.json({
      displayName: req.user.name || req.user.displayName || 'System Admin',
      email: req.user.email,
      department: 'Administration',
      role: 'Administrator',
      status: 'active'
    });
  }

  if (!req.employee) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied: No employee record found'
    });
  }

  const { displayName, email, departmentId, role, status } = req.employee;

  try {
    let departmentName = null;
    if (departmentId) {
      const deptDoc = await db.collection('departments').doc(departmentId).get();
      if (deptDoc.exists) {
        departmentName = deptDoc.data().name;
      }
    }

    return res.json({
      displayName,
      email,
      department: departmentName,
      role,
      status
    });
  } catch (error) {
    console.error('Error in GET /api/employee/me:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve profile details'
    });
  }
});

/**
 * GET /api/employee/deadlines
 * Returns the logged-in employee's deadlines array, sorted by dueDate ascending.
 */
router.get('/deadlines', (req, res) => {
  // Admins with no employee record have no deadlines
  if (!req.employee) {
    return res.json([]);
  }

  const deadlines = req.employee.deadlines || [];

  // Sort deadlines by dueDate ascending, handling both Firestore Timestamp objects and ISO strings/Date objects
  const sortedDeadlines = [...deadlines].sort((a, b) => {
    const dateA = a.dueDate && typeof a.dueDate.toDate === 'function' ? a.dueDate.toDate() : new Date(a.dueDate);
    const dateB = b.dueDate && typeof b.dueDate.toDate === 'function' ? b.dueDate.toDate() : new Date(b.dueDate);
    return dateA - dateB;
  });

  return res.json(sortedDeadlines);
});

module.exports = router;
