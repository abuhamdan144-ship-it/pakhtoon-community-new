const fs = require('fs');
const file = 'src/components/MemberCard.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/const lookupCard = async \(event\) => \{[\s\S]*?const buildCardPdf = async \(\) => \{/m, 
`const lookupCard = async (event) => {
    event.preventDefault();
    const lookup = lookupValue.trim();
    const pin = pinValue.replace(/\\D/g, '');
    
    if (!lookup || pin.length !== 4) {
      toast.error('Enter your name or mobile, and the last 4 digits of your phone.');
      return;
    }
    
    setLoading(true);
    try {
      const memberCardsRef = collection(db, 'memberCards');
      let q;
      if (lookup.toLowerCase().startsWith('opc-om-')) {
        q = query(memberCardsRef, where('membershipId', '==', lookup.toUpperCase()), where('cardPin', '==', pin));
      } else if (/^\\+?\\d+$/.test(lookup.replace(/\\s+/g, ''))) {
        q = query(memberCardsRef, where('phone', '==', lookup.replace(/\\D/g, '')), where('cardPin', '==', pin));
      } else {
        q = query(memberCardsRef, where('nameKey', '==', lookup.toLowerCase()), where('cardPin', '==', pin));
      }
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error('No approved membership card matched these details.');
      }
      
      const record = snapshot.docs[0].data();
      record.approved = true; 
      setMember(record);
      toast.success('Your approved membership card is ready.');
    } catch (error) {
      toast.error(error?.message || 'No approved membership card matched these details.');
      setMember(null);
    } finally {
      setLoading(false);
    }
  };

  const buildCardPdf = async () => {`);
fs.writeFileSync(file, content);
