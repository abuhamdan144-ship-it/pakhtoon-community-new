import fs from 'fs';
let html = fs.readFileSync('index.html', 'utf8');

const regex = /const db = initializeFirestore\(app,\s*\{/;
const replacement = "const db = initializeFirestore(app, { databaseId: 'ai-studio-7f5d5a28-ea42-42fa-9865-8df2286be432',";

if (regex.test(html)) {
  html = html.replace(regex, replacement);
  fs.writeFileSync('index.html', html);
  console.log('Successfully updated initializeFirestore in index.html');
} else {
  console.log('Could not find initializeFirestore(app, { ... } in index.html');
}
