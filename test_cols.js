import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
const config = { apiKey: "AIzaSyAWmYNZbjpijp6NGO-Lw743kogqtJimBCo", authDomain: "opc-new-48a8d.firebaseapp.com", projectId: "opc-new-48a8d" };
const app = initializeApp(config);
const db = getFirestore(app);

async function check() {
  const names = ['Users', 'users', 'Members', 'members', 'cabinet', 'Cabinet', 'Elections', 'elections', 'Member', 'member', 'Data', 'data'];
  for (const n of names) {
    try {
      const snap = await getDocs(collection(db, n));
      console.log(`${n}: ${snap.size}`);
    } catch(e) {
      console.log(`${n}: Error - ${e.code}`);
    }
  }
  process.exit(0);
}
check();
