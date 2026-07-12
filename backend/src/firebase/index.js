const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

let db;
let auth;
let storage;

if (process.env.USE_MOCK_FIRESTORE === 'true') {
  console.log("\n⚠️ WARNING: Firebase is running in MOCK mode with an in-memory database fallback.");
  const MockFirestore = require('./mockFirestore');
  db = new MockFirestore();
  
  auth = {
    verifyIdToken: async (token) => {
      if (token === 'mock-admin') {
        return { uid: 'admin-123', email: (process.env.ADMIN_EMAIL || 'krishdravi123@gmail.com').toLowerCase(), role: 'Admin', name: 'Admin User' };
      }
      return { uid: 'emp-999', email: 'test_employee@example.com', role: 'Employee', name: 'John Doe' };
    },
    deleteUser: async (uid) => {
      console.log(`[Mock Auth] Deleted user in Firebase: ${uid}`);
      return {};
    },
    updateUser: async (uid, properties) => {
      console.log(`[Mock Auth] Updated user ${uid} properties:`, properties);
      return {};
    },
    revokeRefreshTokens: async (uid) => {
      console.log(`[Mock Auth] Revoked refresh tokens for: ${uid}`);
      return {};
    }
  };

  storage = {
    bucket: () => ({
      file: () => ({
        save: async () => {},
        getSignedUrl: async () => ['http://localhost:5001/mock-file-url']
      })
    })
  };
} else {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      privateKey = privateKey.replace(/\\n/g, '\n');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey
        })
      });
    } else {
      const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
      if (fs.existsSync(serviceAccountPath)) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath)
        });
      } else {
        admin.initializeApp({
          projectId: projectId || 'assetflow-30100'
        });
      }
    }
  }

  db = admin.firestore();
  auth = admin.auth();
  storage = admin.storage();
}

module.exports = { admin, db, auth, storage };
