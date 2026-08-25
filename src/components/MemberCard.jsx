import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, LockKeyhole, Phone, ShieldCheck } from 'lucide-react';
import { RecaptchaVerifier, onAuthStateChanged, signInWithPhoneNumber, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { auth } from '../firebase/config';
import { collections } from '../firebase/collections';

const normalizePhone = (value = '') => value.replace(/[\s()-]/g, '');

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
      context.fillText(member.membershipId || 'PENDING', textX, 415);
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
  const [phone, setPhone] = useState('');
  const [membershipId, setMembershipId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authPhone, setAuthPhone] = useState('');
  const recaptchaRef = useRef(null);
  const verifierRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthPhone(user?.phoneNumber || '');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => () => verifierRef.current?.clear?.(), []);

  const requestCode = async (event) => {
    event.preventDefault();
    const normalizedPhone = normalizePhone(phone);
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      toast.error('Enter the registered mobile number in international format, for example +968XXXXXXXX.');
      return;
    }
    if (!membershipId.trim()) {
      toast.error('Enter your OPC membership ID.');
      return;
    }

    setLoading(true);
    try {
      verifierRef.current?.clear?.();
      verifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current, { size: 'invisible' });
      const result = await signInWithPhoneNumber(auth, normalizedPhone, verifierRef.current);
      setConfirmation(result);
      toast.success('A verification code was sent to your registered phone.');
    } catch (error) {
      verifierRef.current?.clear?.();
      verifierRef.current = null;
      toast.error(error?.message || 'Unable to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndLoadCard = async (event) => {
    event.preventDefault();
    if (!confirmation || !verificationCode.trim()) return;

    setLoading(true);
    try {
      const credential = await confirmation.confirm(verificationCode.trim());
      const verifiedPhone = normalizePhone(credential.user.phoneNumber || '');
      const cardId = membershipId.trim().toUpperCase();
      const cardSnapshot = await getDoc(doc(collections.memberCards, cardId));
      const record = cardSnapshot.exists() ? cardSnapshot.data() : null;
      if (!record || record.status !== 'approved' || normalizePhone(record.phone) !== verifiedPhone) {
        throw new Error('No approved card matched this verified phone number and membership ID.');
      }
      setMember({
        name: record.name || '',
        membershipId: record.membershipId || cardId,
        photo: record.photo || '',
        status: record.status,
      });
      toast.success('Your approved membership card is ready.');
    } catch (error) {
      toast.error(error?.message || 'The verification code or membership details were not accepted.');
      await signOut(auth);
      setAuthPhone('');
    } finally {
      setLoading(false);
    }
  };

  const downloadCard = async () => {
    if (!member) return;
    setLoading(true);
    try {
      const blob = await buildCardImage(member);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${member.membershipId || 'opc-membership-card'}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error?.message || 'Unable to download the card.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f6] px-4 py-20 sm:px-6">
      <main className="mx-auto max-w-xl rounded-3xl border border-gray-200 bg-white p-6 shadow-xl sm:p-9">
        <Link to="/" className="text-sm font-bold text-forest-dark underline decoration-gold decoration-2 underline-offset-4">← Return to OPC</Link>
        <div className="mt-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-dark text-gold"><ShieldCheck size={25} /></div>
        <p className="mt-4 text-xs font-bold uppercase tracking-[.2em] text-gold">Secure card access</p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-forest-dark">Download your membership card</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">Verify the phone number registered with OPC and enter your membership ID. Both values must match an approved membership record.</p>

        {!confirmation && !member && (
          <form className="mt-7 space-y-5" onSubmit={requestCode}>
            <label className="block text-sm font-semibold text-gray-700">Registered mobile number
              <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+968XXXXXXXX" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20" />
            </label>
            <label className="block text-sm font-semibold text-gray-700">OPC membership ID
              <input value={membershipId} onChange={(event) => setMembershipId(event.target.value)} placeholder="OPC-OM-2026-0001" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-mono uppercase outline-none focus:border-gold focus:ring-2 focus:ring-gold/20" />
            </label>
            <div ref={recaptchaRef} />
            <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-forest-dark px-5 py-3.5 font-bold text-gold disabled:opacity-70"><Phone size={18} /> {loading ? 'Sending code…' : 'Send verification code'}</button>
          </form>
        )}

        {confirmation && !member && (
          <form className="mt-7 space-y-5" onSubmit={verifyAndLoadCard}>
            <p className="rounded-xl bg-forest-dark/[.05] p-4 text-sm text-forest-dark">A code was sent to {authPhone || normalizePhone(phone)}. Enter it below to unlock your approved card.</p>
            <label className="block text-sm font-semibold text-gray-700">SMS verification code
              <input value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" placeholder="123456" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-center font-mono text-xl tracking-[.35em] outline-none focus:border-gold focus:ring-2 focus:ring-gold/20" />
            </label>
            <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-forest-dark px-5 py-3.5 font-bold text-gold disabled:opacity-70"><LockKeyhole size={18} /> {loading ? 'Verifying…' : 'Verify and open card'}</button>
          </form>
        )}

        {member && (
          <div className="mt-7 rounded-2xl bg-gradient-to-br from-forest-dark to-forest p-6 text-white shadow-lg">
            <div className="flex items-center gap-4">
              <div className="h-20 w-16 overflow-hidden rounded border border-gold/50 bg-white/10">{member.photo ? <img src={member.photo} alt="Member profile" className="h-full w-full object-cover" /> : null}</div>
              <div><p className="text-xs font-bold uppercase tracking-[.16em] text-gold">Approved OPC member</p><h2 className="mt-1 text-xl font-bold">{member.name}</h2><p className="mt-1 font-mono text-sm text-white/75">{member.membershipId}</p></div>
            </div>
            <button type="button" onClick={downloadCard} disabled={loading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-5 py-3.5 font-bold text-forest-dark disabled:opacity-70"><Download size={18} /> {loading ? 'Preparing card…' : 'Download membership card'}</button>
          </div>
        )}
      </main>
    </div>
  );
}
