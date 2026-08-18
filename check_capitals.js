import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const configStr = fs.readFileSync('firebase-applet-config.json', 'utf8');
const config = JSON.parse(configStr);

const app = initializeApp(config);
const db = getFirestore(app);

async function check() {
  try {
    const snapM = await getDocs(collection(db, 'Members'));
    console.log(`Members count: ${snapM.size}`);
    const snapC = await getDocs(collection(db, 'Cabinet'));
    console.log(`Cabinet count: ${snapC.size}`);
  } catch (e) {
    console.error("Error:", e.message);
  }
  process.exit(0);
}
check();
