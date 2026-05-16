import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

console.log("Firebase config loaded:", firebaseConfig);

const app = initializeApp(firebaseConfig);
const dbId = firebaseConfig.firestoreDatabaseId || "ai-studio-colgiohorizonte2-29789425-8112-4a7f-945f-398d0b48fe01";
export const db = getFirestore(app, dbId);

export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(console.error);
