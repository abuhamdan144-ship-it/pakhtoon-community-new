import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseAppletConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

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
const db = getFirestore(app, firebaseAppletConfig.firestoreDatabaseId || '(default)');

async function checkData() {
  const cols = ['members', 'donations', 'cabinet', 'news'];
  for (const col of cols) {
    try {
      const snap = await getDocs(collection(db, col));
      console.log(`Collection ${col}: ${snap.size} documents`);
      if (snap.size > 0) {
        console.log(`Sample from ${col}:`, snap.docs[0].data());
      }
    } catch (e) {
      console.error(`Error reading ${col}:`, e.message);
    }
  }
  process.exit(0);
}

checkData();
