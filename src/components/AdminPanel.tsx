import React, { useState } from 'react';
import { User, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { 
  collection, doc, addDoc, updateDoc, deleteDoc, setDoc, runTransaction, arrayUnion, Timestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { 
  Member, Donation, CabinetMember, NewsAnnouncement, IncidentReport, EmbassySetting, Election, SponsoredAd 
} from '../types';
import { 
  Users, Award, DollarSign, AlertTriangle, Newspaper, Globe, Vote, Disc, LogOut, CheckCircle2, XCircle, Plus, Trash2, Edit2, Share2, FileSpreadsheet 
} from 'lucide-react';

interface AdminPanelProps {
  user: User | null;
  members: Member[];
  cabinet: CabinetMember[];
  donations: Donation[];
  incidents: IncidentReport[];
  news: NewsAnnouncement[];
  embassy: EmbassySetting;
  elections: Election[];
  ads: SponsoredAd[];
  onViewDocuments: (member: Member) => void;
}

// Helper to convert base64
const getBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export default function AdminPanel({
  user, members, cabinet, donations, incidents, news, embassy, elections, ads, onViewDocuments
}: AdminPanelProps) {
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'cabinet' | 'donations' | 'incidents' | 'news' | 'embassy' | 'elections' | 'ads'>('overview');

  // --- Form States for Admin Add/Edits ---
  
  // Cabinet form state
  const [cId, setCId] = useState('');
  const [cName, setCName] = useState('');
  const [cPosition, setCPosition] = useState('President');
  const [cPhone, setCPhone] = useState('');
  const [cPhoto, setCPhoto] = useState('');

  // Donation form state
  const [dDonor, setDDonor] = useState('');
  const [dAmount, setDAmount] = useState('');
  const [dDate, setDDate] = useState(new Date().toISOString().slice(0, 10));
  const [dMethod, setDMethod] = useState<'Bank Transfer' | 'Cash' | 'Mobile Wallet'>('Bank Transfer');
  const [dNote, setDNote] = useState('');

  // News form state
  const [nId, setNId] = useState('');
  const [nTitle, setNTitle] = useState('');
  const [nContent, setNContent] = useState('');
  const [nImage, setNImage] = useState('');

  // Embassy form state
  const [embAddress, setEmbAddress] = useState(embassy.address || '');
  const [embPhone, setEmbPhone] = useState(embassy.phone || '');
  const [embEmergency, setEmbEmergency] = useState(embassy.emergency || '');
  const [embEmail, setEmbEmail] = useState(embassy.email || '');
  const [embHours, setEmbHours] = useState(embassy.hours || '');
  const [embWebsite, setEmbWebsite] = useState(embassy.website || '');
  const [embSuccess, setEmbSuccess] = useState(false);

  // Election form state
  const [elTitle, setElTitle] = useState('');
  const [newCandidates, setNewCandidates] = useState<{ [electionId: string]: string }>({});

  // Ads form state
  const [adId, setAdId] = useState('');
  const [adName, setAdName] = useState('');
  const [adPhone, setAdPhone] = useState('');
  const [adCaption, setAdCaption] = useState('');
  const [adLink, setAdLink] = useState('');
  const [adAmount, setAdAmount] = useState('');
  const [adMethod, setAdMethod] = useState('Bank Transfer');
  const [adStart, setAdStart] = useState('');
  const [adEnd, setAdEnd] = useState('');
  const [adImage, setAdImage] = useState('');

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
    } catch (err: any) {
      setLoginError(err.message || 'Incorrect credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Google Admin Sign-In
  const handleGoogleAdminSignIn = async () => {
    setLoginError('');
    setLoginLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const email = result.user?.email;
      if (email === 'abuhamdan144@gmail.com' || email === 'admin@opc.org') {
        // Logged in successfully as designated system administrator
      } else {
        // Not a designated administrator, sign out from Auth instance
        await signOut(auth);
        setLoginError('Your Google account is not configured as an administrator. Please sign in with an authorized administrator account like abuhamdan144@gmail.com.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Google Sign-In failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => signOut(auth);

  // --- ACTIONS ---

  // Approved Member Sequential ID Generation
  const handleApproveMember = async (member: Member) => {
    if (!member.id) return;
    try {
      const counterRef = doc(db, 'settings', 'counters');
      let newId = '';
      
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(counterRef);
        const last = snap.exists() ? (snap.data().lastMemberNumber || 0) : 0;
        const next = last + 1;
        newId = `OPC-OM-${new Date().getFullYear()}-${String(next).padStart(4, '0')}`;
        transaction.set(counterRef, { lastMemberNumber: next }, { merge: true });
      });

      await updateDoc(doc(db, 'members', member.id), {
        status: 'approved',
        membershipId: newId,
        approvedAt: Timestamp.now()
      });

      alert(`Member approved! Issued Membership ID: ${newId}`);
    } catch (err: any) {
      alert('Error approving member: ' + err.message);
    }
  };

  const handleRejectMember = async (id: string) => {
    if (!confirm('Reject this application?')) return;
    try {
      await updateDoc(doc(db, 'members', id), { status: 'rejected' });
    } catch (err: any) {
      alert('Error rejecting: ' + err.message);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Permanently delete this application?')) return;
    try {
      await deleteDoc(doc(db, 'members', id));
    } catch (err: any) {
      alert('Error deleting: ' + err.message);
    }
  };

  // Cabinet Actions
  const handleCabinetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: Partial<CabinetMember> = {
      name: cName.trim(),
      position: cPosition,
      phone: cPhone.trim(),
    };
    if (cPhoto) data.photo = cPhoto;

    try {
      if (cId) {
        await updateDoc(doc(db, 'cabinet', cId), data);
        alert('Cabinet member updated.');
      } else {
        await addDoc(collection(db, 'cabinet'), data);
        alert('Cabinet member added.');
      }
      resetCabinetForm();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEditCabinet = (cm: CabinetMember) => {
    setCId(cm.id || '');
    setCName(cm.name);
    setCPosition(cm.position);
    setCPhone(cm.phone || '');
    setCPhoto(cm.photo || '');
  };

  const handleDeleteCabinet = async (id: string) => {
    if (!confirm('Remove cabinet member?')) return;
    await deleteDoc(doc(db, 'cabinet', id));
  };

  const resetCabinetForm = () => {
    setCId('');
    setCName('');
    setCPosition('President');
    setCPhone('');
    setCPhoto('');
  };

  const handleCabinetPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await getBase64(file);
      setCPhoto(base64);
    }
  };

  // Donation Actions
  const handleDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dDonor || !dAmount) return;
    try {
      await addDoc(collection(db, 'donations'), {
        donor: dDonor.trim(),
        amount: parseFloat(dAmount),
        date: dDate,
        method: dMethod,
        note: dNote.trim(),
        createdAt: Timestamp.now()
      });
      alert('Donation registered successfully.');
      setDDonor('');
      setDAmount('');
      setDNote('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteDonation = async (id: string) => {
    if (!confirm('Delete donation record?')) return;
    await deleteDoc(doc(db, 'donations', id));
  };

  // Incident reviews
  const handleIncidentStatus = async (id: string, status: 'published' | 'closed') => {
    await updateDoc(doc(db, 'incidents', id), { status });
  };

  const handleDeleteIncident = async (id: string) => {
    if (!confirm('Delete incident report?')) return;
    await deleteDoc(doc(db, 'incidents', id));
  };

  // News Actions
  const handleNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      title: nTitle.trim(),
      content: nContent.trim(),
    };
    if (nImage) data.image = nImage;

    try {
      if (nId) {
        await updateDoc(doc(db, 'news', nId), data);
        alert('Announcements updated.');
      } else {
        data.createdAt = Timestamp.now();
        await addDoc(collection(db, 'news'), data);
        alert('Announcements published successfully.');
      }
      resetNewsForm();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEditNews = (n: NewsAnnouncement) => {
    setNId(n.id || '');
    setNTitle(n.title);
    setNContent(n.content);
    setNImage(n.image || '');
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm('Delete news post?')) return;
    await deleteDoc(doc(db, 'news', id));
  };

  const resetNewsForm = () => {
    setNId('');
    setNTitle('');
    setNContent('');
    setNImage('');
  };

  const handleNewsImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await getBase64(file);
      setNImage(base64);
    }
  };

  // Save embassy settings
  const handleEmbassySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmbSuccess(false);
    try {
      await setDoc(doc(db, 'settings', 'embassy'), {
        address: embAddress.trim(),
        phone: embPhone.trim(),
        emergency: embEmergency.trim(),
        email: embEmail.trim(),
        hours: embHours.trim(),
        website: embWebsite.trim()
      }, { merge: true });
      setEmbSuccess(true);
      setTimeout(() => setEmbSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Elections
  const handleCreateElection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!elTitle.trim()) return;
    try {
      await addDoc(collection(db, 'elections'), {
        title: elTitle.trim(),
        status: 'open',
        candidates: [],
        createdAt: Timestamp.now()
      });
      setElTitle('');
      alert('Election category created!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddCandidate = async (electionId: string) => {
    const name = newCandidates[electionId] || '';
    if (!name.trim()) return;
    try {
      const candidateId = Math.random().toString(36).substr(2, 9);
      await updateDoc(doc(db, 'elections', electionId), {
        candidates: arrayUnion({ id: candidateId, name: name.trim(), votes: 0 })
      });
      setNewCandidates(prev => ({ ...prev, [electionId]: '' }));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleElectionStatus = async (el: Election) => {
    if (!el.id) return;
    await updateDoc(doc(db, 'elections', el.id), {
      status: el.status === 'open' ? 'closed' : 'open'
    });
  };

  const handleResetElectionVotes = async (el: Election) => {
    if (!el.id || !confirm('Reset all votes list for this election?')) return;
    const resetList = el.candidates.map(c => ({ ...c, votes: 0 }));
    await updateDoc(doc(db, 'elections', el.id), { candidates: resetList });
  };

  const handleDeleteElection = async (id: string | undefined) => {
    if (!id || !confirm('Delete election permanently?')) return;
    await deleteDoc(doc(db, 'elections', id));
  };

  // Sponsored Ads
  const handleAdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adName || !adLink || !adAmount) return;
    const data: any = {
      name: adName.trim(),
      phone: adPhone.trim(),
      caption: adCaption.trim(),
      link: adLink.trim(),
      amount: parseFloat(adAmount),
      method: adMethod,
      start: adStart,
      end: adEnd,
    };
    if (adImage) data.image = adImage;
    if (!adId && !adImage) {
      alert('Please upload a visual slider image banner.');
      return;
    }

    try {
      if (adId) {
        await updateDoc(doc(db, 'ads', adId), data);
        alert('Ad contract updated.');
      } else {
        data.createdAt = Timestamp.now();
        await addDoc(collection(db, 'ads'), data);
        alert('Ad posted successfully.');
      }
      resetAdForm();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEditAd = (ad: SponsoredAd) => {
    setAdId(ad.id || '');
    setAdName(ad.name);
    setAdPhone(ad.phone || '');
    setAdCaption(ad.caption || '');
    setAdLink(ad.link);
    setAdAmount(ad.amount.toString());
    setAdMethod(ad.method);
    setAdStart(ad.start);
    setAdEnd(ad.end);
    setAdImage(ad.image);
  };

  const handleDeleteAd = async (id: string) => {
    if (!confirm('Remove ad contract?')) return;
    await deleteDoc(doc(db, 'ads', id));
  };

  const resetAdForm = () => {
    setAdId('');
    setAdName('');
    setAdPhone('');
    setAdCaption('');
    setAdLink('');
    setAdAmount('');
    setAdMethod('Bank Transfer');
    setAdStart('');
    setAdEnd('');
    setAdImage('');
  };

  const handleAdImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await getBase64(file);
      setAdImage(base64);
    }
  };

  // --- CSV EXPORTS ---
  const downloadCSVFile = (rows: any[], columns: { key: string, label: string }[], filename: string) => {
    let csv = columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',') + '\n';
    rows.forEach(r => {
      csv += columns.map(c => {
        const val = r[c.key] == null ? '' : String(r[c.key]);
        return `"${val.replace(/"/g, '""')}"`;
      }).join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportMembers = () => {
    downloadCSVFile(members.map(m => ({
      ...m,
      createdAt: m.createdAt?.seconds ? new Date(m.createdAt.seconds * 1000).toLocaleDateString() : ''
    })), [
      { key: 'membershipId', label: 'Membership ID' },
      { key: 'name', label: 'Name' },
      { key: 'father', label: 'Father' },
      { key: 'cnic', label: 'CNIC/Passport' },
      { key: 'district', label: 'District' },
      { key: 'phone', label: 'Phone' },
      { key: 'whatsapp', label: 'WhatsApp' },
      { key: 'address', label: 'Address' },
      { key: 'occupation', label: 'Occupation' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Applied on' }
    ], 'opc-membership-log.csv');
  };

  const exportDonations = () => {
    downloadCSVFile(donations, [
      { key: 'date', label: 'Date' },
      { key: 'donor', label: 'Donor Name' },
      { key: 'amount', label: 'Amount (OMR)' },
      { key: 'method', label: 'Method' },
      { key: 'note', label: 'Memo/Notes' }
    ], 'opc-donations-log.csv');
  };

  const exportIncidents = () => {
    downloadCSVFile(incidents, [
      { key: 'type', label: 'Type' },
      { key: 'name', label: 'Affected Individual' },
      { key: 'description', label: 'Incident details' },
      { key: 'date', label: 'Incident date' },
      { key: 'contact', label: 'Submitter Phone' },
      { key: 'status', label: 'Status' }
    ], 'opc-welfare-reports.csv');
  };

  const totalDonations = donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const totalAdRevenue = ads.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const pendingMembers = members.filter(m => m.status === 'pending');
  const approvedMembers = members.filter(m => m.status === 'approved');

  // --- LOGIN PANEL VIEW ---
  if (!user) {
    return (
      <div className="max-w-md mx-auto pt-10 pb-20 px-4">
        <div className="bg-white rounded-xl shadow-xl p-8 border border-slate-200">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-serif font-bold text-emerald-950">Admin Sign In</h2>
            <p className="text-sm text-slate-500 mt-1">
              Verify credentials to access the OPC operational directory.
            </p>
          </div>

          {loginError && (
            <div className="bg-red-50 text-red-700 text-xs p-4 rounded-lg mb-4 font-medium border border-red-200 space-y-2">
              <p className="font-bold">{loginError}</p>
              {loginError.includes('operation-not-allowed') && (
                <div className="mt-2 text-slate-700 font-normal leading-relaxed border-t border-red-200 pt-2 space-y-2">
                  <p className="font-semibold text-red-850">How to fix this in 30 seconds:</p>
                  <p>
                    On newly created Firebase projects, the <strong>Email/Password</strong> sign-in provider is disabled by default.
                  </p>
                  <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600">
                    <li>
                      Go to the {" "}
                      <a 
                        href={`https://console.firebase.google.com/project/${auth.app.options.projectId}/authentication/providers`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-emerald-800 hover:text-emerald-950 font-semibold underline underline-offset-2"
                      >
                        Firebase Console Auth Providers Settings
                      </a>
                    </li>
                    <li>Click the <strong>Add new provider</strong> button.</li>
                    <li>Select <strong>Email/Password</strong>, toggle <strong>Enable</strong>, and click <strong>Save</strong>.</li>
                    <li>Come back to this page and click <strong>Secure Authorization</strong> again!</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                Admin Email Address
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus:outline-emerald-800 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus:outline-emerald-800 text-slate-800"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-emerald-900 hover:bg-emerald-950 text-white font-bold py-3 px-4 rounded-md transition cursor-pointer disabled:opacity-50"
            >
              {loginLoading ? 'Authenticating...' : 'Secure Authorization'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-medium">Or Use 1-Click Access</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleAdminSignIn}
            disabled={loginLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-md border border-slate-300 shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.66 0 3.2.57 4.4 1.71l3.24-3.24C17.6 1.7 14.97 1 12 1 7.37 1 3.4 3.67 1.45 7.55l3.81 2.95C6.18 7.33 8.87 5.04 12 5.04z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.12 2.73-2.38 3.58l3.71 2.88c2.16-1.99 3.4-4.91 3.4-8.61z"
              />
              <path
                fill="#FBBC05"
                d="M5.26 14.75a7.16 7.16 0 0 1 0-4.5l-3.81-2.95a11.96 11.96 0 0 0 0 10.4l3.81-2.95z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.71-2.88c-1.03.69-2.35 1.1-4.25 1.1-3.13 0-5.82-2.29-6.74-5.46L1.45 15.8C3.4 19.67 7.37 23 12 23z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>

          <p className="text-[11px] text-slate-400 mt-5 text-center leading-relaxed">
            System credentials:<br />
            Email: <strong className="text-emerald-800">admin@opc.org</strong><br />
            Password: <strong className="text-emerald-800">admin123</strong>
          </p>
        </div>
      </div>
    );
  }

  // --- DASHBOARD PANEL VIEW ---
  return (
    <div className="container mx-auto px-4 py-8 fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5 mb-6">
        <div>
          <h2 className="text-3xl font-serif text-emerald-950 font-extrabold">Executive Dashboard</h2>
          <p className="text-xs text-slate-400">
            Current Operator Profile: <span className="font-semibold text-emerald-800">{user.email}</span>
          </p>
        </div>
        <button 
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold px-4 py-2.5 rounded-md text-xs transition duration-150 cursor-pointer"
        >
          <LogOut size={14} /> End Session
        </button>
      </div>

      {/* ADMIN TABS SCROLL CONTAINER */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-thin scrollbar-thumb-amber-300">
        {[
          { id: 'overview', label: 'Overview', icon: Users },
          { id: 'members', label: 'Member Queue', icon: Users },
          { id: 'cabinet', label: 'Cabinet', icon: Award },
          { id: 'donations', label: 'Donation Ledgers', icon: DollarSign },
          { id: 'incidents', label: 'Welfare Claims', icon: AlertTriangle },
          { id: 'news', label: 'Announcements', icon: Newspaper },
          { id: 'embassy', label: 'Muscat Consulate', icon: LocationIcon },
          { id: 'elections', label: 'Elections & Polls', icon: Vote },
          { id: 'ads', label: 'Sponsor Ads', icon: Disc },
        ].map((tab) => {
          const Icon = tab.icon === LocationIcon ? Globe : tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer border transition-all ${
                isSelected 
                  ? 'bg-emerald-900 border-emerald-950 text-amber-300 shadow-md transform -translate-y-px' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* DASHBOARD CONTENT SWITCHER */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 text-left">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-serif text-emerald-950 mb-3">Community Snapshot</h3>
            
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Approved Members</p>
                <p className="text-3xl font-serif font-bold text-emerald-900 mt-1">{approvedMembers.length}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Applications</p>
                <p className="text-3xl font-serif font-bold text-amber-600 mt-1">{pendingMembers.length}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Donations Accrued</p>
                <p className="text-3xl font-serif font-bold text-emerald-900 mt-1">OMR {totalDonations.toFixed(3)}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Welfare Logs</p>
                <p className="text-3xl font-serif font-bold text-blue-900 mt-1">
                  {incidents.filter(i => i.status !== 'closed').length}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ad Sponsor Billing</p>
                <p className="text-3xl font-serif font-bold text-teal-900 mt-1">OMR {totalAdRevenue.toFixed(3)}</p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-lg">
              <h4 className="font-bold text-sm mb-1">Operational Directives &amp; Help</h4>
              <ul className="list-disc pl-5 mt-2 space-y-1.5 text-xs">
                <li>Under <strong>Member Queue</strong>, approve pending diaspora applications. Approved entries automatically query a transaction sequence database counter to issue serialized IDs.</li>
                <li>Adding cabinet officers updates the frontpage board dynamically, complete with photo scaling.</li>
                <li>Add donations to keep live totals updated instantly.</li>
                <li>Generate and download dynamic Membership ID cards and printable physical Certificates.</li>
              </ul>
            </div>
          </div>
        )}

        {/* MEMBERS QUEUE TAB */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="text-xl font-bold font-serif text-emerald-950">Membership Operations</h3>
              <button 
                onClick={exportMembers}
                className="inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-3.5 py-2 rounded-md text-xs transition duration-150 cursor-pointer"
              >
                <FileSpreadsheet size={14} /> Export Member Registry CSV
              </button>
            </div>

            {/* PENDING APPLICATIONS */}
            <div>
              <span className="text-sm font-bold text-slate-700 block border-b pb-1.5 mb-3">
                Awaiting Review ({pendingMembers.length})
              </span>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-emerald-950 text-amber-300">
                    <tr>
                      <th className="p-3">Applicant details</th>
                      <th className="p-3">CNIC/Passport</th>
                      <th className="p-3">Tribe/District</th>
                      <th className="p-3">Oman Address</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {pendingMembers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">No pending applications found.</td>
                      </tr>
                    ) : (
                      pendingMembers.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-emerald-950">
                            {m.name} <p className="text-[10px] font-normal text-slate-400">f: {m.father}</p>
                          </td>
                          <td className="p-3 font-mono">{m.cnic}</td>
                          <td className="p-3">{m.district}</td>
                          <td className="p-3">{m.address}</td>
                          <td className="p-3">{m.phone}</td>
                          <td className="p-3 text-right space-x-1 whitespace-nowrap">
                            <button 
                              onClick={() => handleApproveMember(m)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded text-xs font-bold transition cursor-pointer"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleRejectMember(m.id!)}
                              className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1.5 rounded text-xs font-bold transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ALL MEMBERS TABLE */}
            <div>
              <span className="text-sm font-bold text-slate-700 block border-b pb-1.5 mb-3">
                All Registry Records ({members.length})
              </span>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                    <tr>
                      <th className="p-3">ID / Reference</th>
                      <th className="p-3">Full Name</th>
                      <th className="p-3">District</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {members.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">No member records.</td>
                      </tr>
                    ) : (
                      members.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/40">
                          <td className="p-3 font-mono font-bold text-emerald-900">{m.membershipId || '-'}</td>
                          <td className="p-3 font-semibold">{m.name}</td>
                          <td className="p-3">{m.district}</td>
                          <td className="p-3">{m.phone}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              m.status === 'approved' ? 'bg-green-100 text-green-800' :
                              m.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {m.status}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-1 whitespace-nowrap">
                            {m.status === 'approved' && (
                              <button 
                                onClick={() => onViewDocuments(m)}
                                className="bg-amber-500 hover:bg-amber-600 text-emerald-950 px-2.5 py-1.5 rounded text-xs font-bold transition cursor-pointer"
                              >
                                View ID/Cert
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteMember(m.id!)}
                              className="text-red-600 hover:text-red-800 p-1.5 rounded hover:bg-red-50 inline-block align-middle transition cursor-pointer"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CABINET TAB */}
        {activeTab === 'cabinet' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-serif text-emerald-950">Community Cabinet Editor</h3>
            
            <form onSubmit={handleCabinetSubmit} className="max-w-2xl bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-4">
              <h4 className="font-bold text-sm text-emerald-900 border-b pb-1.5">
                {cId ? 'Modify Officer Details' : 'Register New Executive Cabinet Officer'}
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Official Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={cName} 
                    onChange={e => setCName(e.target.value)}
                    className="w-full px-3 py-2 border rounded bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Cabinet Position *</label>
                  <select 
                    value={cPosition} 
                    onChange={e => setCPosition(e.target.value)}
                    className="w-full px-3 py-2 border rounded bg-white text-sm"
                  >
                    {['President', 'Senior Vice President', 'Vice President', 'General Secretary', 'Joint Secretary', 'Finance Secretary', 'Information Secretary', 'Welfare Secretary', 'Cultural Secretary', 'Member - Executive Committee', 'Other'].map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 font-sans">Contact Number</label>
                  <input 
                    type="tel" 
                    value={cPhone} 
                    onChange={e => setCPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Profile Image</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleCabinetPhotoChange}
                    className="w-full text-xs"
                  />
                </div>
              </div>

              {cPhoto && (
                <div>
                  <p className="text-[10px] text-slate-400 mb-1">Image Preview:</p>
                  <img src={cPhoto} alt="Cabinet uploader result" className="w-16 h-16 rounded-full object-cover border border-slate-300" />
                </div>
              )}

              <div className="flex gap-2">
                <button type="submit" className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2 rounded text-xs cursor-pointer">
                  {cId ? 'Save Member' : 'Publish Member'}
                </button>
                {cId && (
                  <button type="button" onClick={resetCabinetForm} className="bg-slate-300 hover:bg-slate-450 text-slate-800 font-bold px-4 py-2 rounded text-xs cursor-pointer">
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3">Officer</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cabinet.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400">No officers registered.</td>
                    </tr>
                  ) : (
                    cabinet.map(cm => (
                      <tr key={cm.id}>
                        <td className="p-3 flex items-center gap-3">
                          {cm.photo ? (
                            <img src={cm.photo} alt={cm.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-200 border flex items-center justify-center font-bold font-serif text-slate-500">
                              {cm.name[0]}
                            </div>
                          )}
                          <span className="font-semibold">{cm.name}</span>
                        </td>
                        <td className="p-3 text-emerald-850 font-bold">{cm.position}</td>
                        <td className="p-3 font-mono">{cm.phone || '-'}</td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          <button onClick={() => handleEditCabinet(cm)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition cursor-pointer">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDeleteCabinet(cm.id!)} className="text-red-600 hover:bg-red-50 p-1.5 rounded transition cursor-pointer">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DONATIONS TAB */}
        {activeTab === 'donations' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="text-xl font-bold font-serif text-emerald-950">Welfare Fund donations</h3>
              <button 
                onClick={exportDonations}
                className="inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-3.5 py-2 rounded-md text-xs transition duration-150 cursor-pointer"
              >
                <FileSpreadsheet size={14} /> Export donations XML/CSV
              </button>
            </div>

            <form onSubmit={handleDonationSubmit} className="max-w-2xl bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-4">
              <h4 className="font-bold text-sm text-emerald-900 border-b pb-1.5">Record Physical Donation Receipt</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Donor Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={dDonor} 
                    onChange={e => setDDonor(e.target.value)}
                    placeholder="e.g. Ikram Bacha"
                    className="w-full px-3 py-2 border rounded bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Donated Amount (OMR) *</label>
                  <input 
                    type="number" 
                    step="0.001" 
                    min="0"
                    required 
                    value={dAmount} 
                    onChange={e => setDAmount(e.target.value)}
                    placeholder="0.000"
                    className="w-full px-3 py-2 border rounded bg-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 font-sans">Payment Date</label>
                  <input 
                    type="date" 
                    required 
                    value={dDate} 
                    onChange={e => setDDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Method</label>
                  <select 
                    value={dMethod} 
                    onChange={e => setDMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded bg-white text-sm"
                  >
                    <option value="Bank Transfer">Bank Transfer (BankDhofar)</option>
                    <option value="Cash">Cash Handover</option>
                    <option value="Mobile Wallet">Mobile Wallet / Pay</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes / Purpose</label>
                <input 
                  type="text" 
                  value={dNote} 
                  onChange={e => setDNote(e.target.value)}
                  placeholder="e.g. Swat Flood Welfare Support"
                  className="w-full px-3 py-2 border rounded bg-white text-sm"
                />
              </div>

              <button type="submit" className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2 rounded text-xs cursor-pointer">
                Save Ledger Record
              </button>
            </form>

            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3">Reference Date</th>
                    <th className="p-3">Donor Name</th>
                    <th className="p-3">Amount (OMR)</th>
                    <th className="p-3">Gateway Method</th>
                    <th className="p-3">Memo Notes</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-600">
                  {donations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">No registered donations log.</td>
                    </tr>
                  ) : (
                    donations.map(d => (
                      <tr key={d.id} className="hover:bg-slate-50/40">
                        <td className="p-3 font-mono">{d.date}</td>
                        <td className="p-3 font-semibold text-emerald-950">{d.donor}</td>
                        <td className="p-3 text-emerald-900 font-bold font-mono">OMR {Number(d.amount).toFixed(3)}</td>
                        <td className="p-3">{d.method}</td>
                        <td className="p-3 italic text-slate-400">{d.note || '-'}</td>
                        <td className="p-3 text-right">
                          <button onClick={() => handleDeleteDonation(d.id!)} className="text-red-600 p-1 rounded hover:bg-red-50 cursor-pointer">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* WELFARE CLAIMS TAB */}
        {activeTab === 'incidents' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="text-xl font-bold font-serif text-emerald-950">Welfare Incidence Review Log</h3>
              <button 
                onClick={exportIncidents}
                className="inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-3.5 py-2 rounded-md text-xs transition duration-150 cursor-pointer"
              >
                <FileSpreadsheet size={14} /> Export Incidence Claims CSV
              </button>
            </div>

            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3">Type</th>
                    <th className="p-3">Affected Claimant</th>
                    <th className="p-3">Description Context</th>
                    <th className="p-3">Incident Date</th>
                    <th className="p-3">Reporter Phone</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Review Options</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-600">
                  {incidents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">No listed incidents.</td>
                    </tr>
                  ) : (
                    incidents.map(i => (
                      <tr key={i.id} className="hover:bg-slate-50/40">
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            i.type === 'death' ? 'bg-red-100 text-red-800' :
                            i.type === 'injury' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {i.type}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-emerald-950">{i.name}</td>
                        <td className="p-3 max-w-[2400px] whitespace-normal text-slate-500 line-clamp-2">{i.description}</td>
                        <td className="p-3 font-mono">{i.date}</td>
                        <td className="p-3 font-mono">{i.contact}</td>
                        <td className="p-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            i.status === 'published' ? 'bg-green-100 text-green-800' :
                            i.status === 'closed' ? 'bg-slate-150 text-slate-600' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {i.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          {i.status !== 'published' && (
                            <button 
                              onClick={() => handleIncidentStatus(i.id!, 'published')} 
                              className="bg-emerald-600 text-white px-2 py-1 rounded text-[10px] font-semibold cursor-pointer hover:bg-emerald-700"
                            >
                              Approve / Publish
                            </button>
                          )}
                          {i.status !== 'closed' && (
                            <button 
                              onClick={() => handleIncidentStatus(i.id!, 'closed')} 
                              className="bg-slate-200 text-slate-700 px-2 py-1 rounded text-[10px] font-semibold cursor-pointer hover:bg-slate-350"
                            >
                              Archive / Close
                            </button>
                          )}
                          <button onClick={() => handleDeleteIncident(i.id!)} className="text-red-600 p-1 hover:bg-red-50 rounded inline-block align-middle cursor-pointer">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ANNOUNCEMENTS TAB */}
        {activeTab === 'news' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-serif text-emerald-950 font-sans">Official Bulletins Editor</h3>
            
            <form onSubmit={handleNewsSubmit} className="max-w-2xl bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-4">
              <h4 className="font-bold text-sm text-emerald-900 border-b pb-1.5">
                {nId ? 'Edit Announcement Post' : 'Post New Community Bulletin Announcement'}
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Headline Bulletin Title *</label>
                <input 
                  type="text" 
                  required 
                  value={nTitle} 
                  onChange={e => setNTitle(e.target.value)}
                  placeholder="e.g. OPC Annual general Assembly Muscat scheduled for November"
                  className="w-full px-3 py-2 border rounded bg-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 font-sans">Detailed Bulletin Information *</label>
                <textarea 
                  required 
                  rows={4}
                  value={nContent} 
                  onChange={e => setNContent(e.target.value)}
                  placeholder="Insert announcement paragraphs here..."
                  className="w-full px-3 py-2 border rounded bg-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-650 mb-1">Attached Display Image (optional)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleNewsImageChange}
                  className="w-full text-xs"
                />
              </div>

              {nImage && (
                <div>
                  <p className="text-[10px] text-slate-400 mb-1">Bulletin Banner Preview:</p>
                  <img src={nImage} alt="News upload result" className="h-20 w-36 object-cover border border-slate-300 rounded" />
                </div>
              )}

              <div className="flex gap-2">
                <button type="submit" className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2 rounded text-xs cursor-pointer">
                  {nId ? 'Save Changes' : 'Publish Bulletin'}
                </button>
                {nId && (
                  <button type="button" onClick={resetNewsForm} className="bg-slate-300 text-slate-705 font-bold px-4 py-2 rounded text-xs cursor-pointer">
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3">Title Bulletin Headline</th>
                    <th className="p-3">Cover Image</th>
                    <th className="p-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-600">
                  {news.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-slate-400">No news published yet.</td>
                    </tr>
                  ) : (
                    news.map(n => (
                      <tr key={n.id}>
                        <td className="p-3 font-semibold text-emerald-950">{n.title}</td>
                        <td className="p-3">
                          {n.image ? <img src={n.image} alt={n.title} className="w-12 h-8 object-cover rounded shadow-xs" /> : '-'}
                        </td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          <button onClick={() => handleEditNews(n)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition cursor-pointer">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDeleteNews(n.id!)} className="text-red-600 hover:bg-red-50 p-1.5 rounded transition cursor-pointer">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EMBASSY TAB */}
        {activeTab === 'embassy' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-serif text-emerald-950 font-sans">Pakistan Embassy Muscat Details</h3>
            
            <form onSubmit={handleEmbassySubmit} className="max-w-xl bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-4">
              <h4 className="font-bold text-sm text-emerald-900 border-b pb-1.5">Consulate &amp; Helpline Settings</h4>
              
              {embSuccess && (
                <div className="bg-green-50 text-green-800 text-xs p-3 rounded font-semibold border border-green-200">
                  Saved successfully.
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 font-sans">Physical Address</label>
                <textarea 
                  rows={2}
                  value={embAddress} 
                  onChange={e => setEmbAddress(e.target.value)}
                  className="w-full px-3 py-2 border rounded bg-white text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1 font-sans">Main Office Phone</label>
                  <input 
                    type="text" 
                    value={embPhone} 
                    onChange={e => setEmbPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1 font-sans">Consular Emergency Helpline</label>
                  <input 
                    type="text" 
                    value={embEmergency} 
                    onChange={e => setEmbEmergency(e.target.value)}
                    className="w-full px-3 py-2 border rounded bg-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1">Official Email</label>
                  <input 
                    type="text" 
                    value={embEmail} 
                    onChange={e => setEmbEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1 font-mono text-[10px]">Office Hours</label>
                  <input 
                    type="text" 
                    value={embHours} 
                    onChange={e => setEmbHours(e.target.value)}
                    className="w-full px-3 py-2 border rounded bg-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-650 mb-1">Consular Website Link</label>
                <input 
                  type="text" 
                  value={embWebsite} 
                  onChange={e => setEmbWebsite(e.target.value)}
                  className="w-full px-3 py-2 border rounded bg-white text-sm"
                />
              </div>

              <button type="submit" className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold p-2.5 rounded text-xs cursor-pointer">
                Save Embassy Settings
              </button>
            </form>
          </div>
        )}

        {/* ELECTIONS TAB */}
        {activeTab === 'elections' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-serif text-emerald-950 font-sans">Community Election Panel</h3>
            
            <form onSubmit={handleCreateElection} className="max-w-xl bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-4">
              <h4 className="font-bold text-sm text-emerald-900 border-b pb-1.5">Generate New Election Cycle Category</h4>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 font-sans">Election Title Position *</label>
                <input 
                  type="text" 
                  required 
                  value={elTitle} 
                  onChange={e => setElTitle(e.target.value)}
                  placeholder="e.g. Cabinet President Elections 2026-2028"
                  className="w-full px-3 py-2 border rounded bg-white text-sm"
                />
              </div>
              <button type="submit" className="bg-emerald-800 hover:bg-emerald-990 text-white font-bold px-4 py-2 rounded text-xs cursor-pointer">
                Generate Election
              </button>
            </form>

            <div className="space-y-4">
              {elections.length === 0 ? (
                <div className="p-6 bg-slate-50 border rounded-lg text-center text-slate-400">No active elections logged.</div>
              ) : (
                elections.map((el) => {
                  const sortedCandidates = [...(el.candidates || [])].sort((a, b) => b.votes - a.votes);
                  const totalVotes = el.candidates.reduce((sum, c) => sum + (Number(c.votes) || 0), 0);

                  return (
                    <div key={el.id} className="p-5 border border-slate-200 rounded-lg bg-slate-50/55 space-y-4 shadow-xs">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-2">
                        <div>
                          <h4 className="font-bold text-emerald-950 text-base">{el.title}</h4>
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider mt-1 ${
                            el.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'
                          }`}>
                            Status: {el.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap">
                          <button 
                            onClick={() => handleToggleElectionStatus(el)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-2.5 py-1.5 rounded cursor-pointer transition"
                          >
                            {el.status === 'open' ? 'Close Voting' : 'Open Voting'}
                          </button>
                          <button 
                            onClick={() => handleResetElectionVotes(el)}
                            className="bg-slate-200 hover:bg-slate-300 text-red-650 font-bold px-2.5 py-1.5 rounded cursor-pointer transition animate-pulse"
                          >
                            Reset Votes
                          </button>
                          <button 
                            onClick={() => handleDeleteElection(el.id)}
                            className="text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* CANDIDATES TABLE FOR THIS ELECTION */}
                      <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600">
                            <tr>
                              <th className="p-2.5 font-bold">Candidate Name</th>
                              <th className="p-2.5 font-bold">Votes Accrued</th>
                              <th className="p-2.5 font-bold">Current Percentage</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y text-slate-700">
                            {sortedCandidates.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="p-4 text-center text-slate-400">No registered contestants.</td>
                              </tr>
                            ) : (
                              sortedCandidates.map(c => {
                                const pct = totalVotes > 0 ? ((c.votes / totalVotes) * 105).toFixed(0) : '0';
                                return (
                                  <tr key={c.id}>
                                    <td className="p-2.5 font-semibold text-emerald-950">{c.name}</td>
                                    <td className="p-2.5 font-bold font-mono text-emerald-900">{c.votes} votes</td>
                                    <td className="p-2.5 font-semibold font-sans">{pct}%</td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* ADD NEW CANDIDATE INPUT */}
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Contestant candidate name" 
                          value={newCandidates[el.id!] || ''}
                          onChange={e => setNewCandidates(prev => ({ ...prev, [el.id!]: e.target.value }))}
                          className="flex-1 px-3 py-1.5 border rounded bg-white text-xs text-left"
                        />
                        <button 
                          onClick={() => handleAddCandidate(el.id!)}
                          className="bg-emerald-900 text-white font-bold px-3.5 py-1.5 rounded text-xs cursor-pointer hover:bg-emerald-950"
                        >
                          Add Contestant
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ADS / BILLBOARD TAB */}
        {activeTab === 'ads' && (
          <div className="space-y-6 animate-pulse">
            <h3 className="text-xl font-bold font-serif text-emerald-950">Commercial Billboard Sponsor Directory</h3>
            
            <form onSubmit={handleAdSubmit} className="max-w-2xl bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-4">
              <h4 className="font-bold text-sm text-emerald-900 border-b pb-1.5">
                {adId ? 'Edit Sponsor Campaign' : 'Post Sponsored Commercial Campaign'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Advertiser/Business Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={adName} 
                    onChange={e => setAdName(e.target.value)}
                    className="w-full px-3 py-2 border rounded bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1">Link Destination *</label>
                  <input 
                    type="url" 
                    required 
                    value={adLink} 
                    onChange={e => setAdLink(e.target.value)}
                    placeholder="https://wa.me/..."
                    className="w-full px-3 py-2 border rounded bg-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1">Contract Amount paid (OMR) *</label>
                  <input 
                    type="number" 
                    step="0.001"
                    min="0"
                    required 
                    value={adAmount} 
                    onChange={e => setAdAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-605 mb-1">Campaign Tagline</label>
                  <input 
                    type="text" 
                    value={adCaption} 
                    onChange={e => setAdCaption(e.target.value)}
                    placeholder="e.g. Special Discount for OPC Card holders"
                    className="w-full px-3 py-2 border rounded bg-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Campaign Start Date *</label>
                  <input 
                    type="date" 
                    required 
                    value={adStart} 
                    onChange={e => setAdStart(e.target.value)}
                    className="w-full px-3 py-2 border rounded bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 font-sans">Campaign Expiry Date *</label>
                  <input 
                    type="date" 
                    required 
                    value={adEnd} 
                    onChange={e => setAdEnd(e.target.value)}
                    className="w-full px-3 py-2 border rounded bg-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Upload wide banner Image (e.g. 1200x400) *</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAdImageChange}
                  className="w-full text-xs"
                />
              </div>

              {adImage && (
                <div>
                  <p className="text-[10px] text-slate-400 mb-1">Banner Image Preview:</p>
                  <img src={adImage} alt="Ad sponsor upload result" className="h-16 w-48 object-cover border rounded border-slate-300" />
                </div>
              )}

              <div className="flex gap-2">
                <button type="submit" className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2 rounded text-xs cursor-pointer">
                  {adId ? 'Save Campaign' : 'Publish Ad Campaign'}
                </button>
                {adId && (
                  <button type="button" onClick={resetAdForm} className="bg-slate-300 text-slate-705 font-bold px-4 py-2 rounded text-xs cursor-pointer">
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3">Banner Asset</th>
                    <th className="p-3 font-sans">Sponsor</th>
                    <th className="p-3 font-sans">Budget Paid</th>
                    <th className="p-3">Schedule</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-600">
                  {ads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">No commercial contracts.</td>
                    </tr>
                  ) : (
                    ads.map(ad => (
                      <tr key={ad.id} className="hover:bg-slate-50/45">
                        <td className="p-3">
                          <img src={ad.image} alt={ad.name} className="h-8 w-20 object-cover border rounded shadow-xs" />
                        </td>
                        <td className="p-3 font-semibold text-emerald-950">{ad.name}</td>
                        <td className="p-3 font-bold text-emerald-900">{Number(ad.amount).toFixed(3)} OMR</td>
                        <td className="p-3 font-mono">{ad.start} to {ad.end}</td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          <button onClick={() => handleEditAd(ad)} className="text-blue-600 p-1.5 rounded hover:bg-blue-50 transition cursor-pointer">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDeleteAd(ad.id!)} className="text-red-700 p-1.5 rounded hover:bg-red-50 transition cursor-pointer">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Dummy constant to prevent undefined compiler crashes since Globe serves inside standard packages
const LocationIcon = Globe;
