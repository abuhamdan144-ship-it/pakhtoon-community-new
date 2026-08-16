import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, initializeFirestore } from "firebase/firestore";

const oldConfig = {
  projectId: "opc-new-48a8d",
  appId: "1:211508737297:web:32aa85d2f0efad1b4008b0",
  apiKey: "AIzaSyAWmYNZbjpijp6NGO-Lw743kogqtJimBCo",
  authDomain: "opc-new-48a8d.firebaseapp.com",
  storageBucket: "opc-new-48a8d.firebasestorage.app",
  messagingSenderId: "211508737297",
  measurementId: "G-9HQ1RRW4LP"
};

const app = initializeApp(oldConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, "(default)");

async function test() {
  try {
    console.log("Fetching members...");
    const snap = await getDocs(collection(db, "members"));
    console.log("Found", snap.size, "members");
  } catch (e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
test();
