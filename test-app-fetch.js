import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, initializeFirestore } from "firebase/firestore";
import fs from "fs";

const newConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const appNew = initializeApp(newConfig, "new");
const dbNew = initializeFirestore(appNew, {
  experimentalForceLongPolling: true,
}, "(default)");

getDocs(collection(dbNew, "members")).then(snapshot => {
  const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log("Successfully fetched:", list.length);
  process.exit(0);
}).catch(err => {
  console.error("Error fetching:", err);
  process.exit(1);
});
