const { db } = require('../firebase');
const { serializeTimestamps } = require('../utils/serializeTimestamps');

/**
 * Generic Firestore CRUD service.
 *
 * This is the copy-paste template for a real domain entity. Once you know the
 * problem statement, duplicate this file (e.g. `taskService.js`), swap the
 * collection name and the field whitelist, and you have a working data layer.
 *
 * Collection: "items"
 * Document shape: { name, description, status, createdAt, updatedAt }
 */
const COLLECTION = 'items';

// Only these fields are accepted from client input. Everything else is ignored.
const WRITABLE_FIELDS = ['name', 'description', 'status'];

function pickWritable(body = {}) {
  const out = {};
  for (const field of WRITABLE_FIELDS) {
    if (body[field] !== undefined) out[field] = body[field];
  }
  return out;
}

async function createItem(data = {}) {
  const payload = pickWritable(data);

  if (!payload.name || typeof payload.name !== 'string' || !payload.name.trim()) {
    const err = new Error('Field "name" is required');
    err.statusCode = 400;
    throw err;
  }

  const now = new Date();
  const doc = {
    name: payload.name.trim(),
    description: payload.description || '',
    status: payload.status || 'active',
    createdAt: now,
    updatedAt: now,
  };

  const ref = await db.collection(COLLECTION).add(doc);
  return serializeTimestamps({ id: ref.id, ...doc });
}

async function getItems() {
  const snapshot = await db
    .collection(COLLECTION)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) =>
    serializeTimestamps({ id: doc.id, ...doc.data() })
  );
}

async function getItemById(id) {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return serializeTimestamps({ id: doc.id, ...doc.data() });
}

async function updateItem(id, updates = {}) {
  const ref = db.collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) return null;

  const payload = pickWritable(updates);
  payload.updatedAt = new Date();

  await ref.update(payload);

  const updated = await ref.get();
  return serializeTimestamps({ id: updated.id, ...updated.data() });
}

async function deleteItem(id) {
  const ref = db.collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) return false;

  await ref.delete();
  return true;
}

module.exports = {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
};
