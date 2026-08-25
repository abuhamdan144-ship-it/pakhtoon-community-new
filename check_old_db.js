import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const config = {
  apiKey: "AIzaSyAWmYNZbjpijp6NGO-Lw743kogqtJimBCo",
  projectId: "opc-new-48a8d"
};
const app = initializeApp(config);
const db = getFirestore(app, "ai-studio-7f5d5a28-ea42-42fa-9865-8df2286be432");

async function check() {
  const cols = ['members', 'donations', 'cabinet', 'news'];
  for (const c of cols) {
    try {
      const snap = await getDocs(collection(db, c));
      console.log(`Database 'ai-studio-7f5d5a28-ea42-42fa-9865-8df2286be432' Collection '${c}': ${snap.size} documents`);
    } catch(e) {
      console.log(`Error checking '${c}': ${e.message}`);
    }
  }
  process.exit(0);
}
check();
