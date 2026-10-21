import React, { useEffect, useMemo, useState } from 'react';
import {
  addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, runTransaction,
  serverTimestamp, setDoc, where
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword,
  signOut, updatePassword
} from 'firebase/auth';
import {
  AlertTriangle, Building2, CheckCircle2, LogIn, LogOut, Newspaper,
  PhoneCall, ShieldCheck, UserPlus, Vote, WalletCards
} from 'lucide-react';
import { auth, db } from '../firebase/config';
import { collections } from '../firebase/collections';

const DEFAULT_EMBASSY = {
  name: 'Embassy of Pakistan, Muscat',
  address: 'Al Khuwair, Muscat, Sultanate of Oman',
  phone: '+968 2468 4600',
  emergency: '+968 9985 9757',
  email: 'parepmuscat@mofa.gov.pk',
  hours: 'Sunday–Thursday, 8:00 AM–4:00 PM',
  website: 'https://mofa.gov.pk/muscat'
};

const EMPTY_FORM = {
  name: '', father: '', cnic: '', phone: '', whatsapp: '', district: 'Muscat',
  address: 'Muscat, Oman', occupation: '', emergency: '', photo: ''
};

const digitsOnly = value => String(value || '').replace(/\D/g, '');
const usernameEmail = value => {
  const raw = String(value || '').trim();
  if (raw.includes('@')) return raw.toLowerCase();
  const digits = digitsOnly(raw);
  if (digits.length >= 7) return `member-${digits}@members.pakhtooncommunity.app`;
  return `member-${raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}@members.pakhtooncommunity.app`;
};
const loginKey = value => {
  const raw = String(value || '').trim();
  const digits = digitsOnly(raw);
  return digits.length >= 7 ? `phone_${digits}` : `name_${raw.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
};

function Card({ member }) {
  return (
    <div className="overflow-hidden rounded-3xl border-2 border-[#d4af37] bg-gradient-to-br from-[#0e2e25] via-[#1b4d3e] to-[#082219] p-6 text-[#faf6ed] shadow-2xl">
      <div className="flex items-center justify-between border-b border-[#d4af37]/40 pb-4">
        <div><p className="text-[10px] font-black uppercase tracking-[.25em] text-[#d4af37]">Oman Diaspora Portal</p><h3 className="mt-1 text-xl font-black">Pakhtoon Community</h3></div>
        <ShieldCheck className="text-[#d4af37]" size={34} />
      </div>
      <div className="mt-5 flex gap-4">
        <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-[#d4af37]/60 bg-white/10">
          {member.photo ? <img src={member.photo} alt={member.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-2xl font-black text-[#d4af37]">{String(member.name || 'M').slice(0, 1)}</div>}
        </div>
        <div className="min-w-0 space-y-1 text-sm"><p className="truncate text-xl font-black text-white">{member.name}</p><p className="text-[#faf6ed]/70">Father: {member.father || '—'}</p><p className="text-[#faf6ed]/70">District: {member.district || '—'}</p><p className="font-mono text-[#d4af37]">{member.membershipId || 'Pending approval'}</p></div>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-[#d4af37]/30 pt-4 text-xs"><span className="rounded-full bg-emerald-400/20 px-3 py-1 font-bold text-emerald-200">{String(member.status || 'pending').toUpperCase()}</span><span className="text-[#faf6ed]/70">Valid community credential</span></div>
    </div>
  );
}

function AuthPanel({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (mode === 'login') {
        const authEmail = identity.includes('@') ? identity.trim().toLowerCase() : (await getDoc(doc(db, 'memberLogins', loginKey(identity)))).data()?.email;
        if (!authEmail) throw new Error('No member was found with that name or mobile number.');
        await signInWithEmailAndPassword(auth, authEmail, password);
      } else {
        if (!form.name || !form.father || !form.cnic || !form.phone) throw new Error('Please complete the required member details.');
        const mobileDigits = digitsOnly(form.phone);
        if (mobileDigits.length < 4) throw new Error('Please enter a valid mobile number.');
        const initialPassword = mobileDigits.slice(-4);
        const authEmail = usernameEmail(form.phone);
        const credential = await createUserWithEmailAndPassword(auth, authEmail, initialPassword);
        const memberRef = await addDoc(collections.members, { ...form, email: authEmail, loginName: form.name.trim().toLowerCase(), loginPhone: mobileDigits, uid: credential.user.uid, status: 'pending', initialPasswordChanged: false, createdAt: serverTimestamp() });
        await Promise.all([
          setDoc(doc(db, 'memberLogins', loginKey(form.name)), { email: authEmail, uid: credential.user.uid, memberId: memberRef.id }),
          setDoc(doc(db, 'memberLogins', loginKey(form.phone)), { email: authEmail, uid: credential.user.uid, memberId: memberRef.id })
        ]);
      }
      onAuthenticated();
    } catch (err) {
      setError(err?.code === 'auth/email-already-in-use' ? 'This member username is already registered. Please sign in.' : (err?.message || 'Authentication failed.'));
    } finally { setBusy(false); }
  };

  return <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
    <div className="rounded-3xl bg-white p-6 shadow-xl sm:p-8">
      <div className="mb-6 flex gap-2 rounded-2xl bg-slate-100 p-1"><button onClick={() => setMode('login')} className={`flex-1 rounded-xl px-3 py-2 text-xs font-black ${mode === 'login' ? 'bg-[#0e2e25] text-[#d4af37]' : 'text-slate-600'}`}>Member Login</button><button onClick={() => setMode('register')} className={`flex-1 rounded-xl px-3 py-2 text-xs font-black ${mode === 'register' ? 'bg-[#0e2e25] text-[#d4af37]' : 'text-slate-600'}`}>Register</button></div>
      <form onSubmit={submit} className="space-y-3">
        {mode === 'register' && <div className="grid gap-3 sm:grid-cols-2">{[['name','Full name *'],['father','Father name *'],['cnic','CNIC / NICOP *'],['phone','Oman phone *'],['district','District'],['occupation','Occupation']].map(([key,label]) => <input key={key} required={label.includes('*')} value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} placeholder={label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />)}</div>}
        {mode === 'login' && <><input required value={identity} onChange={e => setIdentity(e.target.value)} placeholder="Name or mobile number" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" /><input type="password" required minLength={4} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" /></>}
        {mode === 'register' && <p className="rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800">After registration, sign in with your name or mobile number. Your initial password is the last four digits of your mobile number.</p>}
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0e2e25] px-4 py-3 font-black text-[#d4af37] disabled:opacity-60">{mode === 'login' ? <LogIn size={17} /> : <UserPlus size={17} />}{busy ? 'Please wait…' : mode === 'login' ? 'Sign in to member portal' : 'Create member account'}</button>
      </form>
    </div>
    <div className="rounded-3xl bg-[#0e2e25] p-7 text-[#faf6ed] shadow-xl"><WalletCards className="mb-4 text-[#d4af37]" size={38} /><h2 className="font-serif text-3xl font-black">Your community in one place</h2><p className="mt-3 text-sm leading-7 text-[#faf6ed]/75">Access your approved membership card, participate in elections, request emergency support, and receive embassy and community news securely.</p><div className="mt-6 space-y-3 text-sm"><p>✓ Verified member dashboard</p><p>✓ Secure one-member voting</p><p>✓ Emergency and welfare reporting</p><p>✓ Embassy services and announcements</p></div></div>
  </div>;
}

function ChangePassword({ user }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const submit = async event => {
    event.preventDefault(); setStatus('');
    if (newPassword.length < 6) return setStatus('Password must be at least 6 characters.');
    if (newPassword !== confirmPassword) return setStatus('Passwords do not match.');
    try {
      await updatePassword(user, newPassword);
      setNewPassword(''); setConfirmPassword(''); setOpen(false); setStatus('Password changed successfully.');
    } catch (err) {
      setStatus(err?.code === 'auth/requires-recent-login' ? 'Please sign out and sign in again before changing your password.' : (err?.message || 'Password could not be changed.'));
    }
  };
  return <div className="mt-5 rounded-2xl bg-white/10 p-4"><button onClick={() => setOpen(!open)} className="text-sm font-black text-[#d4af37]">{open ? 'Cancel password change' : 'Change password'}</button>{open && <form onSubmit={submit} className="mt-3 space-y-2"><input required minLength={6} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" className="w-full rounded-xl border-0 px-3 py-2 text-sm text-slate-900" /><input required minLength={6} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="w-full rounded-xl border-0 px-3 py-2 text-sm text-slate-900" /><button className="rounded-xl bg-[#d4af37] px-3 py-2 text-xs font-black text-[#0e2e25]">Save password</button></form>}{status && <p className="mt-2 text-xs text-[#faf6ed]/80">{status}</p>}</div>;
}

export default function MemberPortal() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [member, setMember] = useState(null);
  const [elections, setElections] = useState([]);
  const [news, setNews] = useState([]);
  const [embassy, setEmbassy] = useState(DEFAULT_EMBASSY);
  const [tab, setTab] = useState('dashboard');
  const [report, setReport] = useState({ type: 'injury', name: '', contact: '', description: '' });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => onAuthStateChanged(auth, next => { setUser(next); setAuthReady(true); }), []);
  useEffect(() => {
    if (!user) { setMember(null); return undefined; }
    const memberQuery = query(collections.members, where('uid', '==', user.uid));
    return onSnapshot(memberQuery, snapshot => {
      const first = snapshot.docs[0];
      setMember(first ? { id: first.id, ...first.data() } : null);
    });
  }, [user]);
  useEffect(() => {
    const unsubElections = onSnapshot(collections.elections, snapshot => setElections(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubNews = onSnapshot(query(collections.news, orderBy('createdAt', 'desc')), snapshot => setNews(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 12)), () => setNews([]));
    getDoc(doc(collections.settings, 'embassy')).then(s => s.exists() && setEmbassy({ ...DEFAULT_EMBASSY, ...s.data() })).catch(() => {});
    return () => { unsubElections(); unsubNews(); };
  }, []);

  const approved = member?.status === 'approved';
  const activeElections = useMemo(() => elections.filter(e => e.status === 'open'), [elections]);
  const vote = async (election, candidate) => {
    if (!approved || !member?.id || !user) return setMessage('Only approved members can vote.');
    setBusy(true); setMessage('');
    try {
      const electionRef = doc(collections.elections, election.id);
      const voteRef = doc(collection(electionRef, 'votes'), user.uid);
      await runTransaction(db, async transaction => {
        const previous = await transaction.get(voteRef);
        if (previous.exists()) throw new Error('You have already voted in this election.');
        transaction.set(voteRef, { uid: user.uid, memberId: member.id, candidateId: candidate.id, createdAt: serverTimestamp() });
      });
      setMessage('Your vote was recorded successfully.');
    } catch (err) { setMessage(err?.message || 'Vote could not be recorded.'); } finally { setBusy(false); }
  };
  const submitReport = async event => {
    event.preventDefault(); setBusy(true); setMessage('');
    try { await addDoc(collections.incidents, { ...report, email: user.email, memberId: user.uid, memberRecordId: member?.id || '', status: 'pending', createdAt: serverTimestamp() }); setReport({ type: 'injury', name: '', contact: '', description: '' }); setMessage('Emergency report submitted. The community team will contact you.'); } catch (err) { setMessage(err?.message || 'Report could not be submitted.'); } finally { setBusy(false); }
  };

  if (!authReady) return <div className="min-h-screen bg-[#faf6ed] p-10 text-center text-[#0e2e25]">Loading member portal…</div>;
  return <main className="min-h-screen bg-[#faf6ed] px-4 py-12 text-[#0e2e25] sm:px-6">
    <div className="mx-auto max-w-7xl"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[.25em] text-[#1b4d3e]">Pakhtoon Community Oman</p><h1 className="mt-2 font-serif text-4xl font-black">Member Portal</h1><p className="mt-2 text-sm text-slate-600">Registration, membership card, voting, welfare, embassy services, and news.</p></div>{user && <button onClick={() => signOut(auth)} className="flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold"><LogOut size={16} /> Sign out</button>}</div>
      {!user ? <AuthPanel onAuthenticated={() => {}} /> : !member ? <div className="rounded-3xl bg-white p-8 text-center shadow-xl"><h2 className="text-2xl font-black">Account connected</h2><p className="mt-2 text-slate-600">Your member record is being prepared. If you registered before, please contact the administrator to link your account.</p></div> : <>
        <div className="mb-6 flex flex-wrap gap-2">{[['dashboard','Dashboard',WalletCards],['vote','Voting',Vote],['report','Emergency report',AlertTriangle],['embassy','Embassy services',Building2],['news','News',Newspaper]].map(([id,label,Icon]) => <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black ${tab === id ? 'bg-[#0e2e25] text-[#d4af37]' : 'bg-white text-slate-600 shadow-sm'}`}><Icon size={16} />{label}</button>)}</div>
        {message && <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{message}</div>}
        {tab === 'dashboard' && <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><div><Card member={member} /><div className="mt-5 rounded-2xl bg-white p-5 shadow"><h2 className="mb-4 flex items-center gap-2 text-lg font-black"><CheckCircle2 className="text-emerald-600" size={20} /> Member details</h2><div className="grid gap-3 text-sm sm:grid-cols-2"><p><b>Username:</b> {member.name || member.phone}</p><p><b>Phone:</b> {member.phone || '—'}</p><p><b>CNIC/NICOP:</b> {member.cnic || member.omanId || '—'}</p><p><b>Address:</b> {member.address || '—'}</p><p><b>Status:</b> {String(member.status || 'pending').toUpperCase()}</p><p><b>Membership ID:</b> {member.membershipId || 'Pending approval'}</p></div></div></div><div className="rounded-3xl bg-[#0e2e25] p-7 text-[#faf6ed] shadow-xl"><h2 className="font-serif text-2xl font-black">Member actions</h2><p className="mt-3 text-sm leading-7 text-[#faf6ed]/70">{approved ? 'Your account is approved. You can vote and submit requests.' : 'Your registration is awaiting administrator approval. Your card and voting access will activate after approval.'}</p><button onClick={() => setTab('report')} className="mt-6 flex items-center gap-2 rounded-xl bg-[#d4af37] px-4 py-3 text-sm font-black text-[#0e2e25]"><PhoneCall size={17} /> Emergency contact & report</button><ChangePassword user={user} /></div></div>}
        {tab === 'vote' && <section className="space-y-5"><h2 className="font-serif text-3xl font-black">Community voting</h2>{!approved && <p className="rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">Voting is available only to approved members.</p>}{activeElections.length === 0 ? <div className="rounded-2xl bg-white p-6 text-slate-600 shadow">No open elections at this time.</div> : activeElections.map(election => <div key={election.id} className="rounded-3xl bg-[#0e2e25] p-6 text-white shadow-xl"><h3 className="text-xl font-black text-[#d4af37]">{election.title}</h3><div className="mt-4 grid gap-3 sm:grid-cols-2">{(election.candidates || []).map(candidate => <button key={candidate.id} disabled={!approved || busy} onClick={() => vote(election, candidate)} className="rounded-xl border border-[#d4af37]/40 bg-[#1b4d3e] p-4 text-left hover:border-[#d4af37] disabled:opacity-50"><span className="font-bold">{candidate.name}</span><span className="mt-1 block text-xs text-[#faf6ed]/60">{candidate.votes || 0} votes · Vote securely</span></button>)}</div></div>)}</section>}
        {tab === 'report' && <section className="max-w-2xl"><h2 className="font-serif text-3xl font-black">Emergency contact and report</h2><a href={`tel:${embassy.emergency || '+96899859757'}`} className="mt-4 flex items-center gap-3 rounded-2xl bg-red-700 p-4 font-black text-white shadow"><PhoneCall /> Emergency hotline: {embassy.emergency || '+968 9985 9757'}</a><form onSubmit={submitReport} className="mt-5 space-y-3 rounded-3xl bg-white p-6 shadow-xl"><input required placeholder="Applicant or affected person name" value={report.name} onChange={e => setReport({...report,name:e.target.value})} className="w-full rounded-xl border border-slate-200 px-4 py-3" /><input required placeholder="Contact phone" value={report.contact} onChange={e => setReport({...report,contact:e.target.value})} className="w-full rounded-xl border border-slate-200 px-4 py-3" /><select value={report.type} onChange={e => setReport({...report,type:e.target.value})} className="w-full rounded-xl border border-slate-200 px-4 py-3"><option value="injury">Medical / injury</option><option value="death">Death / repatriation</option><option value="loss">Passport / document loss</option><option value="welfare">Welfare assistance</option></select><textarea required rows="5" placeholder="Describe the emergency and support needed" value={report.description} onChange={e => setReport({...report,description:e.target.value})} className="w-full rounded-xl border border-slate-200 px-4 py-3" /><button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0e2e25] px-4 py-3 font-black text-[#d4af37]">{busy ? 'Submitting…' : 'Submit secure report'}</button></form></section>}
        {tab === 'embassy' && <section><h2 className="font-serif text-3xl font-black">Embassy details and services</h2><div className="mt-5 grid gap-5 lg:grid-cols-2"><div className="rounded-3xl bg-[#0e2e25] p-7 text-[#faf6ed] shadow-xl"><Building2 className="text-[#d4af37]" size={34} /><h3 className="mt-4 text-2xl font-black text-[#d4af37]">{embassy.name}</h3><div className="mt-4 space-y-2 text-sm text-[#faf6ed]/80"><p>{embassy.address}</p><p>Phone: {embassy.phone}</p><p>Email: {embassy.email}</p><p>Hours: {embassy.hours}</p><a className="font-bold text-[#d4af37] underline" href={embassy.website} target="_blank" rel="noreferrer">Official website</a></div></div><div className="grid gap-3 sm:grid-cols-2">{['Passport renewal and emergency travel documents','NICOP and identity services','Visa and consular guidance','Labour and legal assistance','Document loss and police report guidance','Emergency repatriation coordination'].map(service => <div key={service} className="rounded-2xl bg-white p-5 shadow"><ShieldCheck className="text-emerald-700" size={22} /><p className="mt-3 text-sm font-bold">{service}</p></div>)}</div></div></section>}
        {tab === 'news' && <section><h2 className="font-serif text-3xl font-black">Community news</h2><div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{news.length ? news.map(item => <article key={item.id} className="rounded-2xl bg-white p-5 shadow"><Newspaper className="text-[#1b4d3e]" size={22} /><h3 className="mt-3 text-lg font-black">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{item.content}</p></article>) : <div className="rounded-2xl bg-white p-6 text-slate-600 shadow">News and announcements will appear here.</div>}</div></section>}
      </>}
    </div>
  </main>;
}
