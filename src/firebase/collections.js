import { collection } from 'firebase/firestore';
import { db } from './config';

export const collections = {
  members: collection(db, 'members'),
  donations: collection(db, 'donations'),
  incidents: collection(db, 'incidents'),
  cabinet: collection(db, 'cabinet'),
  news: collection(db, 'news'),
  elections: collection(db, 'elections'),
  ads: collection(db, 'ads'),
  settings: collection(db, 'settings')
};
