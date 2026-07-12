function authMiddleware(req, res, next) {
  const role = (req.headers['x-user-role'] || req.headers['x-userRole'] || 'AssetManager').toString();
  const userId = req.headers['x-user-id'] || req.headers['x-userId'] || null;

  req.user = {
    id: userId,
    role
  };

  next();
}

function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    const role = req.user?.role || 'AssetManager';
    if (allowedRoles.includes(role)) {
      return next();
    }

    return res.status(403).json({ message: 'Forbidden' });
  };
}

module.exports = { authMiddleware, requireRoles };
