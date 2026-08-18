import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';

const configStr = fs.readFileSync('firebase-applet-config.json', 'utf8');
const config = JSON.parse(configStr);

// Add databaseURL if missing, assuming standard format
if (!config.databaseURL) {
  config.databaseURL = `https://${config.projectId}-default-rtdb.firebaseio.com`;
}

const app = initializeApp(config);
const db = getDatabase(app);

async function check() {
  try {
    const snap = await get(ref(db, 'members'));
    if (snap.exists()) {
      console.log(`RTDB 'members': ${Object.keys(snap.val()).length} items`);
    } else {
      console.log(`RTDB 'members': does not exist`);
    }
  } catch(e) {
    console.log(`RTDB error:`, e.message);
  }
  process.exit(0);
}
check();
