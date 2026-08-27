import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, CalendarDays, CheckCircle2, Edit3, FileText, ImagePlus, LoaderCircle, LogIn, LogOut, MessageCircle, Newspaper, Plus, Save, ShieldCheck, Trash2, Users, XCircle,
} from 'lucide-react';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { addDoc, deleteDoc, doc, onSnapshot, orderBy, query, runTransaction, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { collections } from '../firebase/collections';
import { defaultHeroLegends } from '../data/heroLegends';

const TABS = [
  { label: 'Overview', icon: FileText },
  { label: 'Members', icon: Users },
  { label: 'Events', icon: CalendarDays },
  { label: 'Cabinet', icon: ShieldCheck },
  { label: 'News', icon: Newspaper },
  { label: 'Donations', icon: FileText },
  { label: 'Incidents', icon: AlertTriangle },
  { label: 'Elections', icon: CheckCircle2 },
  { label: 'Ads', icon: ImagePlus },
  { label: 'Comments', icon: MessageCircle },
  { label: 'Legends', icon: ShieldCheck },
];

const AUTHORISED_ADMIN_EMAILS = new Set([
  'abuhamdan144@gmail.com',
  'admin@opc.org',
  'admin@opc.com',
  'malakabbas47@gmail.com',
]);

const asDate = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  if (value?.toDate) return value.toDate().toISOString().slice(0, 10);
  return '';
};

const normalizePhone = (value = '') => String(value).replace(/[\s()-]/g, '');

const deriveCardPin = (phone = '') => String(phone).replace(/\D/g, '').slice(-4);

const readImage = (file) => new Promise((resolve, reject) => {
  if (!file?.type?.startsWith('image/')) {
    reject(new Error('Choose an image file.'));
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    reject(new Error('Choose an image smaller than 5 MB.'));
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const source = reader.result;
    const image = new Image();
    image.onload = () => {
      const maxSize = 720;
      const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * ratio));
      canvas.height = Math.max(1, Math.round(image.height * ratio));
      const context = canvas.getContext('2d');
      if (!context) { resolve(source); return; }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    image.onerror = () => resolve(source);
    image.src = source;
  };
  reader.onerror = () => reject(new Error('The image could not be read.'));
  reader.readAsDataURL(file);
});

function isAuthorisedAdmin(user) {
  const email = user?.email?.trim().toLowerCase();
  return Boolean(email && AUTHORISED_ADMIN_EMAILS.has(email));
}

function StatusPill({ value = 'pending' }) {
  const status = String(value).toLowerCase();
  const classes = status === 'approved' || status === 'published'
    ? 'bg-green-100 text-green-700'
    : status === 'rejected' || status === 'archived'
      ? 'bg-red-100 text-red-700'
      : 'bg-orange-100 text-orange-700';
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${classes}`}>{status.toUpperCase()}</span>;
}

function ImageField({ label, value, onChange, onClear }) {
  return (
    <label className="block text-sm font-semibold text-gray-700">
      {label}
      <span className="mt-2 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600 transition hover:border-gold hover:bg-gold/5">
        <ImagePlus size={18} className="text-forest-dark" /> Upload or replace image
        <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={onChange} />
      </span>
      {value && <div className="mt-3 flex items-center gap-3"><img src={value} alt="Selected upload" className="h-20 w-20 rounded-lg border border-gray-200 object-cover" />{onClear && <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onClear(); }} className="rounded-lg border border-red-100 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50">Remove image</button>}</div>}
    </label>
  );
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState('');
  const [dataError, setDataError] = useState('');
  const [busy, setBusy] = useState(false);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [cabinet, setCabinet] = useState([]);
  const [news, setNews] = useState([]);
  const [donations, setDonations] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [elections, setElections] = useState([]);
  const [ads, setAds] = useState([]);
  const [comments, setComments] = useState([]);
  const [legendsRecords, setLegendsRecords] = useState([]);
  const [editingLegend, setEditingLegend] = useState(null);
  const [legendDraft, setLegendDraft] = useState({ name: '', category: 'Legends of Sports', honor: '', legacy: '', image: '', status: 'published', sortOrder: 1 });
  const [editingRecord, setEditingRecord] = useState(null);
  const [recordDraft, setRecordDraft] = useState({});
  const [creatingMember, setCreatingMember] = useState(false);
  const [memberQuery, setMemberQuery] = useState('');
  const [editingMember, setEditingMember] = useState(null);
  const [memberDraft, setMemberDraft] = useState({});
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventDraft, setEventDraft] = useState({ title: '', date: '', venue: '', description: '', image: '', status: 'published', successful: false });
  const [editingProfile, setEditingProfile] = useState(null);
  const [profileDraft, setProfileDraft] = useState({});

  const authorised = useMemo(() => isAuthorisedAdmin(user), [user]);
  const approvedMembers = members.filter((member) => member.status === 'approved');
  const pendingMembers = members.filter((member) => member.status === 'pending');
  const filteredMembers = members.filter((member) => {
    const term = memberQuery.trim().toLowerCase();
    if (!term) return true;
    return [member.name, member.membershipId, member.phone, member.omanId, member.omanLocation, member.district, member.status].some((value) => String(value || '').toLowerCase().includes(term));
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      setAuthError('');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authorised) {
      setMembers([]); setEvents([]); setCabinet([]); setNews([]); setDonations([]); setIncidents([]); setElections([]); setAds([]); setComments([]); setLegendsRecords([]); setDataError('');
      return undefined;
    }
    setDataError('');
    const unsubscribers = [
      onSnapshot(query(collections.members, orderBy('createdAt', 'desc')), (snapshot) => { const records = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })); setMembers(records); setDoc(doc(collections.settings, 'publicStats'), { totalMembers: records.length, approvedMembers: records.filter((member) => member.status === 'approved').length, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {}); }, () => setDataError('Your administrator account cannot read membership records.')),
      onSnapshot(collections.events, (snapshot) => setEvents(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))), () => setDataError('Your administrator account cannot read event records.')),
      onSnapshot(collections.cabinet, (snapshot) => setCabinet(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))), () => setDataError('Your administrator account cannot read cabinet records.')),
      onSnapshot(collections.news, (snapshot) => { setNews(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))); setDataError((current) => current.includes('news records') ? '' : current); }, () => setDataError('Your administrator account cannot read news records.')),
      onSnapshot(collections.donations, (snapshot) => setDonations(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))), () => setDataError('Your administrator account cannot read donation records.')),
      onSnapshot(collections.incidents, (snapshot) => setIncidents(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))), () => setDataError('Your administrator account cannot read incident records.')),
      onSnapshot(collections.elections, (snapshot) => setElections(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))), () => setDataError('Your administrator account cannot read election records.')),
      onSnapshot(collections.ads, (snapshot) => setAds(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))), () => setDataError('Your administrator account cannot read advertising records.')),
      onSnapshot(collections.comments, (snapshot) => setComments(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))), () => setDataError('Your administrator account cannot read comments.')),
      onSnapshot(collections.legends, (snapshot) => setLegendsRecords(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })).sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))), () => setDataError('Your administrator account cannot read Pakhtoon Legends records.')),
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [authorised]);

  const handleSignIn = async () => {
    setSigningIn(true); setAuthError('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const credential = await signInWithPopup(auth, provider);
      if (!isAuthorisedAdmin(credential.user)) {
        await signOut(auth);
        setAuthError('This Google account is not authorised to access the OPC administrator portal.');
      }
    } catch (error) {
      setAuthError(error?.code === 'auth/popup-closed-by-user' ? 'Sign-in was cancelled. Please try again.' : 'Secure sign-in could not be completed. Confirm that Google sign-in is enabled and try again.');
    } finally { setSigningIn(false); }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setActiveTab('Overview');
  };

  const startNewMember = () => {
    setCreatingMember(true);
    setEditingMember(null);
    setMemberDraft({ name: '', father: '', phone: '', omanId: '', omanLocation: '', district: '', address: '', membershipId: '', cardPin: '', status: 'pending', photo: '' });
  };

  const startMemberEdit = (member) => {
    setCreatingMember(false);
    setEditingMember(member);
    setMemberDraft({
      name: member.name || '', father: member.father || '', phone: member.phone || '', omanId: member.omanId || '', omanLocation: member.omanLocation || '', district: member.district || '', address: member.address || '', membershipId: member.membershipId || '', cardPin: member.cardPin || '', status: member.status || 'pending', photo: member.photo || '',
    });
  };

  const syncMemberCard = async (record) => {
    const membershipId = String(record.membershipId || '').trim().toUpperCase();
    if (!membershipId) return;
    if (record.status === 'approved') {
      const cardPin = deriveCardPin(record.phone);
      await setDoc(doc(collections.memberCards, membershipId), {
        membershipId,
        name: record.name || '',
        nameKey: String(record.name || '').trim().toLowerCase(),
        cardPin,
        omanId: record.omanId || '',
        phone: normalizePhone(record.phone || ''),
        photo: String(record.photo || '').length <= 800000 ? record.photo : '',
        status: 'approved',
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } else {
      await deleteDoc(doc(collections.memberCards, membershipId));
    }
  };

  const issueMembershipId = async (member) => {
    const counterRef = doc(db, 'settings', 'counters');
    let membershipId = member.membershipId;
    if (!membershipId) {
      await runTransaction(db, async (transaction) => {
        const counter = await transaction.get(counterRef);
        const lastMemberNumber = Number(counter.data()?.lastMemberNumber || 0) + 1;
        membershipId = `OPC-OM-${new Date().getFullYear()}-${String(lastMemberNumber).padStart(4, '0')}`;
        transaction.set(counterRef, { lastMemberNumber }, { merge: true });
      });
    }
    const cardPin = String(member.cardPin || generateCardPin()).replace(/\D/g, '').slice(0, 6).padStart(6, '0');
    const approvedRecord = { ...member, status: 'approved', membershipId, cardPin };
    await updateDoc(doc(db, 'members', member.id), { status: 'approved', membershipId, cardPin, approvedAt: serverTimestamp(), updatedAt: serverTimestamp() });
    await syncMemberCard(approvedRecord);
  };

  const syncApprovedMemberCards = async () => {
    if (!window.confirm(`Create or refresh secure card records for ${approvedMembers.length} approved members?`)) return;
    setBusy(true);
    try {
      const eligible = approvedMembers.filter((member) => member.membershipId);
      for (let offset = 0; offset < eligible.length; offset += 400) {
        const batch = writeBatch(db);
        eligible.slice(offset, offset + 400).forEach((member) => {
          const membershipId = String(member.membershipId).trim().toUpperCase();
          const cardPin = deriveCardPin(member.phone);
          batch.set(doc(collections.memberCards, membershipId), { membershipId, name: member.name || '', nameKey: String(member.name || '').trim().toLowerCase(), cardPin, omanId: member.omanId || '', phone: normalizePhone(member.phone || ''), photo: String(member.photo || '').length <= 800000 ? member.photo : '', status: 'approved', updatedAt: serverTimestamp() }, { merge: true });
          batch.update(doc(db, 'members', member.id), { cardPin, updatedAt: serverTimestamp() });
        });
        await batch.commit();
      }
      setDataError(eligible.length === approvedMembers.length ? '' : `${eligible.length} approved cards synced; ${approvedMembers.length - eligible.length} approved members still need a membership ID.`);
    } catch (error) {
      setDataError(error?.message || 'Unable to synchronize approved membership cards.');
    } finally { setBusy(false); }
  };

  const updateMemberStatus = async (member, status) => {
    const message = status === 'approved' ? `Approve ${member.name} and issue a membership ID if needed?` : `Reject the membership application for ${member.name}?`;
    if (!window.confirm(message)) return;
    setBusy(true);
    try {
      if (status === 'approved') await issueMembershipId(member);
      else await updateDoc(doc(db, 'members', member.id), { status: 'rejected', updatedAt: serverTimestamp() });
    } catch (error) {
      setDataError(error?.message || 'Unable to update the member status.');
    } finally { setBusy(false); }
  };

  const saveMember = async (event) => {
    event.preventDefault();
    if (!editingMember && !creatingMember) return;
    setBusy(true);
    try {
      if (creatingMember) {
        await addDoc(collections.members, { ...memberDraft, status: 'pending', membershipId: '', createdAt: serverTimestamp(), createdBy: user?.email || '' });
        setCreatingMember(false);
      } else {
        const savedRecord = { ...editingMember, ...memberDraft };
        const cardPin = savedRecord.status === 'approved' ? deriveCardPin(savedRecord.phone) : savedRecord.cardPin || '';
        await updateDoc(doc(db, 'members', editingMember.id), { ...memberDraft, ...(savedRecord.status === 'approved' ? { cardPin } : {}), updatedAt: serverTimestamp() });
        if (savedRecord.status === 'approved' && savedRecord.membershipId) await syncMemberCard({ ...savedRecord, cardPin });
        else if (editingMember.membershipId) await deleteDoc(doc(collections.memberCards, String(editingMember.membershipId).trim().toUpperCase()));
        setEditingMember(null);
      }
    } catch (error) { setDataError(error?.message || 'Unable to save the member record.'); }
    finally { setBusy(false); }
  };

  const deleteMember = async (member) => {
    if (!window.confirm(`Permanently delete ${member.name}'s membership record? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, 'members', member.id));
      if (member.membershipId) await deleteDoc(doc(collections.memberCards, String(member.membershipId).trim().toUpperCase()));
    }
    catch (error) { setDataError(error?.message || 'Unable to delete the member record.'); }
    finally { setBusy(false); }
  };

  const startNewLegend = () => {
    setEditingLegend({ id: null });
    setLegendDraft({ name: '', category: 'Legends of Sports', honor: '', legacy: '', image: '', status: 'published', sortOrder: legendsRecords.length + 1 });
  };

  const startLegendEdit = (legend) => {
    setEditingLegend(legend);
    setLegendDraft({ name: legend.name || '', category: legend.category || 'Legends of Sports', honor: legend.honor || '', legacy: legend.legacy || '', image: legend.image || '', status: legend.status || 'published', sortOrder: Number(legend.sortOrder || 1) });
  };

  const seedDefaultLegends = async () => {
    if (legendsRecords.length && !window.confirm('Add the eight default Pakhtoon legends to the current list?')) return;
    setBusy(true);
    try {
      const batch = writeBatch(db);
      defaultHeroLegends.forEach((legend) => {
        const ref = doc(collections.legends);
        batch.set(ref, { ...legend, createdAt: serverTimestamp(), createdBy: user?.email || '', updatedAt: serverTimestamp(), updatedBy: user?.email || '' });
      });
      await batch.commit();
    } catch (error) { setDataError(error?.message || 'Unable to initialize Pakhtoon Legends.'); }
    finally { setBusy(false); }
  };

  const saveLegend = async (event) => {
    event.preventDefault();
    if (!editingLegend || !legendDraft.name.trim() || !legendDraft.honor.trim()) return;
    setBusy(true);
    try {
      const payload = { ...legendDraft, name: legendDraft.name.trim(), category: legendDraft.category.trim(), honor: legendDraft.honor.trim(), legacy: legendDraft.legacy.trim(), sortOrder: Number(legendDraft.sortOrder) || 1, updatedAt: serverTimestamp(), updatedBy: user?.email || '' };
      if (editingLegend.id) await updateDoc(doc(collections.legends, editingLegend.id), payload);
      else await addDoc(collections.legends, { ...payload, createdAt: serverTimestamp(), createdBy: user?.email || '' });
      setEditingLegend(null);
    } catch (error) { setDataError(error?.message || 'Unable to save this legend.'); }
    finally { setBusy(false); }
  };

  const updateLegendStatus = async (legend, status) => {
    setBusy(true);
    try { await updateDoc(doc(collections.legends, legend.id), { status, updatedAt: serverTimestamp(), updatedBy: user?.email || '' }); }
    catch (error) { setDataError(error?.message || 'Unable to update this legend.'); }
    finally { setBusy(false); }
  };

  const deleteLegend = async (legend) => {
    if (!window.confirm(`Permanently delete ${legend.name || 'this legend'} from the hero category?`)) return;
    setBusy(true);
    try { await deleteDoc(doc(collections.legends, legend.id)); }
    catch (error) { setDataError(error?.message || 'Unable to delete this legend.'); }
    finally { setBusy(false); }
  };

  const saveEvent = async (event) => {
    event.preventDefault();
    if (!eventDraft.title.trim()) return;
    setBusy(true);
    const payload = { ...eventDraft, title: eventDraft.title.trim(), date: eventDraft.date || '', venue: eventDraft.venue.trim(), description: eventDraft.description.trim(), updatedAt: serverTimestamp(), updatedBy: user?.email || '' };
    try {
      if (editingEvent) await updateDoc(doc(db, 'events', editingEvent.id), payload);
      else await addDoc(collections.events, { ...payload, createdAt: serverTimestamp(), createdBy: user?.email || '' });
      setEditingEvent(null);
      setEventDraft({ title: '', date: '', venue: '', description: '', image: '', status: 'published', successful: false });
    } catch (error) { setDataError(error?.message || 'Unable to save the event.'); }
    finally { setBusy(false); }
  };

  const deleteEvent = async (record) => {
    if (!window.confirm(`Remove the event “${record.title}”?`)) return;
    setBusy(true);
    try { await deleteDoc(doc(db, 'events', record.id)); }
    catch (error) { setDataError(error?.message || 'Unable to remove the event.'); }
    finally { setBusy(false); }
  };

  const startNewProfile = (type) => {
    setEditingProfile({ type, id: null });
    setProfileDraft(type === 'cabinet'
      ? { name: '', position: '', photo: '' }
      : { title: '', summary: '', image: '', status: 'draft' });
  };

  const startProfileEdit = (type, record) => {
    setEditingProfile({ type, ...record });
    setProfileDraft(type === 'cabinet'
      ? { name: record.name || '', position: record.position || '', photo: record.photo || '' }
      : { title: record.title || '', summary: record.summary || record.content || '', image: record.image || record.photo || '', status: record.status || 'published' });
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!editingProfile) return;
    setBusy(true);
    try {
      const collectionName = editingProfile.type === 'cabinet' ? 'cabinet' : 'news';
      const payload = { ...profileDraft, updatedAt: serverTimestamp(), updatedBy: user?.email || '' };
      if (editingProfile.id) await updateDoc(doc(db, collectionName, editingProfile.id), payload);
      else await addDoc(collections[collectionName], { ...payload, createdAt: serverTimestamp(), createdBy: user?.email || '' });
      setEditingProfile(null);
    } catch (error) { setDataError(error?.message || 'Unable to save this record.'); }
    finally { setBusy(false); }
  };

  const deleteProfile = async (type, record) => {
    const displayName = type === 'cabinet' ? record.name : record.title;
    if (!window.confirm(`Permanently remove “${displayName}”?`)) return;
    setBusy(true);
    try { await deleteDoc(doc(db, type === 'cabinet' ? 'cabinet' : 'news', record.id)); }
    catch (error) { setDataError(error?.message || 'Unable to remove this record.'); }
    finally { setBusy(false); }
  };

  const handleImageUpload = async (event, setter, draft) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const image = await readImage(file);
      setter({ ...draft, image });
    } catch (error) { setDataError(error?.message || 'Unable to read the selected image.'); }
  };

  const operationalCollection = (type) => collections[type];

  const operationalName = (type, record) => {
    if (type === 'donations') return record.donor || record.name || 'Donation record';
    if (type === 'incidents') return record.name || record.title || 'Incident report';
    if (type === 'elections') return record.title || 'Election';
    return record.name || record.title || 'Sponsored ad';
  };

  const updateOperationalStatus = async (type, record, status) => {
    setBusy(true);
    try {
      await updateDoc(doc(operationalCollection(type), record.id), { status, updatedAt: serverTimestamp(), updatedBy: user?.email || '' });
    } catch (error) { setDataError(error?.message || `Unable to update ${type} status.`); }
    finally { setBusy(false); }
  };

  const deleteOperationalRecord = async (type, record) => {
    if (!window.confirm(`Permanently delete ${operationalName(type, record)}? This cannot be undone.`)) return;
    setBusy(true);
    try { await deleteDoc(doc(operationalCollection(type), record.id)); }
    catch (error) { setDataError(error?.message || `Unable to delete ${type} record.`); }
    finally { setBusy(false); }
  };

  const updateCommentStatus = async (comment, status) => {
    setBusy(true);
    try { await updateDoc(doc(collections.comments, comment.id), { status, moderatedAt: serverTimestamp(), moderatedBy: user?.email || '' }); }
    catch (error) { setDataError(error?.message || 'Unable to moderate this comment.'); }
    finally { setBusy(false); }
  };

  const deleteComment = async (comment) => {
    if (!window.confirm(`Permanently delete this comment from ${comment.name || 'member'}?`)) return;
    setBusy(true);
    try { await deleteDoc(doc(collections.comments, comment.id)); }
    catch (error) { setDataError(error?.message || 'Unable to delete this comment.'); }
    finally { setBusy(false); }
  };

  const startNewOperational = (type) => {
    setEditingRecord({ type, id: null });
    setRecordDraft({
      title: '', name: '', donor: '', phone: '', amount: '', date: '', venue: '', description: '', status: type === 'elections' ? 'open' : type === 'ads' ? 'draft' : 'pending', link: '', image: '',
    });
  };

  const startOperationalEdit = (type, record) => {
    setEditingRecord({ type, ...record });
    setRecordDraft({
      title: record.title || '',
      name: record.name || '',
      donor: record.donor || '',
      phone: record.phone || '',
      amount: record.amount ?? '',
      date: asDate(record.date),
      venue: record.venue || '',
      description: record.description || record.content || record.caption || '',
      status: record.status || (type === 'elections' ? 'open' : type === 'ads' ? 'published' : 'pending'),
      link: record.link || '',
      image: record.image || record.photo || '',
    });
  };

  const saveOperationalRecord = async (event) => {
    event.preventDefault();
    if (!editingRecord) return;
    setBusy(true);
    try {
      const type = editingRecord.type;
      const payload = {
        ...recordDraft,
        amount: recordDraft.amount === '' ? 0 : Number(recordDraft.amount),
        updatedAt: serverTimestamp(),
        updatedBy: user?.email || '',
      };
      if (editingRecord.id) await updateDoc(doc(operationalCollection(type), editingRecord.id), payload);
      else await addDoc(operationalCollection(type), { ...payload, createdAt: serverTimestamp(), createdBy: user?.email || '' });
      setEditingRecord(null);
    } catch (error) { setDataError(error?.message || `Unable to save ${editingRecord.type} record.`); }
    finally { setBusy(false); }
  };

  if (!authReady) return <div className="flex min-h-screen items-center justify-center bg-[#f4f7f6] pt-20"><LoaderCircle className="animate-spin text-gold" size={26} /></div>;

  if (!authorised) {
    return <div className="min-h-screen bg-[#f4f7f6] pt-20"><main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center px-4 py-12 sm:px-6"><section className="w-full overflow-hidden rounded-3xl border border-white/10 bg-forest-dark text-white shadow-2xl"><div className="border-b border-white/10 bg-gradient-to-r from-forest-dark to-[#0c5042] px-7 py-8"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold text-forest-dark"><ShieldCheck size={26} /></div><p className="text-xs font-bold uppercase tracking-[.22em] text-gold">Protected workspace</p><h1 className="mt-3 font-serif text-3xl font-bold">OPC Administrator Portal</h1><p className="mt-3 text-sm leading-6 text-white/70">Membership data, profile photos, and events are protected. Sign in with an authorised Google account to continue.</p></div><div className="px-7 py-7">{authError && <div className="mb-5 flex gap-3 rounded-xl border border-red-300/25 bg-red-500/10 px-4 py-3 text-sm text-red-100"><AlertTriangle size={17} /><span>{authError}</span></div>}<button type="button" onClick={handleSignIn} disabled={signingIn} className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-gold px-5 py-3.5 font-bold text-forest-dark disabled:opacity-70">{signingIn ? <LoaderCircle className="animate-spin" size={19} /> : <LogIn size={19} />}{signingIn ? 'Signing in securely…' : 'Sign in with Google'}</button><p className="mt-5 text-center text-xs leading-5 text-white/45">Access is restricted to authorised OPC administrators. Member records are not made public.</p></div></section></main></div>;
  }

  return (
    <div className="min-h-screen bg-[#f4f7f6] pt-20">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-2xl border border-white/10 bg-forest-dark text-white shadow-xl"><div className="flex flex-col gap-5 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-7"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold text-lg font-black text-forest-dark">OPC</div><div><p className="font-serif text-xl font-bold leading-none text-gold">Admin Portal</p><p className="mt-1 text-xs font-medium uppercase tracking-[.17em] text-white/55">Oman Pakhtoon Community</p></div></div><div className="order-3 -mx-5 border-t border-white/10 px-5 pt-4 lg:order-2 lg:mx-0 lg:flex-1 lg:border-0 lg:px-6 lg:pt-0"><label className="block lg:hidden"><span className="sr-only">Choose admin section</span><select value={activeTab} onChange={(event) => setActiveTab(event.target.value)} className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-3 text-sm font-semibold text-white outline-none focus:border-gold"><option className="text-gray-900" value="Overview">Overview</option>{TABS.filter(({ label }) => label !== 'Overview').map(({ label }) => <option className="text-gray-900" key={label} value={label}>{label}</option>)}</select><span className="mt-2 block text-xs text-white/50">Select a section to manage members, events, news, donations, incidents, elections, and ads.</span></label><nav className="hidden min-w-max gap-2 lg:flex">{TABS.map(({ label, icon: Icon }) => <button key={label} type="button" onClick={() => setActiveTab(label)} className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${activeTab === label ? 'bg-gold text-forest-dark' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}><Icon size={17} />{label}</button>)}</nav></div><div className="order-2 flex items-center gap-3 self-start lg:order-3 lg:self-auto"><span className="hidden max-w-48 truncate text-xs text-white/55 sm:inline">{user.email}</span><button type="button" onClick={handleSignOut} className="inline-flex items-center gap-2 rounded-lg border border-red-300/20 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-400/10"><LogOut size={16} />Logout</button></div></div></header>

        <main className="mt-7 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7 lg:p-9">
          {dataError && <div className="mb-7 flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><AlertTriangle size={17} /><span>{dataError}</span></div>}
          <AnimatePresence mode="wait"><motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: .2 }}>
            <div className="mb-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-gold">Administrator workspace</p><h1 className="mt-2 text-3xl font-bold text-gray-800">{activeTab}</h1></div>

            {activeTab === 'Overview' && <div className="grid grid-cols-1 gap-5 md:grid-cols-3"><Metric label="Approved Members" value={approvedMembers.length} help="Active and card-ready members" /><Metric label="Pending Approval" value={pendingMembers.length} help="Applications awaiting review" accent="orange" /><Metric label="Published Events" value={events.filter((event) => event.status === 'published').length} help="Visible community events" accent="green" /></div>}

            {activeTab === 'Members' && <section><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><input value={memberQuery} onChange={(event) => setMemberQuery(event.target.value)} placeholder="Search name, membership ID, phone or ID number" className="w-full max-w-xl rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20" /><div className="flex flex-wrap items-center gap-3"><p className="text-sm text-gray-500">{filteredMembers.length} records</p><button type="button" onClick={startNewMember} className="inline-flex items-center gap-1 rounded-lg bg-forest-dark px-3 py-2 text-xs font-bold text-gold"><Plus size={14} />New member</button><button type="button" disabled={busy || approvedMembers.length === 0} onClick={syncApprovedMemberCards} className="rounded-lg border border-gold/50 px-3 py-2 text-xs font-bold text-forest-dark hover:bg-gold/10 disabled:opacity-50">Sync approved cards</button></div></div><div className="overflow-hidden rounded-xl border border-gray-200"><div className="overflow-x-auto"><table className="w-full min-w-[890px] text-left"><thead className="bg-gray-50 text-sm text-gray-600"><tr><th className="px-5 py-4">Photo</th><th className="px-5 py-4">Member</th><th className="px-5 py-4">Membership ID</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Actions</th></tr></thead><tbody>{filteredMembers.map((member) => <tr key={member.id} className="border-t hover:bg-gray-50"><td className="px-5 py-3"><div className="h-10 w-10 overflow-hidden rounded-full bg-gray-100">{member.photo && <img src={member.photo} alt="" className="h-full w-full object-cover" />}</div></td><td className="px-5 py-3"><p className="font-bold text-gray-800">{member.name}</p><p className="text-xs text-gray-500">{member.phone || 'No phone saved'}</p>{member.status === 'approved' && <p className="text-xs font-mono text-forest-dark">PIN: {member.cardPin || deriveCardPin(member.phone) || 'Unavailable'}</p>}</td><td className="px-5 py-3 font-mono text-sm text-gray-600">{member.membershipId || 'PENDING'}</td><td className="px-5 py-3"><StatusPill value={member.status} /></td><td className="px-5 py-3"><div className="flex justify-end gap-2">{member.status === 'pending' && <><button type="button" disabled={busy} onClick={() => updateMemberStatus(member, 'approved')} className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-2 text-xs font-bold text-white"><CheckCircle2 size={14} />Approve</button><button type="button" disabled={busy} onClick={() => updateMemberStatus(member, 'rejected')} className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-2.5 py-2 text-xs font-bold text-white"><XCircle size={14} />Reject</button></>}<button type="button" onClick={() => startMemberEdit(member)} className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:border-gold hover:text-forest-dark"><Edit3 size={15} /></button><button type="button" onClick={() => deleteMember(member)} className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div></div></section>}

            {activeTab === 'Legends' && <section>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-gray-800">Pakhtoon Legends</h2><p className="mt-1 text-xs text-gray-500">Manage only the legends shown in the homepage hero carousel.</p></div><div className="flex flex-wrap items-center gap-3"><span className="text-sm text-gray-500">{legendsRecords.length} records</span><button type="button" disabled={busy} onClick={seedDefaultLegends} className="rounded-lg border border-gold/50 px-3 py-2 text-xs font-bold text-forest-dark hover:bg-gold/10 disabled:opacity-50">Initialize current legends</button><button type="button" disabled={busy} onClick={startNewLegend} className="inline-flex items-center gap-1 rounded-lg bg-forest-dark px-3 py-2 text-xs font-bold text-gold disabled:opacity-50"><Plus size={14} />Add legend</button></div></div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{legendsRecords.map((legend) => <article key={legend.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"><div className="h-44 bg-forest-dark/5">{legend.image && <img src={legend.image} alt={legend.name || ''} className="h-full w-full object-cover" />}</div><div className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-gray-800">{legend.name || 'Untitled legend'}</p><p className="mt-1 text-xs uppercase tracking-wide text-gold">{legend.category || 'Uncategorized'}</p></div><StatusPill value={legend.status || 'hidden'} /></div><p className="mt-3 text-sm font-semibold text-gray-700">{legend.honor || 'No honor line'}</p><p className="mt-2 line-clamp-3 text-sm text-gray-600">{legend.legacy || 'No legacy summary'}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => updateLegendStatus(legend, legend.status === 'published' ? 'hidden' : 'published')} className="rounded-lg border border-green-200 px-2.5 py-2 text-xs font-bold text-green-700 disabled:opacity-50">{legend.status === 'published' ? 'Hide from hero' : 'Publish to hero'}</button><button type="button" disabled={busy} onClick={() => startLegendEdit(legend)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-2 text-xs font-bold text-gray-700 disabled:opacity-50"><Edit3 size={14} />Edit</button><button type="button" disabled={busy} onClick={() => deleteLegend(legend)} className="inline-flex items-center gap-1 rounded-lg border border-red-100 px-2.5 py-2 text-xs font-bold text-red-600 disabled:opacity-50"><Trash2 size={14} />Delete</button></div></div></article>)}</div>
              {legendsRecords.length === 0 && <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">No database legends yet. The public hero is using the current built-in legends. Select “Initialize current legends” to make them editable here.</div>}
            </section>}

            {editingLegend && <Modal title={editingLegend.id ? 'Edit Pakhtoon legend' : 'Add Pakhtoon legend'} onClose={() => setEditingLegend(null)}><form onSubmit={saveLegend} className="grid gap-4 md:grid-cols-2"><Field label="Legend name" value={legendDraft.name} onChange={(value) => setLegendDraft({ ...legendDraft, name: value })} required /><Field label="Category" value={legendDraft.category} onChange={(value) => setLegendDraft({ ...legendDraft, category: value })} required /><Field label="Honor line" value={legendDraft.honor} onChange={(value) => setLegendDraft({ ...legendDraft, honor: value })} required /><Field label="Display order" type="number" value={legendDraft.sortOrder} onChange={(value) => setLegendDraft({ ...legendDraft, sortOrder: value })} /><TextAreaField label="Legacy summary" value={legendDraft.legacy} onChange={(value) => setLegendDraft({ ...legendDraft, legacy: value })} /><StatusField value={legendDraft.status} options={['published', 'hidden']} onChange={(value) => setLegendDraft({ ...legendDraft, status: value })} /><ImageField label="Legend image" value={legendDraft.image} onChange={(event) => handleImageUpload(event, setLegendDraft, legendDraft)} onClear={() => setLegendDraft({ ...legendDraft, image: '' })} /><button disabled={busy} className="md:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-forest-dark px-4 py-3 font-bold text-gold disabled:opacity-70"><Save size={17} />{editingLegend.id ? 'Save legend' : 'Add legend'}</button></form></Modal>}

            {activeTab === 'Events' && <section className="grid gap-8 xl:grid-cols-[360px_1fr]"><form onSubmit={saveEvent} className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-5"><div className="flex items-center justify-between"><h2 className="font-bold text-gray-800">{editingEvent ? 'Edit event' : 'Create event'}</h2>{editingEvent && <button type="button" onClick={() => { setEditingEvent(null); setEventDraft({ title: '', date: '', venue: '', description: '', image: '', status: 'published', successful: false }); }} className="text-sm font-bold text-gray-500">Cancel</button>}</div><Field label="Event title" value={eventDraft.title} onChange={(value) => setEventDraft({ ...eventDraft, title: value })} required /><Field label="Event date" type="date" value={eventDraft.date} onChange={(value) => setEventDraft({ ...eventDraft, date: value })} /><Field label="Venue" value={eventDraft.venue} onChange={(value) => setEventDraft({ ...eventDraft, venue: value })} /><div><div className="flex items-center justify-between gap-3"><label className="block text-sm font-semibold text-gray-700">Event summary</label>{eventDraft.description && <button type="button" onClick={() => setEventDraft({ ...eventDraft, description: '' })} className="text-xs font-bold text-red-600 hover:underline">Clear summary</button>}</div><textarea value={eventDraft.description} onChange={(event) => setEventDraft({ ...eventDraft, description: event.target.value })} rows="4" placeholder="Write the public event summary" className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-gold" /></div><ImageField label="Event image" value={eventDraft.image} onClear={() => setEventDraft({ ...eventDraft, image: '' })} onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; try { setEventDraft({ ...eventDraft, image: await readImage(file) }); } catch (error) { setDataError(error.message); } }} /><label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><input type="checkbox" checked={eventDraft.status === 'published'} onChange={(event) => setEventDraft({ ...eventDraft, status: event.target.checked ? 'published' : 'draft' })} /> Publish to public event section</label><label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><input type="checkbox" checked={Boolean(eventDraft.successful)} onChange={(event) => setEventDraft({ ...eventDraft, successful: event.target.checked })} /> Show in Successful Events</label><button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-forest-dark px-4 py-3 font-bold text-gold disabled:opacity-70"><Save size={17} />{editingEvent ? 'Save event' : 'Create event'}</button></form><div className="grid gap-4 md:grid-cols-2">{events.map((record) => <article key={record.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white"><div className="h-36 bg-forest-dark/5">{record.image && <img src={record.image} alt="" className="h-full w-full object-cover" />}</div><div className="p-5"><div className="flex items-start justify-between gap-3"><h3 className="font-bold text-gray-800">{record.title}</h3><StatusPill value={record.status} /></div><p className="mt-2 text-xs font-medium text-gray-500">{record.date || 'Date to be announced'} · {record.venue || 'Venue to be announced'}</p><p className="mt-3 line-clamp-3 text-sm text-gray-600">{record.description}</p><div className="mt-4 flex gap-2"><button type="button" onClick={() => { setEditingEvent(record); setEventDraft({ title: record.title || '', date: asDate(record.date), venue: record.venue || '', description: record.description || '', image: record.image || '', status: record.status || 'draft', successful: Boolean(record.successful) }); }} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700"><Edit3 size={14} />Edit</button><button type="button" onClick={() => deleteEvent(record)} className="inline-flex items-center gap-1 rounded-lg border border-red-100 px-3 py-2 text-xs font-bold text-red-600"><Trash2 size={14} />Remove</button></div></div></article>)}</div></section>}

            {activeTab === 'Cabinet' && <ProfileGrid label="Cabinet members" records={cabinet} type="cabinet" onEdit={startProfileEdit} onDelete={deleteProfile} onAdd={startNewProfile} />}
            {activeTab === 'News' && <ProfileGrid label="News posts" records={news} type="news" onEdit={startProfileEdit} onDelete={deleteProfile} onAdd={startNewProfile} />}
            {activeTab === 'Donations' && <OperationalSection label="Donation records" type="donations" records={donations} onEdit={startOperationalEdit} onDelete={deleteOperationalRecord} onStatus={updateOperationalStatus} onAdd={startNewOperational} />}
            {activeTab === 'Incidents' && <OperationalSection label="Incident records" type="incidents" records={incidents} onEdit={startOperationalEdit} onDelete={deleteOperationalRecord} onStatus={updateOperationalStatus} onAdd={startNewOperational} />}
            {activeTab === 'Elections' && <OperationalSection label="Election records" type="elections" records={elections} onEdit={startOperationalEdit} onDelete={deleteOperationalRecord} onStatus={updateOperationalStatus} onAdd={startNewOperational} />}
            {activeTab === 'Ads' && <OperationalSection label="Sponsored ads" type="ads" records={ads} onEdit={startOperationalEdit} onDelete={deleteOperationalRecord} onStatus={updateOperationalStatus} onAdd={startNewOperational} />}
            {activeTab === 'Comments' && <CommentsSection comments={comments} onStatus={updateCommentStatus} onDelete={deleteComment} />}
          </motion.div></AnimatePresence>
        </main>
      </div>

      {(editingMember || creatingMember) && <Modal title={creatingMember ? 'Add new member' : 'Edit member record'} onClose={() => { setCreatingMember(false); setEditingMember(null); }}><form onSubmit={saveMember} className="grid gap-4 md:grid-cols-2"><Field label="Full name" value={memberDraft.name} onChange={(value) => setMemberDraft({ ...memberDraft, name: value })} required /><Field label="Father's name" value={memberDraft.father} onChange={(value) => setMemberDraft({ ...memberDraft, father: value })} required /><Field label="Phone" value={memberDraft.phone} onChange={(value) => setMemberDraft({ ...memberDraft, phone: value })} required /><Field label="Oman ID card number" value={memberDraft.omanId} onChange={(value) => setMemberDraft({ ...memberDraft, omanId: value })} required /><Field label="Membership ID" value={memberDraft.membershipId} onChange={(value) => setMemberDraft({ ...memberDraft, membershipId: value.toUpperCase() })} /><Field label="Card access PIN (last 4 phone digits)" value={memberDraft.phone ? deriveCardPin(memberDraft.phone) : ''} onChange={() => {}} /><label className="block text-sm font-semibold text-gray-700">Status<select value={memberDraft.status} onChange={(event) => setMemberDraft({ ...memberDraft, status: event.target.value })} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2"><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label><Field label="Oman location" value={memberDraft.omanLocation} onChange={(value) => setMemberDraft({ ...memberDraft, omanLocation: value })} required /><Field label="District of origin" value={memberDraft.district} onChange={(value) => setMemberDraft({ ...memberDraft, district: value })} required /><Field label="Address" value={memberDraft.address} onChange={(value) => setMemberDraft({ ...memberDraft, address: value })} required /><div className="md:col-span-2"><ImageField label="Membership-card photo" value={memberDraft.photo} onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; try { setMemberDraft({ ...memberDraft, photo: await readImage(file) }); } catch (error) { setDataError(error.message); } }} /></div><button disabled={busy} className="md:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-forest-dark px-4 py-3 font-bold text-gold disabled:opacity-70"><Save size={17} />{creatingMember ? 'Create member' : 'Save member'}</button></form></Modal>}
      {editingRecord && <Modal title={`${editingRecord.id ? 'Edit' : 'New'} ${{ donations: 'donation', incidents: 'incident', elections: 'election', ads: 'advertisement' }[editingRecord.type]}`} onClose={() => setEditingRecord(null)}><form onSubmit={saveOperationalRecord} className="grid gap-4 md:grid-cols-2">
        {editingRecord.type === 'donations' && <><Field label="Donor name" value={recordDraft.donor} onChange={(value) => setRecordDraft({ ...recordDraft, donor: value })} required /><Field label="Phone" value={recordDraft.phone} onChange={(value) => setRecordDraft({ ...recordDraft, phone: value })} /><Field label="Amount (OMR)" type="number" value={recordDraft.amount} onChange={(value) => setRecordDraft({ ...recordDraft, amount: value })} required /><Field label="Date" type="date" value={recordDraft.date} onChange={(value) => setRecordDraft({ ...recordDraft, date: value })} /><TextAreaField label="Description" value={recordDraft.description} onChange={(value) => setRecordDraft({ ...recordDraft, description: value })} /><StatusField value={recordDraft.status} options={['pending', 'approved', 'rejected']} onChange={(value) => setRecordDraft({ ...recordDraft, status: value })} /></>}
        {editingRecord.type === 'incidents' && <><Field label="Reporter name" value={recordDraft.name} onChange={(value) => setRecordDraft({ ...recordDraft, name: value })} required /><Field label="Phone" value={recordDraft.phone} onChange={(value) => setRecordDraft({ ...recordDraft, phone: value })} /><Field label="Date" type="date" value={recordDraft.date} onChange={(value) => setRecordDraft({ ...recordDraft, date: value })} /><TextAreaField label="Incident description" value={recordDraft.description} onChange={(value) => setRecordDraft({ ...recordDraft, description: value })} required /><StatusField value={recordDraft.status} options={['pending', 'published', 'closed', 'rejected']} onChange={(value) => setRecordDraft({ ...recordDraft, status: value })} /></>}
        {editingRecord.type === 'elections' && <><Field label="Election title" value={recordDraft.title} onChange={(value) => setRecordDraft({ ...recordDraft, title: value })} required /><Field label="Date" type="date" value={recordDraft.date} onChange={(value) => setRecordDraft({ ...recordDraft, date: value })} /><TextAreaField label="Description" value={recordDraft.description} onChange={(value) => setRecordDraft({ ...recordDraft, description: value })} /><StatusField value={recordDraft.status} options={['open', 'closed']} onChange={(value) => setRecordDraft({ ...recordDraft, status: value })} /></>}
        {editingRecord.type === 'ads' && <><Field label="Ad title" value={recordDraft.title} onChange={(value) => setRecordDraft({ ...recordDraft, title: value })} required /><Field label="Destination link" value={recordDraft.link} onChange={(value) => setRecordDraft({ ...recordDraft, link: value })} /><TextAreaField label="Caption" value={recordDraft.description} onChange={(value) => setRecordDraft({ ...recordDraft, description: value })} /><ImageField label="Ad image" value={recordDraft.image} onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; try { setRecordDraft({ ...recordDraft, image: await readImage(file) }); } catch (error) { setDataError(error.message); } }} /><StatusField value={recordDraft.status} options={['draft', 'published', 'archived']} onChange={(value) => setRecordDraft({ ...recordDraft, status: value })} /></>}
        <button disabled={busy} className="md:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-forest-dark px-4 py-3 font-bold text-gold disabled:opacity-70"><Save size={17} />{editingRecord.id ? 'Save record' : 'Create record'}</button>
      </form></Modal>}
      {editingProfile && <Modal title={`${editingProfile.id ? 'Edit' : 'Add'} ${editingProfile.type === 'cabinet' ? 'cabinet member' : 'news post'}`} onClose={() => setEditingProfile(null)}><form onSubmit={saveProfile} className="space-y-4">{editingProfile.type === 'cabinet' ? <><Field label="Name" value={profileDraft.name} onChange={(value) => setProfileDraft({ ...profileDraft, name: value })} required /><Field label="Position" value={profileDraft.position} onChange={(value) => setProfileDraft({ ...profileDraft, position: value })} required /><ImageField label="Profile photo" value={profileDraft.photo} onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; try { setProfileDraft({ ...profileDraft, photo: await readImage(file) }); } catch (error) { setDataError(error.message); } }} /></> : <><Field label="Title" value={profileDraft.title} onChange={(value) => setProfileDraft({ ...profileDraft, title: value })} required /><label className="block text-sm font-semibold text-gray-700">Summary<textarea value={profileDraft.summary} onChange={(event) => setProfileDraft({ ...profileDraft, summary: event.target.value })} rows="5" className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2" /></label><ImageField label="News image" value={profileDraft.image} onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; try { setProfileDraft({ ...profileDraft, image: await readImage(file) }); } catch (error) { setDataError(error.message); } }} /><label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><input type="checkbox" checked={profileDraft.status === 'published'} onChange={(event) => setProfileDraft({ ...profileDraft, status: event.target.checked ? 'published' : 'draft' })} /> Published</label></>}<button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-forest-dark px-4 py-3 font-bold text-gold disabled:opacity-70"><Save size={17} />{editingProfile.id ? 'Save changes' : 'Create record'}</button></form></Modal>}
    </div>
  );
}

function CommentsSection({ comments, onStatus, onDelete }) {
  return <section><div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold text-gray-800">Member comments</h2><p className="mt-1 text-sm text-gray-500">Approve respectful comments, hide bad comments, or delete them permanently.</p></div><span className="text-sm text-gray-500">{comments.length} records</span></div><div className="grid gap-4">{comments.length === 0 && <div className="rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500">No member comments yet.</div>}{comments.map((comment) => <article key={comment.id} className="rounded-xl border border-gray-200 p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-bold text-gray-800">{comment.name || 'Anonymous member'}</p><p className="mt-1 text-sm text-gray-600">{comment.text}</p><p className="mt-2 text-xs text-gray-400">Event ID: {comment.eventId || '—'}</p></div><StatusPill value={comment.status || 'pending'} /></div><div className="mt-4 flex flex-wrap gap-2">{comment.status !== 'approved' && <button type="button" onClick={() => onStatus(comment, 'approved')} className="rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white">Approve</button>}{comment.status !== 'hidden' && <button type="button" onClick={() => onStatus(comment, 'hidden')} className="rounded-lg border border-orange-200 px-3 py-2 text-xs font-bold text-orange-700">Hide</button>}<button type="button" onClick={() => onDelete(comment)} className="rounded-lg border border-red-100 px-3 py-2 text-xs font-bold text-red-600">Delete</button></div></article>)}</div></section>;
}

function OperationalSection({ label, type, records, onEdit, onDelete, onStatus, onAdd }) {
  const statusActions = type === 'donations'
    ? ['approved', 'rejected']
    : type === 'incidents'
      ? ['published', 'closed', 'rejected']
      : type === 'elections'
        ? ['open', 'closed']
        : ['published', 'archived'];

  return <section>
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-gray-800">{label}</h2><p className="mt-1 text-xs text-gray-500">Create, edit, approve, reject, publish, archive, or delete records.</p></div><div className="flex items-center gap-3"><span className="text-sm text-gray-500">{records.length} records</span><button type="button" onClick={() => onAdd(type)} className="inline-flex items-center gap-1 rounded-lg bg-forest-dark px-3 py-2 text-xs font-bold text-gold"><Plus size={14} />New record</button></div></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{records.map((record) => <article key={record.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3"><div><p className="font-bold text-gray-800">{record.title || record.name || record.donor || 'Untitled record'}</p><p className="mt-1 text-xs text-gray-500">{record.date || record.venue || record.phone || record.type || 'No summary'}</p></div><StatusPill value={record.status || 'pending'} /></div>
      <p className="mt-3 line-clamp-3 text-sm text-gray-600">{record.description || record.content || record.caption || (record.amount !== undefined ? `Amount: OMR ${record.amount}` : 'No description')}</p>
      <div className="mt-4 flex flex-wrap gap-2">{statusActions.filter((status) => status !== record.status).map((status) => <button key={status} type="button" disabled={false} onClick={() => onStatus(type, record, status)} className="rounded-lg border border-green-200 px-2.5 py-2 text-xs font-bold text-green-700 hover:bg-green-50">{status === 'approved' ? 'Approve' : status === 'rejected' ? 'Reject' : status === 'published' ? 'Publish' : status === 'archived' ? 'Archive' : status === 'open' ? 'Open' : 'Close'}</button>)}<button type="button" onClick={() => onEdit(type, record)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-2 text-xs font-bold text-gray-700"><Edit3 size={14} />Edit</button><button type="button" onClick={() => onDelete(type, record)} className="inline-flex items-center gap-1 rounded-lg border border-red-100 px-2.5 py-2 text-xs font-bold text-red-600"><Trash2 size={14} />Delete</button></div>
    </article>)}</div>
  </section>;
}

function Metric({ label, value, help, accent = 'forest' }) {
  const color = accent === 'orange' ? 'text-orange-500' : accent === 'green' ? 'text-emerald-600' : 'text-forest-dark';
  return <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-white to-[#f5faf8] p-6 shadow-sm"><p className="mb-2 text-sm font-bold text-gray-500">{label}</p><p className={`font-mono text-4xl font-bold ${color}`}>{value}</p><p className="mt-2 text-xs text-gray-400">{help}</p></div>;
}

function Field({ label, value, onChange, required = false, type = 'text' }) {
  return <label className="block text-sm font-semibold text-gray-700">{label}<input required={required} type={type} value={value || ''} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20" /></label>;
}

function TextAreaField({ label, value, onChange, required = false }) {
  return <label className="block text-sm font-semibold text-gray-700 md:col-span-2">{label}<textarea required={required} value={value || ''} onChange={(event) => onChange(event.target.value)} rows="4" className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20" /></label>;
}

function StatusField({ value, options, onChange }) {
  return <label className="block text-sm font-semibold text-gray-700">Status<select value={value || options[0]} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20">{options.map((option) => <option key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</option>)}</select></label>;
}

function Modal({ title, onClose, children }) {
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 p-4"><div className="mx-auto my-8 max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-6 flex items-center justify-between gap-4"><h2 className="text-xl font-bold text-gray-800">{title}</h2><button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><XCircle size={20} /></button></div>{children}</div></div>;
}

function ProfileGrid({ label, records, type, onEdit, onDelete, onAdd }) {
  return <section><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 className="font-bold text-gray-800">{label}</h2><div className="flex items-center gap-3"><span className="text-sm text-gray-500">{records.length} records</span><button type="button" onClick={() => onAdd(type)} className="inline-flex items-center gap-1 rounded-lg bg-forest-dark px-3 py-2 text-xs font-bold text-gold"><Plus size={14} />New {type === 'cabinet' ? 'cabinet member' : 'post'}</button></div></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{records.map((record) => { const isCabinet = type === 'cabinet'; const image = isCabinet ? record.photo : (record.image || record.photo); const title = isCabinet ? record.name : record.title; const subtitle = isCabinet ? record.position : (record.status || 'draft'); return <article key={record.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white"><div className="h-32 bg-forest-dark/5">{image && <img src={image} alt="" className="h-full w-full object-cover" />}</div><div className="p-5"><p className="font-bold text-gray-800">{title || 'Untitled record'}</p><p className="mt-1 text-sm text-gray-500">{subtitle}</p><div className="mt-4 flex gap-2"><button type="button" onClick={() => onEdit(type, record)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700"><Edit3 size={14} />Edit</button><button type="button" onClick={() => onDelete(type, record)} className="inline-flex items-center gap-1 rounded-lg border border-red-100 px-3 py-2 text-xs font-bold text-red-600"><Trash2 size={14} />Delete</button></div></div></article>; })}</div></section>;
}
