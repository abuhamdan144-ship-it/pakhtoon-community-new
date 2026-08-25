import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs } from 'firebase/firestore';
const config = {
  apiKey: "AIzaSyAWmYNZbjpijp6NGO-Lw743kogqtJimBCo",
  authDomain: "opc-new-48a8d.firebaseapp.com",
  projectId: "opc-new-48a8d"
};
const app = initializeApp(config);
async function check(name) {
  try {
    const db = initializeFirestore(app, {}, name);
    const snap = await getDocs(collection(db, 'members'));
    console.log(`${name}: ${snap.size}`);
  } catch(e) {
    // ignore
  }
}
async function run() {
  const names = ['prod', 'production', 'opc', 'opcdb', 'main', 'omanpakhtooncomm', 'database'];
  for (const n of names) { await check(n); }
  process.exit(0);
}
run();
