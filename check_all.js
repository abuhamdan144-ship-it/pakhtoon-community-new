import fs from 'fs';
const files = fs.readdirSync('src').filter(f => f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.jsx'));
console.log(files);
