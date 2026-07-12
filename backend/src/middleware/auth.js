const { auth } = require('../firebase');

/**
 * Why can't the role check happen on the frontend alone?
 * 
 * 1. Client-Side Bypass: A browser app runs JavaScript that the user has complete control over. Hiding UI elements,
 *    blocking client-side routing, or altering variables can easily be bypassed by dev tools or mock scripts.
 * 2. Unsecured Endpoints: Hiding client buttons does not secure server data. Without backend route guards,
 *    users can construct HTTP calls directly to fetch, modify, or delete assets, databases, and logs.
 * 3. Token-Based Authority: The backend uses cryptographically validated JSON Web Tokens (JWT) issued by Firebase
 *    to determine a user's identity and custom claims (roles), acting as the true security perimeter.
 */

/**
 * Middleware: verifyToken
 * Validates the Authorization Bearer header, decodes the claims, and attaches req.user.
 */
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authorization header is missing or malformed (expected Bearer <token>)'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error.message);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired authentication token'
    });
  }
}

/**
 * Middleware: requireAdmin
 * Guards routes to require custom claim `role === 'Admin'`.
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication check was bypassed or missed'
    });
  }

  if (req.user.role !== 'Admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied: Requires Admin role'
    });
  }

  next();
}

/**
 * Middleware: requireAssetManager
 * Guards routes to require custom claim `role === 'AssetManager'` or `role === 'Admin'`.
 */
function requireAssetManager(req, res, next) {
  if (!req.user) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication check was bypassed or missed'
    });
  }

  if (req.user.role !== 'AssetManager' && req.user.role !== 'Admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied: Requires AssetManager or Admin role'
    });
  }

  next();
}

/**
 * Middleware: requireDeptHead
 * Guards routes to require custom claim `role === 'DeptHead'` or `role === 'Admin'`.
 */
function requireDeptHead(req, res, next) {
  if (!req.user) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication check was bypassed or missed'
    });
  }

  if (req.user.role !== 'DeptHead' && req.user.role !== 'Admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied: Requires DeptHead or Admin role'
    });
  }

  next();
}

module.exports = {
  verifyToken,
  requireAdmin,
  requireAssetManager,
  requireDeptHead
};
