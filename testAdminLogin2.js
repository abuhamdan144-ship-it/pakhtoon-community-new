import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function test() {
  try {
    const user = await signInWithEmailAndPassword(auth, 'admin@opc.com', '123456');
    console.log('Login successful for:', user.user.email);
  } catch (error) {
    console.error('Login failed:', error.code, error.message);
  }
  process.exit(0);
}

test();
