import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const config = {
  apiKey: "AIzaSyAWmYNZbjpijp6NGO-Lw743kogqtJimBCo",
  authDomain: "opc-new-48a8d.firebaseapp.com",
  projectId: "opc-new-48a8d",
  storageBucket: "opc-new-48a8d.appspot.com",
  messagingSenderId: "211508737297",
  appId: "1:211508737297:web:32aa85d2f0efad1b4008b0"
};

const app = initializeApp(config);
const db = getFirestore(app);

async function check() {
  const collections = ['members', 'Members', 'donations', 'cabinet', 'Cabinet', 'users'];
  for (const c of collections) {
    try {
      const snap = await getDocs(collection(db, c));
      console.log(`Collection '${c}': ${snap.size} documents`);
    } catch(e) {
      console.log(`Collection '${c}': error - ${e.message}`);
    }
  }
  process.exit(0);
}
check();
