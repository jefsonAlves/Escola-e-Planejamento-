import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  connectAuthEmulator,
} from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  connectFirestoreEmulator,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

import firebaseJson from "../../firebase.json";

console.log("Firebase config loaded:", firebaseConfig);

const config = firebaseConfig as any;
const app = initializeApp(firebaseConfig);
const dbId =
  config.firestoreDatabaseId && config.firestoreDatabaseId !== "(default)"
    ? config.firestoreDatabaseId
    : undefined;

export const db = dbId
  ? initializeFirestore(app, { localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()}) }, dbId)
  : initializeFirestore(app, { localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()}) });



export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(console.error);

if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  console.log("Conectando aos emuladores do Firebase...");
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
