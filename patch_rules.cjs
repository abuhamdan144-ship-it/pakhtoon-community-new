const fs = require('fs');
const file = 'firestore.rules';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /'malakabbas47@gmail\.com'/,
  "'adminopc@opc.com',\n        'malakabbas47@gmail.com'"
);

fs.writeFileSync(file, content);
console.log("Patched firestore.rules");
