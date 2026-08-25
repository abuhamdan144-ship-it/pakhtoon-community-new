import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
const config = {
  projectId: "opc-oman"
};
const app = initializeApp(config);
const db = getFirestore(app);
async function check() {
  try {
    const snap = await getDocs(collection(db, 'members'));
    console.log(`opc-oman: ${snap.size}`);
  } catch(e) {
    console.log(e.message);
  }
  process.exit(0);
}
check();
