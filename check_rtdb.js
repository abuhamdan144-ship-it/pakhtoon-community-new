import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';
const config = {
  apiKey: "AIzaSyAWmYNZbjpijp6NGO-Lw743kogqtJimBCo",
  authDomain: "opc-new-48a8d.firebaseapp.com",
  projectId: "opc-new-48a8d",
  databaseURL: "https://opc-new-48a8d-default-rtdb.europe-west1.firebasedatabase.app"
};
const app = initializeApp(config);
const db = getDatabase(app);
async function check() {
  try {
    const snap = await get(ref(db, '/'));
    if (snap.exists()) {
      console.log(`RTDB ROOT: ${Object.keys(snap.val())}`);
      const mSnap = await get(ref(db, 'members'));
      console.log(`Members: ${mSnap.exists() ? Object.keys(mSnap.val()).length : 0}`);
    } else {
      console.log(`RTDB: does not exist`);
    }
  } catch(e) {
    console.log(`RTDB error:`, e);
  }
  process.exit(0);
}
check();
