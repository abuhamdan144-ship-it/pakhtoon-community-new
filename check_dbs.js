import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs } from 'firebase/firestore';

const configStr = fs.readFileSync('firebase-applet-config.json', 'utf8');
const config = JSON.parse(configStr);
const app = initializeApp(config);

async function tryDb(dbName) {
  try {
    const db = initializeFirestore(app, {}, dbName);
    const snap = await getDocs(collection(db, 'members'));
    console.log(`Database '${dbName}': ${snap.size} members`);
  } catch(e) {
    console.log(`Database '${dbName}': error`);
  }
}

async function check() {
  await tryDb('(default)');
  await tryDb('opc-new-48a8d');
  await tryDb('community');
  await tryDb('pakhtoon');
  process.exit(0);
}
check();
