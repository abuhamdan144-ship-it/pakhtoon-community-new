import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const config = {
  apiKey: "AIzaSyAWmYNZbjpijp6NGO-Lw743kogqtJimBCo",
  projectId: "opc-new-48a8d"
};
const app = initializeApp(config);
const db = getFirestore(app);

async function check() {
  const cols = ['Members', 'members', 'users', 'Users', 'cabinet', 'Cabinet', 'donations', 'Donations', 'news', 'News', 'ApprovedMembers', 'approvedMembers', 'opc_members', 'OPC_Members'];
  for (const c of cols) {
    try {
      const snap = await getDocs(collection(db, c));
      if (snap.size > 0) {
        console.log(`Named DB Collection '${c}': ${snap.size} documents`);
      }
    } catch(e) {
      // ignore
    }
  }
  process.exit(0);
}
check();
