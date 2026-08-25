import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAWmYNZbjpijp6NGO-Lw743kogqtJimBCo",
  authDomain: "opc-new-48a8d.firebaseapp.com",
  projectId: "opc-new-48a8d"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const collectionsToCheck = ['members', 'Members', 'cabinet', 'Cabinet', 'news', 'News', 'donations', 'Donations'];
  for (const col of collectionsToCheck) {
    try {
      const snap = await getDocs(collection(db, col));
      console.log(`Collection '${col}': ${snap.size} documents`);
    } catch (e) {
      console.error(`Error reading ${col}:`, e.message);
    }
  }
  process.exit(0);
}
check();
