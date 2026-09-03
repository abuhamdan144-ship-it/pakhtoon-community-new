const fs = require('fs');
const file = 'src/components/MemberCard.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/<\/label>\s*<button type="submit"/, `</label>\n<label className="block text-sm font-semibold text-gray-700"><span className="inline-flex items-center gap-2"><KeyRound size={16} /> Password (last 4 digits of your phone)</span>\n<input type="password" value={pinValue} onChange={(event) => setPinValue(event.target.value)} placeholder="e.g. 1234" maxLength={4} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20" />\n</label>\n<button type="submit"`);
fs.writeFileSync(file, content);
