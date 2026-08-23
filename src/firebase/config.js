import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAWmYNZbjpijp6NGO-Lw743ko",
  authDomain: "opc-new-48a8d.firebaseapp.com",
  projectId: "opc-new-48a8d",
  storageBucket: "opc-new-48a8d.appspot.com",
  messagingSenderId: "211508737297",
  appId: "1:211508737297:web:4762271661b0",
  measurementId: "G-650K8N52S7"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
