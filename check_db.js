import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAWmYNZbjpijp6NGO-Lw743kogqtJimBCo",
  authDomain: "opc-new-48a8d.firebaseapp.com",
  projectId: "opc-new-48a8d"
};
const app = initializeApp(firebaseConfig);
const db_default = getFirestore(app);
const db_custom = getFirestore(app, "ai-studio-omanpakhtooncomm-7f5d5a28-ea42-42fa-9865-8df2286be432");

async function check() {
  try {
    const snap1 = await getDocs(collection(db_default, 'members'));
    console.log(`default: ${snap1.size} members`);
  } catch(e) { console.log(e.message); }
  
  try {
    const snap2 = await getDocs(collection(db_custom, 'members'));
    console.log(`custom: ${snap2.size} members`);
  } catch(e) { console.log(e.message); }
  process.exit(0);
}
check();
