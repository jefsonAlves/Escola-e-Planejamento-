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
  connectFirestoreEmulator,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const config = firebaseConfig as any;
const app = initializeApp(firebaseConfig);

const dbId =
  config.firestoreDatabaseId && config.firestoreDatabaseId !== "(default)"
    ? config.firestoreDatabaseId
    : undefined;

export const db = dbId
  ? initializeFirestore(
      app,
      {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      },
      dbId,
    )
  : initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });

export const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn("Não foi possível manter a sessão local do Firebase Auth:", error);
});

const shouldUseFirebaseEmulators =
  import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";

if (typeof window !== "undefined" && shouldUseFirebaseEmulators) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", {
    disableWarnings: true,
  });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
