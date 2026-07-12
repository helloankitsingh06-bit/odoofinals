/**
 * Middleware: requireActiveEmployee
 * Ensures that only employees whose status is 'active' (or admin users bypassing the check) can access routes.
 * Must run after verifyToken and linkEmployeeAccount.
 */
async function requireActiveEmployee(req, res, next) {
  // Admin bypass
  if (req.user && req.user.role === 'Admin') {
    return next();
  }

  if (!req.employee) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied: No employee record found'
    });
  }

  if (req.employee.status !== 'active') {
    return res.status(403).json({
      error: 'Forbidden',
      message: `Access denied: Employee account status is '${req.employee.status}' (expected active)`
    });
  }

  next();
}

module.exports = requireActiveEmployee;
