const fs = require('fs');
const file = 'src/components/Admin.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const AUTHORISED_ADMIN_EMAILS = new Set\(\[([\s\S]*?)\]\);/,
  "const AUTHORISED_ADMIN_EMAILS = new Set([\n  'abuhamdan144@gmail.com',\n  'admin@opc.org',\n  'admin@opc.com',\n  'adminopc@opc.com',\n  'malakabbas47@gmail.com',\n]);"
);

fs.writeFileSync(file, content);
console.log("Patched Admin.jsx with new email");
