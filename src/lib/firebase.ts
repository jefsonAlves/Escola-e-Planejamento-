import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

console.log("Firebase config loaded:", firebaseConfig);

const app = initializeApp(firebaseConfig);
const dbId = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)") ? firebaseConfig.firestoreDatabaseId : undefined;

export const db = dbId ? getFirestore(app, dbId) : getFirestore(app);

export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(console.error);
