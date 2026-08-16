import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, orderBy, where, getDocs, initializeFirestore } from "firebase/firestore";
import fs from "fs";

const newConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const appNew = initializeApp(newConfig, "new");
const dbNew = initializeFirestore(appNew, {
  experimentalForceLongPolling: true,
}, "(default)");

async function test() {
  try {
    const q1 = query(collection(dbNew, 'members'), orderBy('createdAt', 'desc'));
    const s1 = await getDocs(q1);
    console.log("q1 size:", s1.size);
  } catch (e) {
    console.error("q1 error:", e);
  }
  try {
    const q2 = query(collection(dbNew, 'members'), where('status', '==', 'approved'));
    const s2 = await getDocs(q2);
    console.log("q2 size:", s2.size);
  } catch (e) {
    console.error("q2 error:", e);
  }
  process.exit(0);
}
test();
