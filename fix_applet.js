import fs from 'fs';

let html = fs.readFileSync('index.html', 'utf8');

// The user was seeing nothing because the API key was set to "YOUR_API_KEY". 
// Let's make sure the preview actually loads using the AI Studio injected config so they can see the app.
// I'll swap it back to using the auto-injected firebase config from firebase-applet-config.json
const configStr = fs.readFileSync('firebase-applet-config.json', 'utf8');
const config = JSON.parse(configStr);

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
console.log('Restored config');
