import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const historicalDatabaseId =
  firebaseConfig.firestoreDatabaseId ||
  'ai-studio-7f5d5a28-ea42-42fa-9865-8df2286be432';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export { app };
export const db = getFirestore(app, historicalDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
