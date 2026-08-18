import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';
const config = { apiKey: "AIzaSyAWmYNZbjpijp6NGO-Lw743kogqtJimBCo", authDomain: "opc-new-48a8d.firebaseapp.com", projectId: "opc-new-48a8d", databaseURL: "https://opc-new-48a8d-default-rtdb.firebaseio.com" };
const app = initializeApp(config);
const db = getDatabase(app);

async function check() {
  try {
    const snap = await get(ref(db, '/members'));
    if (snap.exists()) {
      console.log(`RTDB members: ${Object.keys(snap.val()).length}`);
    } else {
      console.log(`RTDB members: does not exist`);
    }
  } catch(e) {
    console.log(`Error: ${e.message}`);
  }
  process.exit(0);
}
check();
