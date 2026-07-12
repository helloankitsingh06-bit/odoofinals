const { db } = require('../firebase');

/**
 * Middleware: linkEmployeeAccount
 * Runs after verifyToken succeeds. Looks up the employee record matching the authenticated email.
 * If found and not yet linked, links the uid and sets the status to active (if not suspended).
 * Attaches the employee document data to req.employee.
 * If not found and the user is not an Admin, returns 403 Forbidden.
 */
async function linkEmployeeAccount(req, res, next) {
  if (!req.user) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication check was bypassed or missed'
    });
  }

  const email = req.user.email;
  if (!email) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Authentication token is missing email address'
    });
  }

  try {
    let employeeData = req.employee;
    let employeeDocRef;

    if (!employeeData) {
      if (req.user.role === 'Admin') {
        return next();
      }

      const normalizedEmail = email.toLowerCase();
      const querySnapshot = await db.collection('employees').where('email', '==', normalizedEmail).limit(1).get();

      if (querySnapshot.empty) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Access denied: Only invited employees can access this application.'
        });
      }

      const employeeDoc = querySnapshot.docs[0];
      employeeData = employeeDoc.data();
      employeeData.id = employeeDoc.id;
      employeeDocRef = employeeDoc.ref;
    } else {
      employeeDocRef = db.collection('employees').doc(employeeData.id);
    }

    // If uid is null, perform account-linking
    if (employeeData.uid === null) {
      const updates = {
        uid: req.user.uid,
        updatedAt: new Date()
      };

      // Set to active unless it's already suspended
      if (employeeData.status !== 'suspended') {
        updates.status = 'active';
        employeeData.status = 'active';
      }

      // Add user displayName if present in ID token and null in document
      const displayName = req.user.name || req.user.displayName || null;
      if (displayName && !employeeData.displayName) {
        updates.displayName = displayName;
        employeeData.displayName = displayName;
      }

      await employeeDocRef.update(updates);
      employeeData.uid = req.user.uid;
      employeeData.updatedAt = updates.updatedAt;
    }

    // Attach/update request employee cache
    req.employee = employeeData;
    next();
  } catch (error) {
    console.error('Error in linkEmployeeAccount middleware:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to link/lookup employee account'
    });
  }
}

module.exports = linkEmployeeAccount;
