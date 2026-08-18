import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const configStr = fs.readFileSync('firebase-applet-config.json', 'utf8');
const config = JSON.parse(configStr);
const app = initializeApp(config);
const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
  try {
    await signInWithEmailAndPassword(auth, 'admin@opc.org', 'admin123'); // guessing password
  } catch(e) {
    console.log("Auth failed:", e.message);
  }
  try {
    const snap = await getDocs(collection(db, 'members'));
    console.log('Total members in collection:', snap.size);
  } catch(e) {
    console.log('Query failed:', e.message);
  }
  process.exit(0);
}
run();
