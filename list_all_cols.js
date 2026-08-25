import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const config = {
  apiKey: "AIzaSyAWmYNZbjpijp6NGO-Lw743kogqtJimBCo",
  authDomain: "opc-new-48a8d.firebaseapp.com",
  projectId: "opc-new-48a8d"
};
const app = initializeApp(config);

const dbNames = ['(default)', 'ai-studio-omanpakhtooncomm-7f5d5a28-ea42-42fa-9865-8df2286be432'];
const colsToTry = ['members', 'donations', 'cabinet', 'news'];

async function run() {
  for (const dbName of dbNames) {
    console.log(`Checking DB: ${dbName}`);
    try {
      const db = getFirestore(app, dbName);
      for (const col of colsToTry) {
        try {
           const snap = await getDocs(collection(db, col));
           console.log(`  Collection ${col}: ${snap.size} documents`);
        } catch(e) {
           console.log(`  Collection ${col}: Error ${e.code}`);
        }
      }
    } catch(e) {
      console.log(`  Failed to init DB ${dbName}`);
    }
  }
  process.exit(0);
}
run();
