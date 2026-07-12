import { auth, db } from '../firebase/config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export async function signup(email, password, name, departmentId) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;
  const userData = {
    id: uid,
    name,
    email,
    role: "Employee",
    departmentId: departmentId || null,
    status: "Active",
    createdAt: serverTimestamp()
  };
  await setDoc(doc(db, "users", uid), userData);
  return userCredential.user;
}

export async function login(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  await signOut(auth);
}

export async function sendPasswordReset(email) {
  await sendPasswordResetEmail(auth, email);
}

export function subscribeToAuth(onUserLoaded) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        onUserLoaded({ uid: user.uid, email: user.email, ...userDoc.data() });
      } else {
        onUserLoaded(null);
      }
    } else {
      onUserLoaded(null);
    }
  });
}