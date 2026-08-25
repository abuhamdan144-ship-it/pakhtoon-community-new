import admin from 'firebase-admin';

// Initialize the app with default credentials for the real project
admin.initializeApp({
  projectId: "ai-studio-omanpakhtooncomm-7f5d5a28-ea42-42fa-9865-8df2286be432",
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();
async function check() {
  try {
    const collections = await db.listCollections();
    console.log(`Found ${collections.length} collections`);
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
