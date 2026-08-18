import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';

const configStr = fs.readFileSync('firebase-applet-config.json', 'utf8');
const config = JSON.parse(configStr);

async function check(url) {
  try {
    const app = initializeApp({ ...config, databaseURL: url }, 'app_' + Math.random());
    const db = getDatabase(app);
    const snap = await get(ref(db, '/'));
    if (snap.exists()) {
      console.log(`URL ${url} root keys:`, Object.keys(snap.val()));
    } else {
      console.log(`URL ${url}: empty`);
    }
  } catch(e) {
    console.log(`URL ${url}: error ${e.message}`);
  }
}

async function run() {
  await check('https://opc-new-48a8d-default-rtdb.firebaseio.com');
  await check('https://opc-new-48a8d-default-rtdb.europe-west1.firebasedatabase.app');
  await check('https://opc-new-48a8d-default-rtdb.asia-southeast1.firebasedatabase.app');
  process.exit(0);
}
run();
