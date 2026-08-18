import admin from 'firebase-admin';

// Initialize the app with a service account or default credentials
admin.initializeApp({
  projectId: "opc-new-48a8d",
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

async function check() {
  try {
    const collections = await db.listCollections();
    for (const col of collections) {
      const snap = await col.get();
      console.log(`Admin - Collection '${col.id}': ${snap.size} documents`);
    }
  } catch(e) {
    console.log("Admin SDK error:", e.message);
  }
  process.exit(0);
}
check();
