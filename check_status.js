import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore';

const configStr = fs.readFileSync('firebase-applet-config.json', 'utf8');
const config = JSON.parse(configStr);

const app = initializeApp(config);
const db = getFirestore(app);

async function check() {
  const snap = await getDocs(collection(db, 'members'));
  console.log("Total members found without query:", snap.size);
  let noStatus = 0;
  let otherStatus = {};
  snap.forEach(doc => {
    const s = doc.data().status;
    if (!s) noStatus++;
    else {
      otherStatus[s] = (otherStatus[s] || 0) + 1;
    }
  });
  console.log("No status count:", noStatus);
  console.log("Status counts:", otherStatus);
  process.exit(0);
}
check();
