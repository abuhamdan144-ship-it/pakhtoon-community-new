import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function create() {
  try {
    const user = await createUserWithEmailAndPassword(auth, 'Admin@opc.com', '123456');
    console.log('Successfully created user:', user.user.uid);
  } catch (error) {
    console.error('Error creating user code:', error.code);
    console.error('Error creating user message:', error.message);
  }
  process.exit(0);
}

create();
