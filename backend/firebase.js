const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

/**
 * Firebase Admin SDK initialization.
 *
 * This template is NOT tied to any Firebase project. Every team / person must
 * point it at their own project before running it. Credentials are resolved in
 * this order:
 *
 *   1. backend/serviceAccountKey.json          (downloaded from the Firebase
 *                                               console; gitignored)
 *   2. GOOGLE_APPLICATION_CREDENTIALS env var  (path to a service-account JSON;
 *                                               uses applicationDefault())
 *
 * If neither is present the process exits with setup instructions rather than
 * throwing a cryptic "Cannot find module" error.
 *
 * See TEMPLATE_README.md → "Bring your own Firebase project".
 */
const KEY_PATH = path.join(__dirname, 'serviceAccountKey.json');

function initFirebase() {
  if (admin.apps.length) return;

  if (fs.existsSync(KEY_PATH)) {
    const serviceAccount = require(KEY_PATH);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase initialized from serviceAccountKey.json');
    console.log('   Project:', serviceAccount.project_id);
    return;
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
    console.log(
      '✅ Firebase initialized from GOOGLE_APPLICATION_CREDENTIALS'
    );
    return;
  }

  console.error(
    [
      '',
      '❌ No Firebase Admin credentials found.',
      '',
      '   This template ships without credentials on purpose. Point it at your',
      '   own Firebase project:',
      '',
      '   1. Firebase console → Project settings → Service accounts',
      '      → "Generate new private key".',
      '   2. Save the downloaded file as: backend/serviceAccountKey.json',
      '      (it is gitignored — never commit it)',
      '',
      '   Full walkthrough: TEMPLATE_README.md → "Bring your own Firebase project"',
      '',
    ].join('\n')
  );
  process.exit(1);
}

initFirebase();

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

module.exports = { admin, db, auth, storage };
