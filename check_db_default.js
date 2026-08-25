import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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
const db = getFirestore(app);

async function checkData() {
  const cols = ['members', 'donations', 'cabinet', 'news'];
  for (const col of cols) {
    try {
      const snap = await getDocs(collection(db, col));
      console.log(`Collection ${col}: ${snap.size} documents`);
    } catch (e) {
      console.error(`Error reading ${col}:`, e.message);
    }
  }
  process.exit(0);
}

checkData();
