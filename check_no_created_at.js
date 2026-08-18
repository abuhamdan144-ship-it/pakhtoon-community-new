import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const configStr = fs.readFileSync('firebase-applet-config.json', 'utf8');
const config = JSON.parse(configStr);
const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  const snap = await getDocs(collection(db, 'members'));
  console.log('Total members in collection:', snap.size);
  let countWithCreatedAt = 0;
  let countWithout = 0;
  snap.forEach(d => {
    if (d.data().createdAt) countWithCreatedAt++;
    else countWithout++;
  });
  console.log(`With createdAt: ${countWithCreatedAt}, Without: ${countWithout}`);
  process.exit(0);
}
run();
