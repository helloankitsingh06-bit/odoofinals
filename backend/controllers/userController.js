const userService = require('../services/userService');

async function getMe(req, res, next) {
  try {
    let userProfile = null;
    if (req.user && req.user.uid) {
      userProfile = await userService.getUserById(req.user.uid);
    }

    res.json({
      uid: req.user.uid,
      email: req.user.email || null,
      name: (userProfile && userProfile.name) || req.user.name || null,
      role: (userProfile && userProfile.role) || req.user.role || 'Employee',
      employeeId: (userProfile && userProfile.employeeId) || null,
      status: (userProfile && userProfile.status) || 'Active',
    });
  } catch (err) {
    next(err);
  }
}

async function syncUser(req, res, next) {
  try {
    const payload = {
      uid: req.user.uid,
      email: req.user.email || req.body.email,
      name: req.body.name || req.user.name,
    };
    const user = await userService.syncUser(payload);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function listUsers(req, res, next) {
  try {
    const users = await userService.getUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
}

async function getUser(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function updateUserRole(req, res, next) {
  try {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Field "role" is required in request body',
      });
    }

    const updatedUser = await userService.updateUserRole(req.params.id, role);
    res.json(updatedUser);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMe,
  syncUser,
  listUsers,
  getUser,
  updateUserRole,
};
