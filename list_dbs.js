import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const config = {
  apiKey: "AIzaSyAWmYNZbjpijp6NGO-Lw743kogqtJimBCo",
  projectId: "opc-new-48a8d"
};
const app = initializeApp(config);

async function check() {
  const dbs = ['(default)', 'opc-new-48a8d', 'omanpakhtooncomm', 'omanpakhtooncommunity', 'opc-database', 'opc', 'production'];
  
  for (const dbName of dbs) {
    try {
      const db = getFirestore(app, dbName);
      const snap = await getDocs(collection(db, 'members'));
      console.log(`Database '${dbName}' members: ${snap.size}`);
    } catch(e) {
      console.log(`Database '${dbName}' error: ${e.message}`);
    }
  }
  process.exit(0);
}
check();
