const fs = require('fs');
let code = fs.readFileSync('src/components/MemberCard.jsx', 'utf8');

code = code.replace(
  "const [pinValue, setPinValue] = useState('');",
  "const [pinValue, setPinValue] = useState('1234');"
);

code = code.replace(
  '<label className="block text-sm font-semibold text-gray-700"><span className="inline-flex items-center gap-2"><KeyRound size={16} /> Secure PIN code</span>',
  '<label className="block text-sm font-semibold text-gray-700"><span className="inline-flex items-center gap-2"><KeyRound size={16} /> Secure PIN code (Default: 1234)</span>'
);

fs.writeFileSync('src/components/MemberCard.jsx', code);
