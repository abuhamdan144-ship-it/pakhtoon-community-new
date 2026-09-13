const fs = require('fs');
const file = 'src/components/Admin.jsx';
let content = fs.readFileSync(file, 'utf8');

const tableRowRegex = /<tr key=\{member\.id\}[^>]*>[\s\S]*?<\/tr>/;
const rowMatch = content.match(tableRowRegex);
if (rowMatch) {
  console.log(rowMatch[0]);
} else {
  console.log("No match");
}
