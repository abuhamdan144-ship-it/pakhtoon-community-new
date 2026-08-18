import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const configStr = fs.readFileSync('firebase-applet-config.json', 'utf8');
const config = JSON.parse(configStr);

const app = initializeApp(config);
const db = getFirestore(app);

async function check() {
  try {
    const snap = await getDocs(collection(db, 'Members'));
    console.log(`Members: ${snap.size}`);
  } catch(e) {
    console.log(`Error Members:`, e);
  }
  process.exit(0);
}
check();
