import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const historicalDatabaseId = firebaseConfig.firestoreDatabaseId || 'ai-studio-7f5d5a28-ea42-42fa-9865-8df2286be432';
const db = getFirestore(app, historicalDatabaseId);
const auth = getAuth(app);

async function seed() {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, 'Admin@opc.com', '123456');
    console.log('User created:', userCredential.user.uid);
    // Write an admin document? Or update members? Let's check how admins are defined.
  } catch (err) {
    console.error('Error creating user:', err.message);
  }
  process.exit(0);
}
seed();
