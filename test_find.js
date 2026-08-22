import fs from 'fs';
let html = fs.readFileSync('index.html', 'utf8');
console.log(html.indexOf('initializeFirestore'));
