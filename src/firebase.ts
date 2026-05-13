import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(console.error);

export let messaging: any = null;
export const getAppMessaging = () => {
   if (messaging) return messaging;
   if (typeof window !== 'undefined' && 'serviceWorker' in navigator && firebaseConfig.messagingSenderId) {
     try {
       messaging = getMessaging(app);
       return messaging;
     } catch(e) {
       console.warn('Firebase Messaging could not be initialized.', e);
     }
   }
   return null;
};
