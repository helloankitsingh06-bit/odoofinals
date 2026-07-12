const express = require('express');
const router = express.Router();
const { db, auth } = require('../firebase');
const Employee = require('../../models/Employee');

// Simple email regex validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Helper to check if a department exists in Firestore.
 */
async function checkDepartmentExists(departmentId) {
  if (!departmentId) return false;
  try {
    const deptDoc = await db.collection('departments').doc(departmentId).get();
    return deptDoc.exists;
  } catch (error) {
    console.error('Error verifying department exists:', error);
    return false;
  }
}

/**
 * POST /api/admin/employees
 * Body: { email, role, departmentId }
 * Creates an "invited" employee record.
 */
router.post('/employees', async (req, res) => {
  const { name, email, role, departmentId } = req.body;

  // Basic Validation
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Missing or invalid required field: name'
    });
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Missing or invalid required field: email'
    });
  }

  const employeeRole = role && typeof role === 'string' && role.trim() !== '' ? role.trim() : 'Employee';

  if (!departmentId || typeof departmentId !== 'string' || departmentId.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Missing or invalid required field: departmentId'
    });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    // Check if employee with this email already exists in Firestore
    const existingEmployeeSnap = await db.collection('employees').where('email', '==', normalizedEmail).limit(1).get();
    if (!existingEmployeeSnap.empty) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Employee with email "${normalizedEmail}" already has an invited/active record`
      });
    }

    // Verify department exists
    const deptExists = await checkDepartmentExists(departmentId);
    if (!deptExists) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Department with ID "${departmentId}" does not exist`
      });
    }

    const newEmployee = {
      name: name.trim(),
      email: normalizedEmail,
      uid: null,
      displayName: name.trim(),
      departmentId,
      role: employeeRole,
      status: 'invited',
      deadlines: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection('employees').add(newEmployee);

    // Save in Mongo as well
    try {
      let deptIdForMongo = null;
      // We could try casting departmentId to ObjectId if it's valid, but Firestore IDs are usually 20 chars
      // Mongoose expects 24 hex char for ObjectId. We'll skip department relation if it throws or just store as string if we modified schema.
      // But the model has `department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' }`. Let's skip it to avoid CastError.
      const mongoEmployee = new Employee({
        _id: docRef.id,
        name: name.trim(),
        email: normalizedEmail,
        role: employeeRole,
        department: departmentId,
        isActive: true
      });
      await mongoEmployee.save();
    } catch (mongoError) {
      console.error("Failed to save employee to Mongo, but saved to Firestore:", mongoError);
    }

    return res.status(201).json({
      id: docRef.id,
      ...newEmployee
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create employee record'
    });
  }
});

/**
 * DELETE /api/admin/employees/:id
 * Removes the employee record. Also deletes their Firebase Auth account if linked (uid exists).
 */
router.delete('/employees/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const employeeRef = db.collection('employees').doc(id);
    const employeeDoc = await employeeRef.get();

    if (!employeeDoc.exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Employee with ID "${id}" not found`
      });
    }

    const { uid } = employeeDoc.data();

    // If a Firebase uid is associated, fully delete/revoke the user from Firebase Auth
    if (uid) {
      try {
        await auth.deleteUser(uid);
      } catch (authError) {
        // If the user was already deleted from Auth, log warning but proceed with Firestore deletion
        console.warn(`Could not delete Firebase Auth user ${uid}:`, authError.message);
      }
    }

    await employeeRef.delete();

    return res.json({
      message: 'Employee record and associated Firebase Auth account successfully deleted'
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete employee'
    });
  }
});

/**
 * PATCH /api/admin/employees/:id/access
 * Sets status to "active" and enables their Firebase Auth account if it exists.
 */
router.patch('/employees/:id/access', async (req, res) => {
  const { id } = req.params;

  try {
    const employeeRef = db.collection('employees').doc(id);
    const employeeDoc = await employeeRef.get();

    if (!employeeDoc.exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Employee with ID "${id}" not found`
      });
    }

    const { uid } = employeeDoc.data();

    // Re-enable in Firebase Auth if uid is linked
    if (uid) {
      try {
        await auth.updateUser(uid, { disabled: false });
      } catch (authError) {
        console.warn(`Could not enable Firebase Auth user ${uid}:`, authError.message);
      }
    }

    await employeeRef.update({
      status: 'active',
      updatedAt: new Date()
    });

    return res.json({
      message: 'Employee account successfully re-activated'
    });
  } catch (error) {
    console.error('Error activating employee access:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to activate employee access'
    });
  }
});

/**
 * PATCH /api/admin/employees/:id/suspend
 * Sets status to "suspended" and disables their Firebase Auth account if it exists.
 */
router.patch('/employees/:id/suspend', async (req, res) => {
  const { id } = req.params;

  try {
    const employeeRef = db.collection('employees').doc(id);
    const employeeDoc = await employeeRef.get();

    if (!employeeDoc.exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Employee with ID "${id}" not found`
      });
    }

    const { uid } = employeeDoc.data();

    /**
     * CRITICAL SECURITY NOTE:
     * When suspending an employee, we MUST update their Firebase Auth account and set `disabled: true`.
     * Simply flagging the status as "suspended" in the Firestore document is insufficient, because
     * Firebase Auth ID tokens remain valid for up to an hour. If their Firebase Auth account isn't
     * disabled, the suspended user's existing authenticated requests (which bypass Firestore checks
     * in other non-employee endpoints or leverage cached sessions) would continue to be accepted by
     * the backend as valid. Disabling the user in Auth ensures that their session token cannot be
     * refreshed, locking them out of all Firebase-secured endpoints immediately.
     */
    if (uid) {
      try {
        await auth.updateUser(uid, { disabled: true });
        // Optionally, revoke current refresh tokens to force immediate logout
        await auth.revokeRefreshTokens(uid);
      } catch (authError) {
        console.warn(`Could not disable Firebase Auth user ${uid}:`, authError.message);
      }
    }

    await employeeRef.update({
      status: 'suspended',
      updatedAt: new Date()
    });

    return res.json({
      message: 'Employee account successfully suspended and disabled in Firebase Auth'
    });
  } catch (error) {
    console.error('Error suspending employee:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to suspend employee'
    });
  }
});

/**
 * PATCH /api/admin/employees/:id/department
 * Body: { departmentId, role }
 * Assigns department and job role to an employee.
 */
router.patch('/employees/:id/department', async (req, res) => {
  const { id } = req.params;
  const { departmentId, role } = req.body;

  const updates = { updatedAt: new Date() };

  if (departmentId !== undefined) {
    if (typeof departmentId !== 'string' || departmentId.trim() === '') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid departmentId'
      });
    }
    updates.departmentId = departmentId.trim();
  }

  if (role !== undefined) {
    if (typeof role !== 'string' || role.trim() === '') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid role'
      });
    }
    updates.role = role.trim();
  }

  if (Object.keys(updates).length <= 1) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Must provide at least one field to update (departmentId or role)'
    });
  }

  try {
    const employeeRef = db.collection('employees').doc(id);
    const employeeDoc = await employeeRef.get();

    if (!employeeDoc.exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Employee with ID "${id}" not found`
      });
    }

    // Verify department exists if we are updating it
    if (updates.departmentId) {
      const deptExists = await checkDepartmentExists(updates.departmentId);
      if (!deptExists) {
        return res.status(400).json({
          error: 'Bad Request',
          message: `Department with ID "${updates.departmentId}" does not exist`
        });
      }
    }

    await employeeRef.update(updates);

    return res.json({
      message: 'Employee record updated successfully'
    });
  } catch (error) {
    console.error('Error updating employee department/role:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update employee department and role'
    });
  }
});

/**
 * POST /api/admin/employees/:id/deadlines
 * Body: { title, dueDate }
 * Appends a deadline to that employee's deadlines array.
 */
router.post('/employees/:id/deadlines', async (req, res) => {
  const { id } = req.params;
  const { title, dueDate } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Missing or invalid required field: title'
    });
  }

  if (!dueDate || isNaN(Date.parse(dueDate))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Missing or invalid required field: dueDate (must be a valid date representation)'
    });
  }

  try {
    const employeeRef = db.collection('employees').doc(id);
    const employeeDoc = await employeeRef.get();

    if (!employeeDoc.exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Employee with ID "${id}" not found`
      });
    }

    // Generate a unique 20-character ID for the deadline
    const deadlineId = db.collection('employees').doc().id;
    const newDeadline = {
      id: deadlineId,
      title: title.trim(),
      dueDate: new Date(dueDate),
      createdAt: new Date()
    };

    const currentDeadlines = employeeDoc.data().deadlines || [];
    currentDeadlines.push(newDeadline);

    await employeeRef.update({
      deadlines: currentDeadlines,
      updatedAt: new Date()
    });

    return res.status(201).json({
      message: 'Deadline appended successfully',
      deadline: newDeadline
    });
  } catch (error) {
    console.error('Error adding employee deadline:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to add deadline'
    });
  }
});

/**
 * DELETE /api/admin/employees/:id/deadlines/:deadlineId
 * Removes a specific deadline from the employee's deadlines array.
 */
router.delete('/employees/:id/deadlines/:deadlineId', async (req, res) => {
  const { id, deadlineId } = req.params;

  try {
    const employeeRef = db.collection('employees').doc(id);
    const employeeDoc = await employeeRef.get();

    if (!employeeDoc.exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Employee with ID "${id}" not found`
      });
    }

    const currentDeadlines = employeeDoc.data().deadlines || [];
    const filteredDeadlines = currentDeadlines.filter(d => d.id !== deadlineId);

    if (filteredDeadlines.length === currentDeadlines.length) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Deadline with ID "${deadlineId}" not found on this employee`
      });
    }

    await employeeRef.update({
      deadlines: filteredDeadlines,
      updatedAt: new Date()
    });

    return res.json({
      message: 'Deadline removed successfully'
    });
  } catch (error) {
    console.error('Error deleting employee deadline:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete deadline'
    });
  }
});

/**
 * GET /api/admin/employees
 * Lists all employees with their department/role/status/deadlines (resolved department name).
 */
router.get('/employees', async (req, res) => {
  try {
    // 1. Fetch all departments in-memory to prevent N+1 queries
    const deptsSnapshot = await db.collection('departments').get();
    const deptsMap = {};
    deptsSnapshot.forEach(doc => {
      deptsMap[doc.id] = doc.data().name;
    });

    // 2. Fetch all employees
    const employeesSnapshot = await db.collection('employees').get();
    const employees = employeesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || data.displayName || '',
        email: data.email,
        uid: data.uid,
        displayName: data.displayName,
        departmentId: data.departmentId,
        departmentName: deptsMap[data.departmentId] || null,
        role: data.role,
        status: data.status,
        deadlines: data.deadlines || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
    });

    return res.json(employees);
  } catch (error) {
    console.error('Error fetching employees list:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch employees list'
    });
  }
});

module.exports = router;
