import fs from 'fs';
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(
  'console.error("Home load error:", err);',
  'console.error("Home load error:", err); alert("Error loading data. Check console for details. " + err.message); document.getElementById("page-home").insertAdjacentHTML("afterbegin", "<div class=\\"card badge-danger\\">Error: " + err.message + "</div>");'
);

fs.writeFileSync('index.html', html);
fs.writeFileSync('single-page-app.html', html);
console.log('Fixed errors');
