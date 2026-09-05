const { auth, db } = require('../../firebase');
const { VALID_ROLES, ROLES } = require('../constants');

function adminEmail() {
  return (process.env.ADMIN_EMAIL || '').toLowerCase();
}

/**
 * Build the fake decoded token for a `mock-<Role>` bearer token.
 * Used for local development and automated testing so you don't need a real
 * Firebase session to exercise protected routes.
 */
function buildMockUser(role) {
  const safeRole = VALID_ROLES.includes(role) ? role : ROLES.EMPLOYEE;
  return {
    uid: `mock-${safeRole.toLowerCase()}-uid`,
    email: safeRole === ROLES.ADMIN ? (adminEmail() || 'admin@example.com') : `mock_${safeRole.toLowerCase()}@example.com`,
    role: safeRole,
    name: `Mock ${safeRole}`,
  };
}

/**
 * Middleware: verifyToken
 * - Requires an `Authorization: Bearer <token>` header.
 * - `mock-<Role>` tokens are accepted for dev/testing, but rejected in
 *   production unless ALLOW_MOCK_AUTH === 'true'.
 * - Real tokens are verified with the Firebase Admin SDK.
 * - Role is resolved in order:
 *   1. Explicit custom claim on token (`decoded.role`)
 *   2. Firestore user doc (`users/{uid}.role`)
 *   3. Configured ADMIN_EMAIL -> 'Admin'
 *   4. Default -> 'Employee'
 */
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authorization header is missing or malformed (expected "Bearer <token>")',
    });
  }

  const token = authHeader.split(' ')[1];

  /* ------------------------------ Mock tokens ------------------------------ */
  if (token.startsWith('mock-')) {
    const mockAllowed =
      process.env.NODE_ENV !== 'production' ||
      process.env.ALLOW_MOCK_AUTH === 'true';

    if (!mockAllowed) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Mock authentication is disabled in production',
      });
    }

    const requestedRole = token.replace('mock-', '');
    const role = VALID_ROLES.includes(requestedRole) ? requestedRole : ROLES.EMPLOYEE;

    req.user = buildMockUser(role);
    return next();
  }

  /* ------------------------------ Real tokens ---------------------------- */
  try {
    const decoded = await auth.verifyIdToken(token);
    const email = (decoded.email || '').toLowerCase();

    if (!email && !decoded.uid) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Authentication token is missing identity information',
      });
    }

    let resolvedRole = decoded.role;

    // If custom claim not present on token, check Firestore users collection
    if (!resolvedRole && db) {
      try {
        const userDoc = await db.collection('users').doc(decoded.uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          if (userData.role && VALID_ROLES.includes(userData.role)) {
            resolvedRole = userData.role;
          }
        }
      } catch (dbErr) {
        console.warn('Could not query Firestore for user role fallback:', dbErr.message);
      }
    }

    // Fallback: Admin email check or default to Employee
    if (!resolvedRole) {
      resolvedRole = (email && email === adminEmail()) ? ROLES.ADMIN : ROLES.EMPLOYEE;
    }

    decoded.role = resolvedRole;
    req.user = decoded;
    return next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired authentication token',
    });
  }
}

/* --------------------------- Role guard factory -------------------------- */
function requireRole(allowedRoles, label) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'verifyToken must run before this guard',
      });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied: requires ${label || allowedRoles.join(' or ')}`,
      });
    }
    next();
  };
}

const requireAdmin = requireRole([ROLES.ADMIN], 'Admin role');
const requireHRManager = requireRole([ROLES.ADMIN, ROLES.HR_MANAGER], 'HRManager or Admin role');
const requireHRPayrollUser = requireRole(
  [ROLES.ADMIN, ROLES.HR_PAYROLL_USER, ROLES.HR_PAYROLL_MANAGER],
  'HRPayrollUser, HRPayrollManager, or Admin role'
);
const requireHRPayrollManager = requireRole(
  [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER],
  'HRPayrollManager or Admin role'
);
const requireHRorPayroll = requireRole(
  [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.HR_PAYROLL_USER, ROLES.HR_PAYROLL_MANAGER],
  'HR, Payroll, or Admin role'
);

const requireHRManagerPlus = requireRole(
  [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.HR_PAYROLL_MANAGER],
  'HRManager, HRPayrollManager, or Admin role'
);

module.exports = {
  verifyToken,
  requireRole,
  requireAdmin,
  requireHRManager,
  requireHRManagerPlus,
  requireHRPayrollUser,
  requireHRPayrollManager,
  requireHRorPayroll,
};
