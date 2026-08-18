import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const configStr = fs.readFileSync('firebase-applet-config.json', 'utf8');
const config = JSON.parse(configStr);

const app = initializeApp(config);
const db = getFirestore(app);

async function check() {
  const snap = await getDocs(collection(db, 'members'));
  snap.forEach(doc => {
    console.log(doc.id, "=>", doc.data().name, doc.data().createdAt);
  });
  
  const cabSnap = await getDocs(collection(db, 'cabinet'));
  cabSnap.forEach(doc => {
    console.log(doc.id, "=>", doc.data().name);
  });
  process.exit(0);
}
check();
