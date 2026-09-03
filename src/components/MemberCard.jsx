import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Download, Image as ImageIcon, KeyRound, Mail, Search, Send, ShieldCheck } from 'lucide-react';

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, app } from '../firebase/config';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';
import { buildCardFront, buildCardBack, buildCardImageCombined } from './MemberCardBuilder';






export default function MemberCard() {
  const location = useLocation();
  const [lookupValue, setLookupValue] = useState(() => location.state?.lookup || '');
  const [pinValue, setPinValue] = useState('');
  
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(false);

    const lookupCard = async (event) => {
    event.preventDefault();
    const lookup = lookupValue.trim();
    const pin = pinValue.replace(/\D/g, '');
    
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
      } else if (/^\+?\d+$/.test(lookup.replace(/\s+/g, ''))) {
        q = query(memberCardsRef, where('phone', '==', lookup.replace(/\D/g, '')), where('cardPin', '==', pin));
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

  const buildCardPdf = async () => {
    const frontCanvas = await buildCardFront(member);
    const backCanvas = await buildCardBack(member);
    
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1200, 756], compress: true });
    pdf.addImage(frontCanvas.toDataURL('image/png', 0.9), 'PNG', 0, 0, 1200, 756);
    pdf.addPage([1200, 756], 'landscape');
    pdf.addImage(backCanvas.toDataURL('image/png', 0.9), 'PNG', 0, 0, 1200, 756);
    return pdf.output('blob');
  };

  const downloadBlob = (blob, extension) => {
    if (!blob) throw new Error('Failed to generate file'); const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${member.membershipId || 'opc-membership-card'}.${extension}`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadCard = async () => {
    if (!member) return;
    setLoading(true);
    try { downloadBlob(await buildCardPdf(), 'pdf'); toast.success('PDF membership card downloaded.'); }
    catch (error) { toast.error(error?.stack || error?.message || 'Unable to download the card.'); console.error(error); }
    finally { setLoading(false); }
  };

  const downloadCardImage = async () => {
    if (!member) return;
    setLoading(true);
    try { downloadBlob(await buildCardImageCombined(member), 'png'); toast.success('Image membership card downloaded.'); }
    catch (error) { toast.error(error?.stack || error?.message || 'Unable to download the card image.'); console.error(error); }
    finally { setLoading(false); }
  };

  const shareCard = async (channel) => {
    if (!member) return;
    setLoading(true);
    try {
      const blob = await buildCardPdf();
      const file = new File([blob], `${member.membershipId || 'opc-membership-card'}.pdf`, { type: 'application/pdf' });
      const text = `My approved Oman Pakhtoon Community membership card is ready. Membership ID: ${member.membershipId}.`;
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: 'OPC membership card', text, files: [file] });
      } else if (channel === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text} Download the card from ${window.location.origin}/card.`)}`, '_blank', 'noopener,noreferrer');
        toast.success('WhatsApp opened. Attach the downloaded card if needed.');
      } else {
        window.location.href = `mailto:?subject=${encodeURIComponent(`OPC membership card - ${member.membershipId}`)}&body=${encodeURIComponent(`${text}\n\nPlease attach the downloaded PDF or PNG card.`)}`;
        toast.success('Your email app opened. Attach the downloaded card if needed.');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') toast.error(error?.message || 'Unable to share the card.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f6] px-4 py-20 sm:px-6">
      <main className="mx-auto max-w-xl rounded-3xl border border-gray-200 bg-white p-6 shadow-xl sm:p-9">
        <Link to="/" className="text-sm font-bold text-forest-dark underline decoration-gold decoration-2 underline-offset-4">← Return to OPC</Link>
        <div className="mt-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-dark text-gold"><ShieldCheck size={25} /></div>
        <p className="mt-4 text-xs font-bold uppercase tracking-[.2em] text-gold">Approved member access</p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-forest-dark">Download your membership card</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">Enter your approved member name or registered mobile number </p>

        {!member && <form className="mt-7 space-y-5" onSubmit={lookupCard}>
          <label className="block text-sm font-semibold text-gray-700"><span className="inline-flex items-center gap-2"><Search size={16} /> Approved member name or mobile number</span>
            <input value={lookupValue} onChange={(event) => setLookupValue(event.target.value)} autoComplete="name tel" placeholder="Full name or +968 mobile number" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20" />
          </label>
<label className="block text-sm font-semibold text-gray-700"><span className="inline-flex items-center gap-2"><KeyRound size={16} /> Password (last 4 digits of your phone)</span>
<input type="password" value={pinValue} onChange={(event) => setPinValue(event.target.value)} placeholder="e.g. 1234" maxLength={4} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20" />
</label>
<button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-forest-dark px-5 py-3.5 font-bold text-gold disabled:opacity-70"><ShieldCheck size={18} /> {loading ? 'Checking approved record…' : 'Open my card'}</button>
        </form>}

        {member && <section className="mt-7 rounded-2xl bg-forest-dark p-4 text-white"><p className="text-sm text-white/80">Approved card for <strong className="text-gold">{member.name}</strong></p><div className="mt-4 overflow-hidden rounded-xl border border-gold/30 bg-white/5"><img src={member.previewUrl || undefined} alt="OPC membership card preview" className="hidden" /><p className="p-4 text-sm text-white/70">Your card is ready. Choose a download or sharing option below.</p></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><button type="button" onClick={downloadCard} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 font-bold text-forest-dark disabled:opacity-70"><Download size={17} /> Download PDF</button><button type="button" onClick={downloadCardImage} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-4 py-3 font-bold text-white disabled:opacity-70"><ImageIcon size={17} /> Download image</button><button type="button" onClick={() => shareCard('whatsapp')} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold/60 px-4 py-3 font-bold text-gold disabled:opacity-70"><Send size={17} /> Send by WhatsApp</button><button type="button" onClick={() => shareCard('email')} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-4 py-3 font-bold text-white disabled:opacity-70"><Mail size={17} /> Send by email</button></div><button type="button" onClick={() => { setMember(null);  }} className="mt-5 text-xs font-bold uppercase tracking-[.14em] text-white/70 underline underline-offset-4">Search another approved card</button></section>}
      </main>
    </div>
  );
}
