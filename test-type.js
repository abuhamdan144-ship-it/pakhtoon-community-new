import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, orderBy, doc } from "firebase/firestore";
const app = initializeApp({ projectId: "opc-new-48a8d" });
const db = getFirestore(app);
const q = query(collection(db, "members"), orderBy("createdAt"));
const d = doc(db, "members", "123");
console.log("Query type:", q.type, "Doc type:", d.type);
