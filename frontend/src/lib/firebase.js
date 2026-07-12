import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBfQIcYaTMdNrKfcDnH_59fAPDS-J4H-s4",
  authDomain: "asset-flow-hackathon.firebaseapp.com",
  projectId: "asset-flow-hackathon",
  storageBucket: "asset-flow-hackathon.firebasestorage.app",
  messagingSenderId: "187288651681",
  appId: "1:187288651681:web:6b28281a9e5b9796dc2de0",
  measurementId: "G-29JB600402"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Google OAuth scopes (optional, to make sure email is requested)
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
