import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { OperationType, FirestoreErrorInfo } from './types';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize the App
const app = initializeApp(firebaseConfig);

// Initialize Firestore targeting the specific applet Database ID instance
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || 'ai-studio-7f5d5a28-ea42-42fa-9865-8df2286be432');

// Initialize Auth
export const auth = getAuth(app);

/**
 * Handle Firestore operational errors and format specific JSON diagnostic reporting
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const message = error instanceof Error ? error.message : String(error);
  const isBillingOrPermission = message.includes('PERMISSION_DENIED') || message.includes('billing') || message.includes('requires billing') || message.includes('client is offline');

  const errInfo: FirestoreErrorInfo = {
    error: message,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  if (isBillingOrPermission) {
    console.warn(`[Firestore Fallback Mode] Service notice for path '${path}': ${message}`);
  } else {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  }
  return errInfo;
}

/**
 * Test standard connection as mandated by skill guidelines
 */
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase connection validated successfully.');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('the client is offline') || error.message.includes('PERMISSION_DENIED') || error.message.includes('billing')) {
        console.warn('Firebase Notice: Cloud Firestore requires billing enabled on GCP project opc-new-48a8d. Running in local state fallback mode.');
      }
    }
  }
}

testConnection();
