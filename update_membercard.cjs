const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/components/MemberCard.jsx', 'utf8');

// Add firestore imports
code = code.replace(
  "import { getFunctions, httpsCallable } from 'firebase/functions';",
  "import { getFunctions, httpsCallable } from 'firebase/functions';\nimport { collection, query, where, getDocs } from 'firebase/firestore';\nimport { db } from '../firebase/config';"
);

// Replace the lookupCard function
const newLookupCard = `const lookupCard = async (event) => {
    event.preventDefault();
    const lookup = lookupValue.trim();
    if (!lookup) {
      toast.error('Enter the approved member name or registered mobile number.');
      return;
    }
    
    setLoading(true);
    try {
      const lookupLower = lookup.toLowerCase().replace(/\\s+/g, ' ');
      const looksLikePhone = /^\\+?\\d[\\d\\s()-]{7,}$/.test(lookup);
      
      const cardsSnap = await getDocs(query(collection(db, 'memberCards'), where('status', '==', 'approved')));
      const membersSnap = await getDocs(query(collection(db, 'members'), where('status', '==', 'approved')));
      
      const candidates = [
        ...cardsSnap.docs.map(d => ({...d.data(), source: 'card'})),
        ...membersSnap.docs.map(d => ({...d.data(), source: 'member'}))
      ];
      
      const record = candidates.find(c => {
        if (looksLikePhone) {
          const cPhone = String(c.phone || '').replace(/\\D/g, '');
          const lPhone = lookup.replace(/\\D/g, '');
          return cPhone && cPhone.includes(lPhone);
        } else {
          const cName = String(c.nameKey || c.name || '').toLowerCase().replace(/\\s+/g, ' ');
          return cName === lookupLower;
        }
      });
      
      if (!record || !record.name) throw new Error('No approved membership card matched these details.');
      
      // Keep compatibility with the card object format expected
      record.approved = true; 
      
      setMember(record);
      toast.success('Your approved membership card is ready.');
    } catch (error) {
      toast.error(error?.message || 'No approved membership card matched these details.');
      setMember(null);
    } finally {
      setLoading(false);
    }
  };`;

code = code.replace(/const lookupCard = async \(event\) => \{[\s\S]*?\};/, newLookupCard);

// Remove PIN state and JSX
code = code.replace(/const \[pin, setPin\] = useState\(''\);/, "");
code = code.replace(/<label className="block text-sm font-semibold text-gray-700"><span className="inline-flex items-center gap-2"><KeyRound size=\{16\} \/> Card access PIN \(last 4 mobile digits\)<\/span>[\s\S]*?<\/label>/, "");
code = code.replace(/<p className="text-xs leading-5 text-gray-500">Only approved OPC records can unlock a card. Your PIN is checked securely by the OPC server and is never displayed on the card.<\/p>/, "");
code = code.replace(/setPin\(''\);/g, "");
code = code.replace(/and the private four-digit PIN made from the last four digits of your registered mobile number./, "");

fs.writeFileSync('/app/applet/src/components/MemberCard.jsx', code);
