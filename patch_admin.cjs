const fs = require('fs');
const file = 'src/components/Admin.jsx';
let content = fs.readFileSync(file, 'utf8');

// Undo the '1234' logic in saveMember and issueMembershipId
content = content.replace(/const cardPin = String\(member\.cardPin \|\| '1234'\)\.replace\(\/\\D\/g, ''\)\.slice\(0, 6\)\.padStart\(4, '0'\);/g, "const cardPin = deriveCardPin(member.phone);");

content = content.replace(/const cardPin = savedRecord\.cardPin \|\| '1234';/g, "const cardPin = savedRecord.status === 'approved' ? deriveCardPin(savedRecord.phone) : savedRecord.cardPin || '';");

content = content.replace(/const cardPin = member\.cardPin \|\| "1234";/g, "const cardPin = deriveCardPin(member.phone);");

content = content.replace(/const cardPin = record\.cardPin \|\| deriveCardPin\(record\.phone\);/g, "const cardPin = deriveCardPin(record.phone);");

// Remove the Field for Card access PIN
content = content.replace(/<Field label="Card access PIN" value=\{memberDraft\.cardPin \|\| ""\} onChange=\{\(val\) => setMemberDraft\(\{ \.\.\.memberDraft, cardPin: val \}\)\} \/>/g, "");
content = content.replace(/<Field label="Card access PIN \(last 4 phone digits\)" value=\{memberDraft\.phone \? deriveCardPin\(memberDraft\.phone\) : ''\} onChange=\{\(\) => \{\}\} \/>/g, "");

fs.writeFileSync(file, content);
