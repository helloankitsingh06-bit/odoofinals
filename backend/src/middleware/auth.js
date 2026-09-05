const { auth } = require('../../firebase');

/**
 * Why does role/auth enforcement have to live on the backend?
 *
 * 1. Client-side checks are cosmetic. Hiding a button or blocking a route in the
 *    browser is trivially bypassed with dev tools or a crafted fetch().
 * 2. The database is only as safe as the endpoints in front of it. Without route
 *    guards, anyone can call the API directly.
 * 3. Firebase issues signed ID tokens. Verifying them server-side is the only
 *    place identity and role can actually be trusted.
 */

const VALID_MOCK_ROLES = ['Admin', 'AssetManager', 'DeptHead', 'Employee'];

function adminEmail() {
  return (process.env.ADMIN_EMAIL || '').toLowerCase();
}

/**
 * Build the fake decoded token for a `mock-<Role>` bearer token.
 * Used for local development and automated testing so you don't need a real
 * Firebase session to exercise protected routes.
 */
function buildMockUser(role) {
  if (role === 'Admin') {
    return {
      uid: 'mock-admin-uid',
      email: adminEmail() || 'admin@example.com',
      role: 'Admin',
      name: 'Mock Admin',
    };
  }
  return {
    uid: `mock-${role.toLowerCase()}-uid`,
    email: `mock_${role.toLowerCase()}@example.com`,
    role,
    name: `Mock ${role}`,
  };
}

/**
 * Middleware: verifyToken
 * - Requires an `Authorization: Bearer <token>` header.
 * - `mock-<Role>` tokens are accepted for dev/testing, but rejected in
 *   production unless ALLOW_MOCK_AUTH === 'true'.
 * - Real tokens are verified with the Firebase Admin SDK. The configured
 *   ADMIN_EMAIL gets role 'Admin'; every other authenticated user gets
 *   role 'Employee'. Adapt this to your own role source (custom claims,
 *   a Firestore "users" collection, etc.) once you know the domain.
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
    const role = VALID_MOCK_ROLES.includes(requestedRole)
      ? requestedRole
      : 'Employee';

    req.user = buildMockUser(role);
    return next();
  }

  /* ------------------------------ Real tokens ---------------------------- */
  try {
    const decoded = await auth.verifyIdToken(token);
    const email = (decoded.email || '').toLowerCase();

    if (!email) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Authentication token is missing an email address',
      });
    }

    // Role resolution: prefer an explicit custom claim, then the configured
    // admin email, then default everyone else to 'Employee'.
    decoded.role =
      decoded.role || (email === adminEmail() ? 'Admin' : 'Employee');

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
        message: `Access denied: requires ${label}`,
      });
    }
    next();
  };
}

const requireAdmin = requireRole(['Admin'], 'Admin role');
const requireAssetManager = requireRole(
  ['Admin', 'AssetManager'],
  'AssetManager or Admin role'
);
const requireDeptHead = requireRole(
  ['Admin', 'DeptHead'],
  'DeptHead or Admin role'
);

module.exports = {
  verifyToken,
  requireAdmin,
  requireAssetManager,
  requireDeptHead,
};
