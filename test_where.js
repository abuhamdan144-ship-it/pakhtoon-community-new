import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const config = {
  apiKey: "AIzaSyAWmYNZbjpijp6NGO-Lw743kogqtJimBCo",
  authDomain: "opc-new-48a8d.firebaseapp.com",
  projectId: "opc-new-48a8d"
};
const app = initializeApp(config);
const db = getFirestore(app);

async function check() {
  try {
    const q = query(collection(db, 'members'), where('status', '==', 'approved'));
    const snap = await getDocs(q);
    console.log(`Approved members: ${snap.size}`);
  } catch(e) {
    console.log(`Error: ${e.message}`);
  }
  
  try {
    // try to fetch all if we bypass the rule somehow (impossible without admin sdk)
    // but maybe they are in 'Members' ? No, 'Members' returned 0.
  } catch(e) {}
  process.exit(0);
}
check();
