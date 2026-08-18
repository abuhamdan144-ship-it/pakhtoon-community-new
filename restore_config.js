import fs from 'fs';

const configStr = fs.readFileSync('firebase-applet-config.json', 'utf8');
const config = JSON.parse(configStr);

let html = fs.readFileSync('index.html', 'utf8');

const replacement = `const firebaseConfig = {
      apiKey: "${config.apiKey}",
      authDomain: "${config.authDomain}",
      projectId: "${config.projectId}",
      storageBucket: "${config.storageBucket}",
      messagingSenderId: "${config.messagingSenderId}",
      appId: "${config.appId}"
    };`;

html = html.replace(/const firebaseConfig = {[\s\S]*?};/, replacement);

fs.writeFileSync('index.html', html);
fs.writeFileSync('single-page-app.html', html);
console.log('Restored config');
