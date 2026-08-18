import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, initializeFirestore } from 'firebase/firestore';
const config = { apiKey: "AIzaSyAWmYNZbjpijp6NGO-Lw743kogqtJimBCo", authDomain: "opc-new-48a8d.firebaseapp.com", projectId: "opc-new-48a8d" };
const app = initializeApp(config);
const db = initializeFirestore(app, {}, 'ai-studio-7f5d5a28-ea42-42fa-9865-8df2286be432');

async function check() {
  try {
    const snap = await getDocs(collection(db, 'members'));
    console.log(`Members count in named DB: ${snap.size}`);
  } catch(e) {
    console.log(`Error: ${e.message}`);
  }
  process.exit(0);
}
check();
