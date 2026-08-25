import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';
const config = {
  apiKey: "AIzaSyAWmYNZbjpijp6NGO-Lw743kogqtJimBCo",
  projectId: "opc-new-48a8d",
  databaseURL: "https://opc-new-48a8d-default-rtdb.europe-west1.firebasedatabase.app"
};
const app = initializeApp(config);
const db = getDatabase(app);
async function check() {
  try {
    const snap = await get(ref(db, '/'));
    if (snap.exists()) {
      console.log(`RTDB ROOT keys: ${Object.keys(snap.val())}`);
    } else {
      console.log(`RTDB: does not exist`);
    }
  } catch(e) {
    console.log(`RTDB error:`, e.message);
  }
  process.exit(0);
}
check();
