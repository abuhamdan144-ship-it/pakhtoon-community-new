import fs from 'fs';
let html = fs.readFileSync('index.html', 'utf8');

const oldConfig = `    const firebaseConfig = {
      apiKey: "AIzaSyAWmYNZbjpijp6NGO-Lw743kogqtJimBCo",
      authDomain: "opc-new-48a8d.firebaseapp.com",
      projectId: "opc-new-48a8d",
      storageBucket: "opc-new-48a8d.firebasestorage.app",
      messagingSenderId: "211508737297",
      appId: "1:211508737297:web:32aa85d2f0efad1b4008b0"
    };`;

const newConfig = `    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "opc-new-48a8d.firebaseapp.com",
      projectId: "opc-new-48a8d",
      storageBucket: "opc-new-48a8d.appspot.com",
      messagingSenderId: "YOUR_SENDER_ID",
      appId: "YOUR_APP_ID"
    };`;

html = html.replace(oldConfig, newConfig);
fs.writeFileSync('index.html', html);
console.log('Fixed config in index.html to precisely use YOUR_API_KEY');
