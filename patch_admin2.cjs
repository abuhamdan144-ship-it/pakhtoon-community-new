const fs = require('fs');
const file = 'src/components/Admin.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/PIN: \{member\.cardPin \|\| deriveCardPin\(member\.phone\) \|\| 'Unavailable'\}/g, "PIN: {deriveCardPin(member.phone) || 'Unavailable'}");
fs.writeFileSync(file, content);
