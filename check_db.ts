import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, initializeFirestore } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };
import firebaseJson from "./firebase.json" assert { type: "json" };

const app = initializeApp(firebaseConfig);
const dbDefault = getFirestore(app);
const dbCustomId = firebaseJson.firestore.find((f: any) => f.database !== "(default)")?.database;
const dbCustom = dbCustomId ? initializeFirestore(app, {}, dbCustomId) : null;

async function run() {
    try {
        const snap1 = await getDocs(collection(dbDefault, "users"));
        console.log("Docs in default:");
        snap1.forEach(d => console.log(d.id, d.data().email));
    } catch (e: any) {
        console.error("Default DB error:", e.message);
    }

    if (dbCustom) {
        try {
            const snap2 = await getDocs(collection(dbCustom, "users"));
            console.log(`Docs in ${dbCustomId}:`);
            snap2.forEach(d => console.log(d.id, d.data().email));
        } catch (e: any) {
             console.error("Custom DB error:", e.message);
        }
    }
}
run();
