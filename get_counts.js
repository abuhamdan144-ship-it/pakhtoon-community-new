import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
const config = { apiKey: "AIzaSyAWmYNZbjpijp6NGO-Lw743kogqtJimBCo", authDomain: "opc-new-48a8d.firebaseapp.com", projectId: "opc-new-48a8d" };
const app = initializeApp(config);
const db = getFirestore(app);

async function check() {
  try {
    const snap = await getDocs(collection(db, 'members'));
    console.log(`Members count in opc-new-48a8d: ${snap.size}`);
  } catch(e) {
    console.log(`Error: ${e.message}`);
  }
  process.exit(0);
}
check();
