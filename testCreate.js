import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function test() {
  try {
    const user = await createUserWithEmailAndPassword(auth, 'test-admin999@opc.com', '123456');
    console.log('Created successfully:', user.user.email);
  } catch (error) {
    console.error('Create failed:', error.code, error.message);
  }
  process.exit(0);
}

test();
