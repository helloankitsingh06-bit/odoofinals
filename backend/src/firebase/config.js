import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSy...",              // fill real key
  authDomain: "asset-flow-hackathon.firebaseapp.com",
  projectId: "asset-flow-hackathon",
  storageBucket: "asset-flow-hackathon.appspot.com",
  messagingSenderId: "187288651681",
  appId: "1:187288651681:web:..."   // fill real id
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);