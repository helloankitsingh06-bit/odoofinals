const { db, auth } = require('../firebase');
const { serializeTimestamps } = require('../utils/serializeTimestamps');
const { ROLES, VALID_ROLES } = require('../src/constants');

const COLLECTION = 'users';

function adminEmail() {
  return (process.env.ADMIN_EMAIL || '').toLowerCase();
}

/**
 * Sync / register user profile into Firestore.
 * Server strictly assigns role: "Employee" (unless email matches ADMIN_EMAIL or user already has a role).
 * Client-provided role inputs are ignored for security.
 */
async function syncUser(userData = {}) {
  const { uid, email, name } = userData;

  if (!uid) {
    const err = new Error('Field "uid" is required');
    err.statusCode = 400;
    throw err;
  }

  const userRef = db.collection(COLLECTION).doc(uid);
  const existing = await userRef.get();

  const normalizedEmail = (email || '').toLowerCase();
  const isAdminEmail = normalizedEmail && normalizedEmail === adminEmail();

  if (existing.exists) {
    const current = existing.data();
    const updatePayload = {
      name: name !== undefined ? name : current.name || '',
      email: normalizedEmail || current.email || '',
      status: current.status || 'Active',
      updatedAt: new Date(),
    };

    // If admin email, ensure Admin role
    if (isAdminEmail && current.role !== ROLES.ADMIN) {
      updatePayload.role = ROLES.ADMIN;
    }

    await userRef.update(updatePayload);
    const updated = await userRef.get();
    return serializeTimestamps({ uid, ...updated.data() });
  }

  const initialRole = isAdminEmail ? ROLES.ADMIN : ROLES.EMPLOYEE;

  const newUserDoc = {
    uid,
    name: name || '',
    email: normalizedEmail,
    role: initialRole,
    employeeId: null,
    status: 'Active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await userRef.set(newUserDoc);
  return serializeTimestamps(newUserDoc);
}

/**
 * List all users.
 */
async function getUsers() {
  const snapshot = await db.collection(COLLECTION).get();
  return snapshot.docs.map((doc) =>
    serializeTimestamps({ uid: doc.id, ...doc.data() })
  );
}

/**
 * Get user by UID or document ID.
 */
async function getUserById(id) {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return serializeTimestamps({ uid: doc.id, ...doc.data() });
}

/**
 * Admin-only: Promote or change a user's role.
 * Updates Firestore doc and sets Firebase Auth custom claims if user exists in Auth.
 */
async function updateUserRole(userId, newRole) {
  if (!newRole || !VALID_ROLES.includes(newRole)) {
    const err = new Error(
      `Invalid role "${newRole}". Must be one of: ${VALID_ROLES.join(', ')}`
    );
    err.statusCode = 400;
    throw err;
  }

  const userRef = db.collection(COLLECTION).doc(userId);
  const existing = await userRef.get();

  if (!existing.exists) {
    // If not yet in Firestore users collection, check Firebase Auth first
    try {
      const authUser = await auth.getUser(userId);
      await userRef.set({
        uid: userId,
        email: authUser.email || '',
        name: authUser.displayName || '',
        role: newRole,
        employeeId: null,
        status: 'Active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (authErr) {
      const err = new Error(`User "${userId}" not found`);
      err.statusCode = 404;
      throw err;
    }
  } else {
    await userRef.update({
      role: newRole,
      updatedAt: new Date(),
    });
  }

  // Set Firebase Auth custom claims so subsequent token refreshes carry the new role
  try {
    await auth.setCustomUserClaims(userId, { role: newRole });
  } catch (claimErr) {
    console.warn(`Could not set custom claim for user ${userId}:`, claimErr.message);
  }

  const updated = await userRef.get();
  return serializeTimestamps({ uid: updated.id, ...updated.data() });
}

/**
 * Link an employee profile ID to a user document.
 */
async function linkEmployee(userId, employeeId) {
  const userRef = db.collection(COLLECTION).doc(userId);
  const existing = await userRef.get();
  if (!existing.exists) return null;

  await userRef.update({
    employeeId,
    updatedAt: new Date(),
  });

  const updated = await userRef.get();
  return serializeTimestamps({ uid: updated.id, ...updated.data() });
}

module.exports = {
  syncUser,
  getUsers,
  getUserById,
  updateUserRole,
  linkEmployee,
};
