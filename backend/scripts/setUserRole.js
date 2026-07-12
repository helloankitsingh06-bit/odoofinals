const { auth, db } = require('../src/firebase');

const uid = process.argv[2];
const role = process.argv[3];

const VALID_ROLES = ["Admin", "AssetManager", "DeptHead", "Employee"];

if (!uid || !role) {
  console.error("❌ Please provide both User UID and Role as command line arguments.");
  console.error("Usage: node scripts/setUserRole.js <UID> <Admin|AssetManager|DeptHead|Employee>");
  process.exit(1);
}

if (!VALID_ROLES.includes(role)) {
  console.error(`❌ Invalid role: "${role}". Must be one of: ${VALID_ROLES.join(', ')}`);
  process.exit(1);
}

async function setUserRole() {
  console.log(`Setting custom claim { role: "${role}" } for user UID: ${uid}...`);

  try {
    // 1. Set custom user claims on Firebase Auth
    await auth.setCustomUserClaims(uid, { role });

    // 2. Sync or update the user document in the Firestore 'users' collection
    console.log("Syncing role update to Firestore 'users' collection...");
    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    const userData = {
      role: role,
      updatedAt: new Date()
    };

    if (!userDoc.exists) {
      // Create user doc if it doesn't exist
      userData.id = uid;
      userData.email = (await auth.getUser(uid)).email || "unknown@assetflow.com";
      userData.name = (await auth.getUser(uid)).displayName || `${role} User`;
      userData.status = "Active";
      userData.createdAt = new Date();
      await userDocRef.set(userData);
    } else {
      await userDocRef.update(userData);
    }

    // 3. Retrieve user profile to confirm claims
    const userRecord = await auth.getUser(uid);
    console.log(`✅ Claims and Firestore sync completed!`);
    console.log(`Updated Auth claims:`, JSON.stringify(userRecord.customClaims || {}, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("❌ Error setting user role:", error.message);
    process.exit(1);
  }
}

setUserRole();
