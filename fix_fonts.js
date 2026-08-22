import fs from 'fs';

let html = fs.readFileSync('index.html', 'utf8');

const headFonts = `<title>Pakhtoon Community | Official Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">`;

html = html.replace('<title>Pakhtoon Community | Official Portal</title>', headFonts);
html = html.replace("font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;", "font-family: 'Inter', sans-serif;");
html = html.replace("font-family: Georgia, serif;", "font-family: 'Playfair Display', serif;");

fs.writeFileSync('index.html', html);
console.log('Fixed fonts in index.html');
