import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  projectId: "opc-new-48a8d"
});

// Admin SDK allows getting all collections!
const db = getFirestore("ai-studio-omanpakhtooncomm-7f5d5a28-ea42-42fa-9865-8df2286be432");

async function check() {
  try {
    const collections = await db.listCollections();
    console.log(`Found ${collections.length} collections in named DB`);
    for (const col of collections) {
      const snap = await col.get();
      console.log(`  Collection '${col.id}': ${snap.size} documents`);
    }
  } catch(e) {
    console.log("Error:", e.message);
  }
  process.exit(0);
}
check();
