import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const configStr = fs.readFileSync('firebase-applet-config.json', 'utf8');
const config = JSON.parse(configStr);

const app = initializeApp(config);
const db = getFirestore(app);

async function check() {
  const collections = ['members', 'Members', 'cabinet', 'Cabinet', 'donations', 'incidents'];
  for (const c of collections) {
    try {
      const snap = await getDocs(collection(db, c));
      console.log(`Collection '${c}': ${snap.size} documents`);
    } catch(e) {
      console.log(`Collection '${c}': error or permission denied`);
    }
  }
  process.exit(0);
}
check();
