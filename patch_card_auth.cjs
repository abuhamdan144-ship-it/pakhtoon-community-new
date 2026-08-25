const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/components/MemberCard.jsx', 'utf8');

// 1. Add imports
code = code.replace("import { db } from '../firebase/config';", "import { db, app } from '../firebase/config';\nimport { getFunctions, httpsCallable } from 'firebase/functions';");

// 2. Add pinValue state
code = code.replace(
  "const [lookupValue, setLookupValue] = useState(() => location.state?.lookup || '');",
  "const [lookupValue, setLookupValue] = useState(() => location.state?.lookup || '');\n  const [pinValue, setPinValue] = useState('');"
);

// 3. Replace lookupCard logic
const oldLookupStart = `  const lookupCard = async (event) => {`;
const newLookupLogic = `  const lookupCard = async (event) => {
    event.preventDefault();
    const lookup = lookupValue.trim();
    const pin = pinValue.replace(/\\D/g, '');
    
    if (!lookup || pin.length !== 4) {
      toast.error('Enter your name or mobile, and the last 4 digits of your phone.');
      return;
    }
    
    setLoading(true);
    try {
      const functions = getFunctions(app, 'us-central1');
      const lookupMemberCardByPin = httpsCallable(functions, 'lookupMemberCardByPin');
      const result = await lookupMemberCardByPin({ lookup, pin });
      const record = result.data;
      
      if (!record || !record.name) throw new Error('No approved membership card matched these details.');
      
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

// Use regex to replace the old lookupCard function body
code = code.replace(/const lookupCard = async \(event\) => \{[\s\S]*?const buildCardPdf = async \(\) => \{/, newLookupLogic + '\n\n  const buildCardPdf = async () => {');

// 4. Update UI to add PIN field
const oldForm = `<form className="mt-7 space-y-5" onSubmit={lookupCard}>
          <label className="block text-sm font-semibold text-gray-700"><span className="inline-flex items-center gap-2"><Search size={16} /> Approved member name or mobile number</span>
            <input value={lookupValue} onChange={(event) => setLookupValue(event.target.value)} autoComplete="name tel" placeholder="Full name or +968 mobile number" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20" />
          </label>
          
          <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-forest-dark px-5 py-3.5 font-bold text-gold disabled:opacity-70"><ShieldCheck size={18} /> {loading ? 'Checking approved record…' : 'Open my card'}</button>
        </form>`;

const newForm = `<form className="mt-7 space-y-5" onSubmit={lookupCard}>
          <label className="block text-sm font-semibold text-gray-700"><span className="inline-flex items-center gap-2"><Search size={16} /> Approved member name or mobile number</span>
            <input value={lookupValue} onChange={(event) => setLookupValue(event.target.value)} autoComplete="name tel" placeholder="Full name or +968 mobile number" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20" />
          </label>
          
          <label className="block text-sm font-semibold text-gray-700"><span className="inline-flex items-center gap-2"><KeyRound size={16} /> Secure PIN code</span>
            <input value={pinValue} onChange={(event) => setPinValue(event.target.value)} type="password" inputMode="numeric" maxLength={4} placeholder="Last 4 digits of your phone" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 tracking-widest outline-none focus:border-gold focus:ring-2 focus:ring-gold/20" />
          </label>
          
          <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-forest-dark px-5 py-3.5 font-bold text-gold disabled:opacity-70"><ShieldCheck size={18} /> {loading ? 'Checking approved record…' : 'Open my card'}</button>
        </form>`;

code = code.replace(oldForm, newForm);

fs.writeFileSync('/app/applet/src/components/MemberCard.jsx', code);
