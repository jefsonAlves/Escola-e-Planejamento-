import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, initializeFirestore } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };
import firebaseJson from "./firebase.json" assert { type: "json" };
import fetch from "node-fetch";

// Polyfill fetch for firebase
global.fetch = fetch;

const app = initializeApp(firebaseConfig);
const dbDefault = initializeFirestore(app, {}, "(default)");
const dbCustomId = firebaseJson.firestore.find((f) => f.database !== "(default)")?.database;
const dbCustom = dbCustomId ? initializeFirestore(app, {}, dbCustomId) : null;

async function run() {
    try {
        const snap1 = await getDocs(collection(dbDefault, "users"));
        console.log("Docs in default:", snap1.size);
    } catch (e: any) {
        console.error("Default DB error:", e.message);
    }

    if (dbCustom) {
        try {
            const snap2 = await getDocs(collection(dbCustom, "users"));
            console.log(`Docs in ${dbCustomId}:`, snap2.size);
        } catch (e: any) {
             console.error("Custom DB error:", e.message);
        }
    }
}
run();
