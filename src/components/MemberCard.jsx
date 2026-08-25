import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Download, Image as ImageIcon, KeyRound, Mail, Search, Send, ShieldCheck } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';
import { app } from '../firebase/config';

const functions = getFunctions(app, 'us-central1');
const lookupApprovedMemberCard = httpsCallable(functions, 'lookupMemberCardByPin');

const imageFromDataUrl = (source) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = source;
});

function buildCardImage(member) {
  return new Promise(async (resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 756;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Card canvas is unavailable.');

      const background = context.createLinearGradient(0, 0, 1200, 756);
      background.addColorStop(0, '#062d24');
      background.addColorStop(1, '#0f5a45');
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#d4af37';
      context.fillRect(0, 0, canvas.width, 22);
      context.fillStyle = 'rgba(255,255,255,.10)';
      context.beginPath();
      context.arc(1090, 120, 210, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = '#f8efd0';
      context.font = '700 44px Georgia, serif';
      context.fillText('PAKHTOON COMMUNITY OMAN', 72, 105);
      context.fillStyle = '#d4af37';
      context.font = '600 20px Arial, sans-serif';
      context.fillText('OFFICIAL MEMBERSHIP IDENTITY CARD', 75, 142);

      const photoX = 75;
      const photoY = 205;
      const photoWidth = 245;
      const photoHeight = 315;
      context.fillStyle = 'rgba(255,255,255,.12)';
      context.fillRect(photoX, photoY, photoWidth, photoHeight);
      if (member.photo) {
        try {
          const image = await imageFromDataUrl(member.photo);
          const imageRatio = image.width / image.height;
          const frameRatio = photoWidth / photoHeight;
          let sourceWidth = image.width;
          let sourceHeight = image.height;
          let sourceX = 0;
          let sourceY = 0;
          if (imageRatio > frameRatio) {
            sourceWidth = image.height * frameRatio;
            sourceX = (image.width - sourceWidth) / 2;
          } else {
            sourceHeight = image.width / frameRatio;
            sourceY = (image.height - sourceHeight) / 2;
          }
          context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, photoX, photoY, photoWidth, photoHeight);
        } catch (_) {
          context.fillStyle = '#d4af37';
          context.font = '700 72px Arial, sans-serif';
          context.fillText('OPC', 132, 385);
        }
      }

      const textX = 390;
      context.fillStyle = 'rgba(255,255,255,.65)';
      context.font = '600 18px Arial, sans-serif';
      context.fillText('MEMBER NAME', textX, 238);
      context.fillStyle = '#ffffff';
      context.font = '700 45px Arial, sans-serif';
      context.fillText(String(member.name || 'OPC MEMBER').toUpperCase().slice(0, 32), textX, 290);
      context.fillStyle = 'rgba(255,255,255,.65)';
      context.font = '600 18px Arial, sans-serif';
      context.fillText('MEMBERSHIP ID', textX, 365);
      context.fillStyle = '#d4af37';
      context.font = '700 38px monospace';
      context.fillText(member.membershipId || 'OPC-MEMBER', textX, 415);
      context.fillStyle = 'rgba(255,255,255,.65)';
      context.font = '600 18px Arial, sans-serif';
      context.fillText('STATUS', textX, 485);
      context.fillStyle = '#ffffff';
      context.font = '700 28px Arial, sans-serif';
      context.fillText('APPROVED MEMBER', textX, 525);
      context.fillStyle = 'rgba(255,255,255,.48)';
      context.font = '500 16px Arial, sans-serif';
      context.fillText('Digital card issued by Oman Pakhtoon Community', 75, 674);
      context.fillText(`Generated ${new Date().toLocaleDateString()}`, 75, 707);

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('The card image could not be generated.'));
          return;
        }
        resolve(blob);
      }, 'image/png');
    } catch (error) {
      reject(error);
    }
  });
}

export default function MemberCard() {
  const location = useLocation();
  const [lookupValue, setLookupValue] = useState(() => location.state?.lookup || '');
  const [pin, setPin] = useState('');
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(false);

  const lookupCard = async (event) => {
    event.preventDefault();
    const lookup = lookupValue.trim();
    const accessPin = pin.trim();
    if (!lookup) {
      toast.error('Enter the approved member name or registered mobile number.');
      return;
    }
    if (!/^\d{4}$/.test(accessPin)) {
      toast.error('Enter the last four digits of your registered mobile number.');
      return;
    }

    setLoading(true);
    try {
      const response = await lookupApprovedMemberCard({ lookup, pin: accessPin });
      const record = response.data;
      if (!record?.approved || !record.name) throw new Error('No approved membership card matched these details.');
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
    const imageBlob = await buildCardImage(member);
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(imageBlob);
    });
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1200, 756], compress: true });
    pdf.addImage(dataUrl, 'PNG', 0, 0, 1200, 756);
    return pdf.output('blob');
  };

  const downloadBlob = (blob, extension) => {
    const url = URL.createObjectURL(blob);
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
    catch (error) { toast.error(error?.message || 'Unable to download the card.'); }
    finally { setLoading(false); }
  };

  const downloadCardImage = async () => {
    if (!member) return;
    setLoading(true);
    try { downloadBlob(await buildCardImage(member), 'png'); toast.success('Image membership card downloaded.'); }
    catch (error) { toast.error(error?.message || 'Unable to download the card image.'); }
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
        <p className="mt-3 text-sm leading-6 text-gray-600">Enter your approved member name or registered mobile number and the private four-digit PIN made from the last four digits of your registered mobile number.</p>

        {!member && <form className="mt-7 space-y-5" onSubmit={lookupCard}>
          <label className="block text-sm font-semibold text-gray-700"><span className="inline-flex items-center gap-2"><Search size={16} /> Approved member name or mobile number</span>
            <input value={lookupValue} onChange={(event) => setLookupValue(event.target.value)} autoComplete="name tel" placeholder="Full name or +968 mobile number" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20" />
          </label>
          <label className="block text-sm font-semibold text-gray-700"><span className="inline-flex items-center gap-2"><KeyRound size={16} /> Card access PIN (last 4 mobile digits)</span>
            <input value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" autoComplete="one-time-code" maxLength={4} placeholder="Last 4 digits" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 tracking-[.35em] outline-none focus:border-gold focus:ring-2 focus:ring-gold/20" />
          </label>
          <p className="text-xs leading-5 text-gray-500">Only approved OPC records can unlock a card. Your PIN is checked securely by the OPC server and is never displayed on the card.</p>
          <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-forest-dark px-5 py-3.5 font-bold text-gold disabled:opacity-70"><ShieldCheck size={18} /> {loading ? 'Checking approved record…' : 'Open my card'}</button>
        </form>}

        {member && <section className="mt-7 rounded-2xl bg-forest-dark p-4 text-white"><p className="text-sm text-white/80">Approved card for <strong className="text-gold">{member.name}</strong></p><div className="mt-4 overflow-hidden rounded-xl border border-gold/30 bg-white/5"><img src={member.previewUrl || ''} alt="OPC membership card preview" className="hidden" /><p className="p-4 text-sm text-white/70">Your card is ready. Choose a download or sharing option below.</p></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><button type="button" onClick={downloadCard} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 font-bold text-forest-dark disabled:opacity-70"><Download size={17} /> Download PDF</button><button type="button" onClick={downloadCardImage} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-4 py-3 font-bold text-white disabled:opacity-70"><ImageIcon size={17} /> Download image</button><button type="button" onClick={() => shareCard('whatsapp')} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold/60 px-4 py-3 font-bold text-gold disabled:opacity-70"><Send size={17} /> Send by WhatsApp</button><button type="button" onClick={() => shareCard('email')} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-4 py-3 font-bold text-white disabled:opacity-70"><Mail size={17} /> Send by email</button></div><button type="button" onClick={() => { setMember(null); setPin(''); }} className="mt-5 text-xs font-bold uppercase tracking-[.14em] text-white/70 underline underline-offset-4">Search another approved card</button></section>}
      </main>
    </div>
  );
}
