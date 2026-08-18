import fs from 'fs';

let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(
  'import { initializeFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";',
  'import { initializeFirestore, memoryLocalCache } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";'
);

html = html.replace(
  'const db = initializeFirestore(app, { experimentalForceLongPolling: true });',
  'const db = initializeFirestore(app, { experimentalForceLongPolling: true, localCache: memoryLocalCache() });'
);

fs.writeFileSync('index.html', html);
fs.writeFileSync('single-page-app.html', html);
console.log('Fixed index.html');
