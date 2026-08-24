import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAWmYNZbjpijp6NGO-Lw743kogqtJimBCo",
  authDomain: "opc-new-48a8d.firebaseapp.com",
  projectId: "opc-new-48a8d",
  storageBucket: "opc-new-48a8d.firebasestorage.app",
  messagingSenderId: "211508737297",
  appId: "1:211508737297:web:32aa85d2f0efad1b4008b0",
  measurementId: "G-9HQ1RRW4LP"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
