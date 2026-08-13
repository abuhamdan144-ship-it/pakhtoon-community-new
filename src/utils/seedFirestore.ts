import { collection, doc, setDoc, getDocs, limit, query, Timestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import {
  DEFAULT_MEMBERS,
  DEFAULT_CABINET,
  DEFAULT_NEWS,
  DEFAULT_ELECTIONS,
  DEFAULT_EMBASSY,
  DEFAULT_FOUNDER,
  DEFAULT_DONATIONS,
  DEFAULT_INCIDENTS
} from '../defaultData';

export async function seedFirestoreDatabase(force: boolean = false): Promise<{ success: boolean; message: string }> {
  try {
    // Only proceed with auto-seed if admin is authenticated or forced
    if (!auth.currentUser && !force) {
      return { success: false, message: 'Admin authentication required to seed Firestore.' };
    }

    // Check if data already exists in cabinet collection unless forcing seed
    if (!force) {
      const checkSnap = await getDocs(query(collection(db, 'cabinet'), limit(1)));
      if (!checkSnap.empty) {
        return { success: true, message: 'Firestore collections already contain data.' };
      }
    }

    console.log('Starting Firestore data seeding...');

    // Seed Cabinet Members
    for (const cm of DEFAULT_CABINET) {
      const docRef = doc(db, 'cabinet', cm.id || `cab-${Math.random().toString(36).substr(2, 9)}`);
      await setDoc(docRef, { ...cm, updatedAt: Timestamp.now() }, { merge: true });
    }

    // Seed Approved Members
    for (const mem of DEFAULT_MEMBERS) {
      const docRef = doc(db, 'members', mem.id || `mem-${Math.random().toString(36).substr(2, 9)}`);
      await setDoc(docRef, { ...mem, createdAt: Timestamp.now() }, { merge: true });
    }

    // Seed News Announcements
    for (const item of DEFAULT_NEWS) {
      const docRef = doc(db, 'news', item.id || `news-${Math.random().toString(36).substr(2, 9)}`);
      await setDoc(docRef, { ...item, createdAt: Timestamp.now() }, { merge: true });
    }

    // Seed Donations
    for (const don of DEFAULT_DONATIONS) {
      const docRef = doc(db, 'donations', don.id || `don-${Math.random().toString(36).substr(2, 9)}`);
      await setDoc(docRef, { ...don, createdAt: Timestamp.now() }, { merge: true });
    }

    // Seed Incident Reports
    for (const inc of DEFAULT_INCIDENTS) {
      const docRef = doc(db, 'incidents', inc.id || `inc-${Math.random().toString(36).substr(2, 9)}`);
      await setDoc(docRef, { ...docRef, ...inc, createdAt: Timestamp.now() }, { merge: true });
    }

    // Seed Elections
    for (const el of DEFAULT_ELECTIONS) {
      const docRef = doc(db, 'elections', el.id || `elec-${Math.random().toString(36).substr(2, 9)}`);
      await setDoc(docRef, { ...el, createdAt: Timestamp.now() }, { merge: true });
    }

    // Seed Embassy & Founder Settings
    await setDoc(doc(db, 'settings', 'embassy'), { ...DEFAULT_EMBASSY, updatedAt: Timestamp.now() }, { merge: true });
    await setDoc(doc(db, 'settings', 'founder'), { ...DEFAULT_FOUNDER, updatedAt: Timestamp.now() }, { merge: true });

    console.log('Firestore data seeding completed successfully!');
    return { success: true, message: 'All Firestore collections have been seeded with sample data successfully!' };
  } catch (error: any) {
    console.error('Error seeding Firestore database:', error);
    handleFirestoreError(error, OperationType.CREATE, 'seed_data');
    return { success: false, message: error.message || 'Failed to seed Firestore database.' };
  }
}
