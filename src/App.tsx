import React, { useState, useEffect } from 'react';
import { 
  collection, onSnapshot, addDoc, query, orderBy, Timestamp, doc, runTransaction, getDoc, setDoc, where 
} from 'firebase/firestore';
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from './firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
import { 
  Member, Donation, CabinetMember, CabinetMeeting, NewsAnnouncement, IncidentReport, EmbassySetting, Election, SponsoredAd 
} from './types';

// Importing sub-components
import SponsoredBillboard from './components/SponsoredBillboard';
import DocumentModal from './components/DocumentModal';
import AdminPanel from './components/AdminPanel';
import AIAssistant from './components/AIAssistant';
import CountdownTimer from './components/CountdownTimer';
import CabinetPanel from './components/CabinetPanel';

import { 
  Phone, Mail, Calendar, MapPin, Shield, Menu, X, Landmark, FileText, Vote, PlusCircle, HelpCircle, UserCheck, MessageSquare, Search, UserPlus, CreditCard, Award, CheckCircle 
} from 'lucide-react';

// Help helper for base64 image scaling
const getBase64Image = (file: File, maxSize: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize; }
        } else {
          if (h > maxSize) { w = Math.round(w * maxSize / h); h = maxSize; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No canvas context');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = reader.result as string;
    };
    reader.onerror = error => reject(error);
  });
};

const CABINET_POSITION_ORDER = [
  'chairman',
  'deputy chairman',
  'president',
  'co-president',
  'senior vice president',
  'vice president',
  'general secretary',
  'joint secretary',
  'finance secretary',
  'information secretary',
  'welfare secretary',
  'cultural secretary',
  'building secretary',
  'chief organizer',
  'member - executive committee',
  'other'
];

const getPositionPriority = (pos: string): number => {
  const cleanPos = (pos || '').trim().toLowerCase();
  const idx = CABINET_POSITION_ORDER.indexOf(cleanPos);
  if (idx !== -1) return idx;
  if (cleanPos.includes('chairman')) return 0;
  if (cleanPos.includes('president')) return 3;
  if (cleanPos.includes('secretary')) return 8;
  if (cleanPos.includes('organizer')) return 13;
  if (cleanPos.includes('member') || cleanPos.includes('committee')) return 14;
  return CABINET_POSITION_ORDER.length;
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'register' | 'cabinet' | 'elections' | 'report' | 'chat' | 'admin'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- Realtime DB Collections State ---
  const [members, setMembers] = useState<Member[]>([]);
  const [cabinet, setCabinet] = useState<CabinetMember[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [news, setNews] = useState<NewsAnnouncement[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [embassy, setEmbassy] = useState<EmbassySetting>({});
  const [elections, setElections] = useState<Election[]>([]);
  const [ads, setAds] = useState<SponsoredAd[]>([]);
  const [meetings, setMeetings] = useState<CabinetMeeting[]>([]);

  // Auth Users
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<User | null>(null);

  // Active Doc Generation
  const [activeDocMember, setActiveDocMember] = useState<Member | null>(null);
  const [docModalOpen, setDocModalOpen] = useState(false);

  // --- Form submission parameters ---
  const [rName, setRName] = useState('');
  const [rFather, setRFather] = useState('');
  const [rCnic, setRCnic] = useState('');
  const [rDistrict, setRDistrict] = useState('');
  const [rPhone, setRPhone] = useState('');
  const [rWhatsapp, setRWhatsapp] = useState('');
  const [rAddress, setRAddress] = useState('');
  const [rOccupation, setROccupation] = useState('');
  const [rEmergency, setREmergency] = useState('');
  const [rPhoto, setRPhoto] = useState('');
  const [rFeeAmount, setRFeeAmount] = useState('5');
  const [rPayMethod, setRPayMethod] = useState('Bank Transfer');
  const [rPayRef, setRPayRef] = useState('');
  const [rSuccess, setRSuccess] = useState(false);
  const [rLoading, setRLoading] = useState(false);
  const [rEmail, setREmail] = useState('');
  const [registerTab, setRegisterTab] = useState<'submit' | 'lookup'>('submit');
  const [lookupValue, setLookupValue] = useState('');
  const [lookupResult, setLookupResult] = useState<Member | null>(null);
  const [lookupAttempted, setLookupAttempted] = useState(false);

  // Submitting incidents
  const [iType, setIType] = useState<'death' | 'injury' | 'loss'>('death');
  const [iName, setIName] = useState('');
  const [iDesc, setIDesc] = useState('');
  const [iDate, setIDate] = useState('');
  const [iContact, setIContact] = useState('');
  const [iSuccess, setISuccess] = useState(false);
  const [iLoading, setILoading] = useState(false);

  // Tracking devices election votes local
  const [userVotedElections, setUserVotedElections] = useState<{ [electionId: string]: boolean }>({});

  // Google Sign-In & Sign-Out Helpers
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Save authenticated user record to Firestore /users/{uid} as requested:
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          displayName: user.displayName || '',
          email: user.email || '',
          photoURL: user.photoURL || '',
          lastLogin: Timestamp.now()
        }, { merge: true });
      } catch (fErr) {
        handleFirestoreError(fErr, OperationType.WRITE, `users/${user.uid}`);
      }
      
      alert(`As-salamu alaykum, ${user.displayName || 'Brother'}! You are now securely signed in.`);
    } catch (err: any) {
      console.error("Google Authenticating error: ", err);
      if (err.message?.includes('popup-blocked')) {
        alert("Sign-In popup was blocked by your browser. Please enable popups or load this applet in a new tab.");
      } else {
        alert("Google Authentication failed: " + err.message);
      }
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      alert("You have signed out successfully.");
    } catch (err: any) {
      alert("Sign out failed: " + err.message);
    }
  };

  // Auto-bootstrap default administrator account if it doesn't already exist
  useEffect(() => {
    const bootstrapRegisterAdmin = async () => {
      for (const email of ['admin@opc.org', 'admin@opc.com']) {
        try {
          await createUserWithEmailAndPassword(auth, email, 'admin123');
          console.log(`Successfully bootstrapped admin account: ${email}`);
        } catch (err: any) {
          if (err.code === 'auth/email-already-in-use') {
            console.log(`Admin account ${email} already exists in authentication registry.`);
          } else {
            console.error(`Error bootstrapping admin account ${email}: `, err);
          }
        }
      }
    };
    bootstrapRegisterAdmin();
  }, []);

  // Sync Google Sign-In email into registration form
  useEffect(() => {
    if (currentUser && currentUser.email) {
      setREmail(currentUser.email);
    }
  }, [currentUser]);

  // --- Snapshot synchronizations ---
  useEffect(() => {
    // Auth Listener
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && (user.email === 'abuhamdan144@gmail.com' || user.email === 'admin@opc.org' || user.email === 'admin@opc.com' || user.email === 'malakabbas47@gmail.com' || user.providerData.some(p => p.providerId === 'password'))) {
        setAdminUser(user);
      } else {
        setAdminUser(null);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // Decide which query to run for members and incidents based on adminUser
    const membersQuery = adminUser 
      ? query(collection(db, 'members'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'members'), where('status', '==', 'approved'));

    const incidentsQuery = adminUser
      ? query(collection(db, 'incidents'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'incidents'), where('status', '==', 'published'));

    // Members snapshot
    const unsubscribeMembers = onSnapshot(
      membersQuery,
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Member }));
        if (!adminUser) {
          list.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt as any) || 0;
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt as any) || 0;
            return timeB - timeA;
          });
        }
        setMembers(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'members');
      }
    );

    // Cabinet snapshot
    const unsubscribeCabinet = onSnapshot(
      collection(db, 'cabinet'),
      (snapshot) => {
        setCabinet(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as CabinetMember })));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'cabinet');
      }
    );

    // Donations snapshot
    const unsubscribeDonations = onSnapshot(
      query(collection(db, 'donations'), orderBy('date', 'desc')),
      (snapshot) => {
        setDonations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Donation })));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'donations');
      }
    );

    // News snapshot
    const unsubscribeNews = onSnapshot(
      query(collection(db, 'news'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as NewsAnnouncement })));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'news');
      }
    );

    // Incidents snapshot
    const unsubscribeIncidents = onSnapshot(
      incidentsQuery,
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as IncidentReport }));
        if (!adminUser) {
          list.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt as any) || 0;
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt as any) || 0;
            return timeB - timeA;
          });
        }
        setIncidents(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'incidents');
      }
    );

    // Embassy setting snapshot
    const unsubscribeEmbassy = onSnapshot(
      doc(db, 'settings', 'embassy'),
      (snapshot) => {
        if (snapshot.exists()) {
          setEmbassy(snapshot.data() as EmbassySetting);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'settings/embassy');
      }
    );

    // Elections snapshot
    const unsubscribeElections = onSnapshot(
      query(collection(db, 'elections'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setElections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Election })));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'elections');
      }
    );

    // Ads snapshot
    const unsubscribeAds = onSnapshot(
      query(collection(db, 'ads'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as SponsoredAd })));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'ads');
      }
    );

    // Cabinet Meetings snapshot
    const unsubscribeMeetings = onSnapshot(
      query(collection(db, 'cabinet_meetings'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setMeetings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as CabinetMeeting })));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'cabinet_meetings');
      }
    );

    return () => {
      unsubscribeMembers();
      unsubscribeCabinet();
      unsubscribeDonations();
      unsubscribeNews();
      unsubscribeIncidents();
      unsubscribeEmbassy();
      unsubscribeElections();
      unsubscribeAds();
      unsubscribeMeetings();
    };
  }, [adminUser]);

  // Automatic Dispatch Trigger for specific phone requested by user
  useEffect(() => {
    if (members.length > 0) {
      const match = members.find(m => {
        const ph = String(m.phone || '').replace(/[^\d]/g, '');
        const wa = String(m.whatsapp || '').replace(/[^\d]/g, '');
        return ph.includes('99111870') || wa.includes('99111870');
      });
      if (match && !match.isDispatched) {
        console.log("Automatically setting matching member to Dispatched:", match.name);
        setDoc(doc(db, 'members', match.id!), {
          isDispatched: true,
          dispatchedAt: Timestamp.now()
        }, { merge: true }).catch(err => {
          console.error("Auto-dispatch database write failed: ", err);
        });
      }
    }
  }, [members]);

  // Sync Voted Statuses
  useEffect(() => {
    const votes: { [key: string]: boolean } = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('voted_')) {
        votes[key.replace('voted_', '')] = true;
      }
    }
    setUserVotedElections(votes);
  }, []);

  // Member photo Base64 compression
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await getBase64Image(file, 240);
        setRPhoto(compressed);
      } catch (err) {
        alert('Error processing image scaling.');
      }
    }
  };

  // Submit Member Registration Form
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRSuccess(false);
    setRLoading(true);
    try {
      try {
        await addDoc(collection(db, 'members'), {
          name: rName.trim(),
          father: rFather.trim(),
          cnic: rCnic.trim(),
          district: rDistrict.trim(),
          phone: rPhone.trim(),
          whatsapp: rWhatsapp.trim(),
          address: rAddress.trim(),
          occupation: rOccupation.trim(),
          emergency: rEmergency.trim(),
          photo: rPhoto,
          status: 'pending',
          membershipId: '',
          feeAmount: Number(rFeeAmount) || 5,
          paymentMethod: rPayMethod,
          paymentReference: rPayRef.trim(),
          email: rEmail.trim(),
          createdAt: Timestamp.now()
        });
      } catch (fErr) {
        handleFirestoreError(fErr, OperationType.CREATE, 'members');
      }
      setRSuccess(true);
      // Reset
      setRName('');
      setRFather('');
      setRCnic('');
      setRDistrict('');
      setRPhone('');
      setRWhatsapp('');
      setRAddress('');
      setROccupation('');
      setREmergency('');
      setRPhoto('');
      setRFeeAmount('5');
      setRPayMethod('Bank Transfer');
      setRPayRef('');
      setREmail(currentUser?.email || '');
    } catch (err: any) {
      alert('Error registering: ' + err.message);
    } finally {
      setRLoading(false);
    }
  };

  // Find approved member by phone, whatsapp, cnic or email address
  const handleLookupMember = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupAttempted(true);
    
    const searchClean = lookupValue.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!searchClean) {
      setLookupResult(null);
      return;
    }
    
    const matched = members.find(m => {
      if (m.status !== 'approved') return false;
      
      const cnicClean = (m.cnic || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const phoneClean = (m.phone || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const whatsappClean = (m.whatsapp || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const emailClean = (m.email || '').toLowerCase().trim();
      const valClean = lookupValue.trim().toLowerCase();
      
      return cnicClean === searchClean || 
             phoneClean.includes(searchClean) || 
             searchClean.includes(phoneClean) ||
             (whatsappClean && (whatsappClean.includes(searchClean) || searchClean.includes(whatsappClean))) ||
             (emailClean && emailClean === valClean);
    });
    
    setLookupResult(matched || null);
  };

  // Submit Incidents Claim Form
  const handleIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Authentication Required: Please sign in with Google to file an incident report.');
      return;
    }
    setISuccess(false);
    setILoading(true);
    try {
      try {
        await addDoc(collection(db, 'incidents'), {
          type: iType,
          name: iName.trim(),
          description: iDesc.trim(),
          date: iDate,
          contact: iContact.trim(),
          status: 'pending',
          reportedBy: currentUser.uid,
          reporterEmail: currentUser.email || '',
          createdAt: Timestamp.now()
        });
      } catch (fErr) {
        handleFirestoreError(fErr, OperationType.CREATE, 'incidents');
      }
      setISuccess(true);
      setIName('');
      setIDesc('');
      setIDate('');
      setIContact('');
    } catch (err: any) {
      alert('Error creating report: ' + err.message);
    } finally {
      setILoading(false);
    }
  };

  // Public Poll Cast Vote
  const handlePublicVote = async (electionId: string, candidateId: string) => {
    if (!currentUser) {
      alert('Authentication Required: Please sign in with Google to cast your ballot.');
      return;
    }

    try {
      const voteDocId = `${currentUser.uid}_${electionId}`;
      let voteSnap;
      try {
        voteSnap = await getDoc(doc(db, 'votes', voteDocId));
      } catch (fErr) {
        handleFirestoreError(fErr, OperationType.GET, `votes/${voteDocId}`);
      }
      if (voteSnap.exists() || userVotedElections[electionId]) {
        alert('Ballot already Cast: You have already securely cast your ballot in this election category.');
        setUserVotedElections(prev => ({ ...prev, [electionId]: true }));
        return;
      }

      const ref = doc(db, 'elections', electionId);
      const voteRef = doc(db, 'votes', voteDocId);
      
      try {
        await runTransaction(db, async (transaction) => {
          const snap = await transaction.get(ref);
          if (!snap.exists()) throw new Error('Election profile not found');
          const data = snap.data() as Election;
          
          const candidates = (data.candidates || []).map((c) => {
            if (c.id === candidateId) {
              return { ...c, votes: (Number(c.votes) || 0) + 1 };
            }
            return c;
          });

          transaction.update(ref, { candidates });
          
          // Save the vote ledger securely
          transaction.set(voteRef, {
            userId: currentUser.uid,
            userEmail: currentUser.email || '',
            displayName: currentUser.displayName || '',
            electionId,
            candidateId,
            createdAt: Timestamp.now()
          });
        });
      } catch (fErr) {
        handleFirestoreError(fErr, OperationType.WRITE, `elections/${electionId}`);
      }

      localStorage.setItem(`voted_${electionId}`, 'true');
      setUserVotedElections(prev => ({ ...prev, [electionId]: true }));
      alert('Alhamdulillah! Your vote has been cast and saved to secure Firestore ledgers.');
    } catch (err: any) {
      alert('Voting transaction failed: ' + err.message);
    }
  };

  // Calculation variables
  const totalApprovedMembers = members.filter(m => m.status === 'approved').length;
  const accumulativeFunds = donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const reportedIncidentCount = incidents.filter(i => i.status === 'published').length;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-amber-50/15">
      
      {/* ----------------- APP NAVBAR HEADER ----------------- */}
      <header className="sticky top-0 z-50 bg-emerald-900 text-amber-50 shadow-md">
        <div className="container mx-auto max-w-7xl px-4 flex justify-between items-center h-16">
          
          <div className="flex items-center gap-2 text-left">
            <div className="bg-amber-500 rounded p-1">
              <Shield className="text-emerald-950" size={24} />
            </div>
            <div>
              <span className="font-display font-bold text-base sm:text-lg block tracking-tight text-amber-400 leading-none">
                OPC ADMIN
              </span>
              <span className="text-[9px] uppercase tracking-wider text-amber-100/70 block leading-tight">
                Oman Pakhtoon Community Welfare
              </span>
            </div>
          </div>

          {/* Desktop Nav links */}
          <nav className="hidden lg:flex items-center gap-1.5 font-medium text-xs">
            {[
              { id: 'home', label: 'Home Portal' },
              { id: 'register', label: 'Register Membership' },
              { id: 'cabinet', label: 'OPC Cabinet' },
              { id: 'elections', label: 'Cast Vote' },
              { id: 'report', label: 'Report Incident' },
              { id: 'chat', label: 'AI Assistant' },
              { id: 'admin', label: 'Admin Terminal' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCurrentPage(tab.id as any)}
                className={`px-3.5 py-2 rounded-md transition duration-150 cursor-pointer ${
                  currentPage === tab.id 
                    ? 'bg-amber-500 text-emerald-980 font-bold' 
                    : 'hover:bg-emerald-800/80 text-amber-100/90'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Desktop User Auth Section (Google Sign-In) */}
          <div className="hidden lg:flex items-center gap-3 border-l border-emerald-800/80 pl-4">
            {currentUser ? (
              <div className="flex items-center gap-2">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="User Avatar" className="w-8 h-8 rounded-full border border-amber-450" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-emerald-950 flex items-center justify-center font-bold text-xs uppercase">
                    {currentUser.displayName?.[0] || 'U'}
                  </div>
                )}
                <div className="text-left">
                  <span className="text-[11px] font-semibold text-amber-305 block max-w-[120px] truncate leading-none">{currentUser.displayName || 'Authorized User'}</span>
                  <button onClick={handleGoogleSignOut} className="text-[9px] text-amber-140/80 hover:text-amber-300 font-bold tracking-wider uppercase block mt-1 hover:underline transition">Sign Out</button>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleGoogleSignIn}
                className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-emerald-950 text-xs font-bold px-3 py-1.5 rounded-md shadow transition duration-150 cursor-pointer flex items-center gap-1.5"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google icon" className="w-3.5 h-3.5 rounded-full bg-white p-0.5" />
                Sign In
              </button>
            )}
          </div>

          {/* Mobile hamburger toggle */}
          <button 
            className="lg:hidden text-amber-400 p-1 rounded-md hover:bg-emerald-800 transition"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Oman Flag Stripe accent */}
        <div className="h-1 flex w-full">
          <div className="h-full bg-emerald-805 flex-1" style={{ backgroundColor: '#1b4d3e' }} />
          <div className="h-full bg-white flex-1" />
          <div className="h-full bg-red-651 flex-1" style={{ backgroundColor: '#c8102e' }} />
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-emerald-950/95 border-t border-emerald-800 py-3 px-4 flex flex-col gap-1 fade-in">
            {/* Mobile Auth button at top */}
            <div className="border-b border-emerald-800 pb-3 mb-2 pt-1 text-left">
              {currentUser ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="User Avatar" className="w-7 h-7 rounded-full border border-amber-450" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-amber-500 text-emerald-950 flex items-center justify-center font-bold text-xs">
                        {currentUser.displayName?.[0] || 'U'}
                      </div>
                    )}
                    <span className="text-xs font-bold text-amber-400">{currentUser.displayName || 'Authorized Member'}</span>
                  </div>
                  <button onClick={() => { handleGoogleSignOut(); setMobileMenuOpen(false); }} className="text-[10px] bg-emerald-850 hover:bg-emerald-800 text-amber-300 border border-emerald-700 font-bold px-2 py-1 rounded">
                    Sign Out
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    handleGoogleSignIn();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold text-xs py-2 rounded-md"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google logo" className="w-3.5 h-3.5 rounded-full bg-white p-0.5" />
                  Sign In with Google
                </button>
              )}
            </div>

            {[
              { id: 'home', label: 'Homepage Dashboard' },
              { id: 'register', label: 'New Member Registry' },
              { id: 'cabinet', label: 'OPC Cabinet Directory' },
              { id: 'elections', label: 'OPC Polls / Elections' },
              { id: 'report', label: 'Welfare Report Claim' },
              { id: 'chat', label: 'AI assistant Chat' },
              { id: 'admin', label: 'Administrative Access' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setCurrentPage(tab.id as any);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left p-2.5 rounded-md text-sm font-semibold transition ${
                  currentPage === tab.id ? 'bg-amber-500 text-emerald-950 font-bold' : 'text-amber-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ----------------- PAGES CONTENT ----------------- */}
      <main className="flex-1">

        {/* HOME PORTAL */}
        {currentPage === 'home' && (
          <div className="fade-in">
            
            {/* HERO HERO SECTION */}
            <div className="bg-gradient-to-br from-emerald-950 to-emerald-900 text-white pt-10 pb-6 px-4 text-center border-b border-amber-500/10">
              <div className="container mx-auto max-w-4xl space-y-4">
                <span className="bg-amber-500 text-emerald-950 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  Sultanate of Oman Chapter
                </span>
                <h1 className="text-3xl sm:text-5xl font-serif font-extrabold text-amber-450 tracking-tight leading-tight">
                  Oman Pakhtoon Community portal
                </h1>
                <p className="text-amber-100/80 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-sans">
                  The primary network providing general assistance, lifetime welfare claim support, 
                  and cooperative services for the diaspora Pakhtoon tribes living in Muscat, Salalah, Sohar and across Oman.
                </p>

                {/* Metric stats card badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 max-w-3xl mx-auto z-10">
                  <div className="bg-white/5 border border-amber-500/25 rounded-lg p-4 backdrop-blur-xs text-center">
                    <span className="flex items-center justify-center gap-1 text-[10px] font-bold tracking-widest text-amber-400 uppercase">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Verified Members
                    </span>
                    <p className="text-3xl font-bold font-serif text-white mt-1.5">{totalApprovedMembers}</p>
                  </div>
                  <div className="bg-white/5 border border-amber-500/25 rounded-lg p-4 backdrop-blur-xs text-center">
                    <span className="flex items-center justify-center gap-1 text-[10px] font-bold tracking-widest text-amber-400 uppercase">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Welfare donations
                    </span>
                    <p className="text-3xl font-bold font-serif text-white mt-1.5">OMR {accumulativeFunds.toFixed(3)}</p>
                  </div>
                  <div className="bg-white/5 border border-amber-500/25 rounded-lg p-4 backdrop-blur-xs text-center">
                    <span className="flex items-center justify-center gap-1 text-[10px] font-bold tracking-widest text-amber-400 uppercase">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> welfare cases
                    </span>
                    <p className="text-3xl font-bold font-serif text-white mt-1.5">{reportedIncidentCount}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="container mx-auto max-w-7xl px-4 py-8 space-y-12">
              
              {/* SPONSORED SLIDER BILLBOARD */}
              <section className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-serif text-emerald-950 font-bold border-l-4 border-amber-500 pl-3">
                  Sponsors and Promotions
                </h2>
                <SponsoredBillboard ads={ads} />
              </section>

              {/* DONATION ACCOUNTS BANK ACCOUNT INFO */}
              <section className="bg-emerald-900 text-white rounded-xl shadow-lg p-6 sm:p-8 space-y-4 border-2 border-amber-500/20">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-amber-400">Community Welfare Fund</h3>
                    <p className="text-xs text-amber-100/70 mt-1 max-w-xl">
                      Every Omani Rial directly funds emergency rescue efforts, injury compensation, 
                      or repatriation support for tribal families in Muscat.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-950/50 p-3 rounded-lg border border-emerald-800">
                    <Landmark size={20} className="text-amber-500" />
                    <div>
                      <span className="text-[10px] text-amber-100 font-bold uppercase tracking-wider block">Official Collector Name</span>
                      <span className="text-sm font-bold text-white block">IKRAM BACHA</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-emerald-800 pt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-sans">
                  <div className="bg-emerald-950 text-amber-100 rounded p-4 font-mono">
                    <span className="text-[10px] text-amber-400 font-bold block uppercase mb-1">Bank Name</span>
                    <span className="font-semibold text-sm">Bank Dhofar (Muscat, Sultanate of Oman)</span>
                  </div>
                  <div className="bg-emerald-950 text-amber-100 rounded p-4 font-mono">
                    <span className="text-[10px] text-amber-400 font-bold block uppercase mb-1">Account Number</span>
                    <span className="font-bold text-sm tracking-wider">01011503131001</span>
                  </div>
                  <div className="bg-emerald-950 text-amber-100 rounded p-4 font-mono">
                    <span className="text-[10px] text-amber-400 font-bold block uppercase mb-1">Mobile Wallet / Pay</span>
                    <span className="font-bold text-sm tracking-widest">+968 99111870</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-2">
                  <a href="tel:+96899111870" className="bg-amber-500 hover:bg-amber-600 text-emerald-950 font-extrabold px-5 py-2.5 rounded text-xs tracking-wider uppercase shadow transition active:scale-95">
                    Call Ikram Bacha (+968 99111870)
                  </a>
                  <a href="https://wa.me/96899111870" target="_blank" rel="noopener noreferrer" className="bg-emerald-955 hover:bg-emerald-960 text-white font-extrabold px-5 py-2.5 rounded text-xs tracking-wider uppercase shadow border border-emerald-750 transition active:scale-95" style={{ backgroundColor: '#135c46' }}>
                    Confirm payment details on WhatsApp
                  </a>
                </div>
              </section>

              {/* COMMUNITY CABINET EXECUTIVE TEAM */}
              <section className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h2 className="text-xl sm:text-2xl font-serif text-emerald-950 font-bold border-l-4 border-amber-500 pl-3">
                    OPC Cabinet Members
                  </h2>
                  <button 
                    onClick={() => {
                      setCurrentPage('cabinet');
                      window.scrollTo(0, 0);
                    }}
                    className="text-xs font-semibold text-emerald-800 hover:text-emerald-990 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    View Full Directory &rarr;
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {cabinet.length === 0 ? (
                    <div className="p-10 bg-white border border-slate-200 rounded-lg text-center text-slate-400 font-medium font-serif w-full col-span-full">
                      The official OPC cabinet bears directory is loaded as soon as an administrator sets up credentials.
                    </div>
                  ) : (
                    [...cabinet]
                      .sort((a, b) => {
                        const priorityA = getPositionPriority(a.position);
                        const priorityB = getPositionPriority(b.position);
                        if (priorityA !== priorityB) {
                          return priorityA - priorityB;
                        }
                        return a.name.localeCompare(b.name);
                      })
                      .slice(0, 8) // Show top 8 on home page, rest available in full tab directory
                      .map((cm) => (
                        <div key={cm.id} className="bg-white border rounded-xl shadow-xs overflow-hidden text-center p-5 space-y-3 hover:shadow-md transition">
                          {cm.photo ? (
                            <img src={cm.photo} alt={cm.name} className="w-24 h-24 rounded-full object-cover border-4 border-amber-400 mx-auto" />
                          ) : (
                            <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed flex items-center justify-center font-bold font-serif text-3xl text-slate-400 mx-auto">
                              {cm.name[0]}
                            </div>
                          )}
                          <div>
                            <h4 className="font-serif font-bold text-emerald-950 leading-tight">{cm.name}</h4>
                            <span className="text-xs text-red-650 font-bold block mt-0.5 uppercase tracking-wide">
                              {cm.position}
                            </span>
                          </div>
                          {cm.phone && (
                            <p className="text-[11px] font-mono font-semibold text-slate-500">
                              Mob: {cm.phone}
                            </p>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </section>

              {/* BULLETINS NEWS SECTION */}
              <section className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-serif text-emerald-950 font-bold border-l-4 border-amber-500 pl-3">
                  Community Announcements &amp; bulletins
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {news.length === 0 ? (
                    <div className="p-10 bg-white border border-slate-200 rounded-lg text-center text-slate-400 font-medium font-serif col-span-full">
                      No announcement bulletins published. Active bulletins will appear here.
                    </div>
                  ) : (
                    news.map((item) => (
                      <div key={item.id} className="bg-white border rounded-xl overflow-hidden shadow-xs text-left h-full flex flex-col justify-between">
                        <div>
                          {item.image && (
                            <img src={item.image} alt={item.title} className="w-full h-44 object-cover border-b" />
                          )}
                          <div className="p-5 space-y-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                              <Calendar size={12} /> {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('en-GB') : ''}
                            </span>
                            <h4 className="font-serif font-bold text-emerald-950 text-base leading-snug">
                              {item.title}
                            </h4>
                            <p className="text-xs text-slate-500 line-clamp-4 leading-relaxed whitespace-pre-line">
                              {item.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* INCIDENTS WELFARE REPORTS LIST */}
              <section className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-serif text-emerald-950 font-bold border-l-4 border-amber-500 pl-3">
                  Welfare &amp; Incident Reports (Audit Queue)
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {incidents.filter(i => i.status === 'published').length === 0 ? (
                    <div className="p-10 bg-white border border-slate-200 rounded-lg text-center text-slate-400 font-serif col-span-full">
                      No reviewed welfare reports published for assistance. Submit claims via the "Report Incident" tab.
                    </div>
                  ) : (
                    incidents.filter(i => i.status === 'published').map((item) => (
                      <div key={item.id} className="bg-white border-l-4 border-l-red-651 border-y border-r rounded-r-xl p-5 text-left flex flex-col justify-between">
                        <div className="space-y-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-extrabold tracking-wide ${
                            item.type === 'death' ? 'bg-red-100 text-red-800' :
                            item.type === 'injury' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.type}
                          </span>
                          <h4 className="font-serif font-bold text-emerald-950 text-base">{item.name}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed font-sans line-clamp-3">
                            {item.description}
                          </p>
                        </div>
                        <div className="border-t pt-2.5 mt-4 flex justify-between items-center text-[10px] text-slate-400">
                          <span>Reported: {item.date}</span>
                          <span className="font-mono">Contact: {item.contact}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* PAKISTAN EMBASSY MUSCAT COORDINATES */}
              <section className="space-y-4 text-left">
                <h2 className="text-xl sm:text-2xl font-serif text-emerald-950 font-bold border-l-4 border-amber-500 pl-3">
                  Embassy of Pakistan, Muscat
                </h2>
                <div className="bg-white border rounded-xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1 md:col-span-2">
                    <h3 className="font-serif text-lg font-bold text-emerald-905">Muscat Consulate Coordination</h3>
                    <p className="text-xs text-slate-500 max-w-xl">
                      The Embassy coordinates critical consular services including dead body repatriation, 
                      emergency outpasses, and legal aid. Maintain these details up-to-date.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs font-sans">
                      <div>
                        <span className="font-bold text-slate-600 block">Diplomatic Address</span>
                        <p className="text-slate-500 mt-1">{embassy.address || 'P.O. Box 24, PC 112, Ruwi, Muscat, Sultanate of Oman'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-600 block">General Office Hours</span>
                        <p className="text-slate-500 mt-1">{embassy.hours || '08:00 AM - 04:00 PM (Sunday to Thursday)'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-950/5 border border-emerald-900/10 p-5 rounded-lg space-y-3.5 text-xs">
                    <h4 className="font-bold text-emerald-950 flex items-center gap-1.5 border-b pb-1.5">
                      <HelpCircle size={15} /> Emergency Consular Numbers
                    </h4>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-red-650" />
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase leading-none">Emergency Lifeline Helpline</span>
                          <span className="font-mono font-bold text-sm text-emerald-950">{embassy.emergency || '+968 99222870'}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-emerald-800" />
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase leading-none">consular Phone</span>
                          <span className="font-mono font-bold text-slate-800">{embassy.phone || '+968 24603410'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-emerald-800" />
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase leading-none">Consular Email</span>
                          <span className="font-bold text-slate-800">{embassy.email || 'parepmuscat@mofa.gov.pk'}</span>
                        </div>
                      </div>
                    </div>

                    <a 
                      href={embassy.website || 'https://www.pakembmuscat.gov.pk'} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex justify-center items-center w-full bg-emerald-900 text-white font-bold py-2 rounded text-[10px] tracking-wide uppercase shadow hover:bg-emerald-950 transition"
                    >
                      Visit Consulate Website
                    </a>
                  </div>
                </div>
              </section>

            </div>
          </div>
        )}

        {/* REGISTER MEMBERSHIP PAGE */}
        {currentPage === 'register' && (
          <div className="container mx-auto max-w-4xl px-4 py-8 fade-in">
            <div className="space-y-4 text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-serif font-extrabold text-emerald-950">OPC Member Portal</h2>
              <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
                Apply for local lifetime membership or verify approved request status to render and download your card, certificate, and official payment receipts.
              </p>
            </div>

            {/* View Tab Selector */}
            <div className="flex justify-center gap-2 mb-8 bg-slate-100 p-1 rounded-xl max-w-md mx-auto border border-slate-200/50">
              <button
                onClick={() => {
                  setRegisterTab('submit');
                  setLookupResult(null);
                  setLookupAttempted(false);
                }}
                className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold tracking-wider uppercase transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  registerTab === 'submit'
                    ? 'bg-emerald-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/55'
                }`}
              >
                <UserPlus size={14} />
                Submit Application
              </button>
              <button
                onClick={() => {
                  setRegisterTab('lookup');
                  setLookupResult(null);
                  setLookupAttempted(false);
                }}
                className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold tracking-wider uppercase transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  registerTab === 'lookup'
                    ? 'bg-emerald-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/55'
                }`}
              >
                <Search size={14} />
                Check Status &amp; Cards
              </button>
            </div>

            {/* Smart Google Account approved member detector */}
            {registerTab === 'lookup' && currentUser?.email && (() => {
              const matchedUser = members.find(m => m.status === 'approved' && m.email?.toLowerCase().trim() === currentUser?.email?.toLowerCase().trim());
              if (matchedUser) {
                return (
                  <div className="bg-emerald-950/5 border border-emerald-900/10 rounded-xl p-5 mb-6 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded uppercase tracking-widest inline-block mb-1 font-mono">Approved Account Linked</span>
                      <h4 className="text-base font-serif font-bold text-slate-900">We found your verified lifetime membership!</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Welcome back, <strong>{matchedUser.name}</strong>. Your membership is fully active. Use the button to view/generate credentials.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveDocMember(matchedUser);
                        setDocModalOpen(true);
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-emerald-950 font-extrabold px-5 py-2.5 rounded text-xs tracking-wider uppercase shadow transition shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <CreditCard size={14} />
                      Launch Documents Desk
                    </button>
                  </div>
                );
              }
              return null;
            })()}

            {registerTab === 'submit' && (
              <div className="max-w-3xl mx-auto space-y-6">
                {rSuccess && (
                  <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg p-5 text-center shadow-xs">
                    <span className="text-emerald-700 block font-bold text-lg mb-1">Registration Request Sent</span>
                    <p className="text-xs text-slate-600">
                      Your application has been received. OPC administrative coordinators will verify your identity 
                      details and contacts to update your credentials shortly.
                    </p>
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="bg-white rounded-xl shadow-md p-6 sm:p-8 space-y-6 text-left border border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={rName}
                        onChange={(e) => setRName(e.target.value)}
                        placeholder="e.g. Ikram Ullah Bacha"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus:outline-emerald-800 text-sm bg-slate-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                        Father's Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={rFather}
                        onChange={(e) => setRFather(e.target.value)}
                        placeholder="e.g. Gul Rehman Bacha"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus:outline-emerald-800 text-sm bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                        CNIC / Passport Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={rCnic}
                        onChange={(e) => setRCnic(e.target.value)}
                        placeholder="e.g. 15101-XXXXXXXX-X"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus:outline-emerald-800 text-sm bg-slate-50/50 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                        District / Tribe (KPK) *
                      </label>
                      <input
                        type="text"
                        required
                        value={rDistrict}
                        onChange={(e) => setRDistrict(e.target.value)}
                        placeholder="e.g. Buner / Swat / Mardan"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus:outline-emerald-800 text-sm bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                        Mobile Number (Oman) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={rPhone}
                        onChange={(e) => setRPhone(e.target.value)}
                        placeholder="e.g. +968 99111870"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus:outline-emerald-800 text-sm bg-slate-50/50 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                        Email Address *
                        {currentUser && currentUser.email === rEmail && (
                          <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1 py-0.5 rounded flex items-center gap-0.5">
                            <CheckCircle size={10} /> Account Synced
                          </span>
                        )}
                      </label>
                      <input
                        type="email"
                        required
                        value={rEmail}
                        onChange={(e) => setREmail(e.target.value)}
                        placeholder="e.g. name@domain.com"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus:outline-emerald-800 text-sm bg-slate-50/50 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 font-sans">
                        WhatsApp Number
                      </label>
                      <input
                        type="tel"
                        value={rWhatsapp}
                        onChange={(e) => setRWhatsapp(e.target.value)}
                        placeholder="+968 XXXXXXXX"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus:outline-emerald-800 text-sm bg-slate-50/50 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                        Current Occupation / Trades
                      </label>
                      <input
                        type="text"
                        value={rOccupation}
                        onChange={(e) => setROccupation(e.target.value)}
                        placeholder="e.g. Businessman / Driver / Electrician"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus:outline-emerald-800 text-sm bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      Current Permanent address (Oman) *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={rAddress}
                      onChange={(e) => setRAddress(e.target.value)}
                      placeholder="e.g. Building 24, Al Ghubrah South, Muscat"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus:outline-emerald-800 text-sm bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      Emergency Contact Number (Pakistan)
                    </label>
                    <input
                      type="tel"
                      value={rEmergency}
                      onChange={(e) => setREmergency(e.target.value)}
                      placeholder="e.g. +92 312 XXXXXXX"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus:outline-emerald-800 text-sm bg-slate-50/50 font-mono"
                    />
                  </div>

                  {/* Payment Receipt / Verification Info */}
                  <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl space-y-4">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block border-b border-emerald-100 pb-2">
                      Registration Fee Verification (Lifetime Membership)
                    </span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                          Fee Paid (OMR) *
                        </label>
                        <select
                          value={rFeeAmount}
                          onChange={(e) => setRFeeAmount(e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus:outline-emerald-800 text-sm bg-white"
                        >
                          <option value="5">5.000 OMR (Standard)</option>
                          <option value="10">10.000 OMR (Premium / Supporter)</option>
                          <option value="3">3.000 OMR (Concessionary)</option>
                          <option value="0">0.000 OMR (Fee Waiver / Free)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                          Payment Method *
                        </label>
                        <select
                          value={rPayMethod}
                          onChange={(e) => setRPayMethod(e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus:outline-emerald-800 text-sm bg-white font-sans"
                        >
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Mobile Wallet">Mobile Wallet / Pay</option>
                          <option value="Cash">Paid Cash to Representative</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 font-sans">
                          Ref No. / Mobile No. *
                        </label>
                        <input
                          type="text"
                          required
                          value={rPayRef}
                          onChange={(e) => setRPayRef(e.target.value)}
                          placeholder="e.g. Txn ID or Sender No."
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus:outline-emerald-800 text-sm bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      Passport Photo (For Card generation)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-705 hover:file:bg-emerald-100 cursor-pointer"
                    />
                    
                    {rPhoto && (
                      <div className="mt-3">
                        <span className="text-[10px] text-slate-400 block mb-1">Cropped Preview:</span>
                        <img src={rPhoto} alt="Upload crop preview" className="w-16 h-20 object-cover border border-slate-200 rounded shadow-xs" />
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={rLoading}
                    className="w-full bg-emerald-900 hover:bg-emerald-950 text-white font-bold py-3.5 px-4 rounded-md transition duration-150 cursor-pointer shadow disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                  >
                    {rLoading ? 'Submitting Application...' : 'Submit Membership Request'}
                  </button>
                </form>
              </div>
            )}

            {registerTab === 'lookup' && (
              <div className="space-y-6 max-w-2xl mx-auto fade-in">
                <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 space-y-6 border border-slate-200 text-left">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-emerald-950">Verify &amp; Download Membership Credentials</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Already registered? Enter your Omani Mobile phone number, CNIC/Passport, or synced email address below to dynamically verify and download your lifetime association card, board certificate, and verified payment receipt.
                    </p>
                  </div>

                  <form onSubmit={handleLookupMember} className="flex gap-2.5">
                    <div className="relative flex-1">
                      <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400 font-sans" />
                      <input
                        type="text"
                        required
                        value={lookupValue}
                        onChange={(e) => setLookupValue(e.target.value)}
                        placeholder="Enter CNIC, Mobile No. or Email Address"
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-md focus:outline-emerald-800 text-sm bg-slate-50/50 font-sans"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-emerald-900 hover:bg-emerald-950 text-white font-bold px-6 py-2.5 rounded-md transition duration-150 cursor-pointer text-xs uppercase tracking-wider shrink-0"
                    >
                      Verify Status
                    </button>
                  </form>

                  {/* RESULTS SECTION */}
                  {lookupAttempted && (
                    <div className="mt-4 border-t pt-5 animate-fade-in">
                      {lookupResult ? (
                        <div className="space-y-6">
                          {/* Success Banner */}
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3 text-green-900">
                            <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold block text-sm">Verified Member Profile Found</span>
                              <p className="text-xs text-green-800/90 mt-0.5">
                                Your membership application is officially approved! You have secure access to preview, generate, and download your credential cards and certificates below.
                              </p>
                            </div>
                          </div>

                          {/* Member Info Card */}
                          <div className="bg-emerald-950/5 border border-emerald-900/10 rounded-xl p-6 relative overflow-hidden flex flex-col sm:flex-row gap-5">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-700/5 rounded-full blur-2xl pointer-events-none" />
                            
                            {/* Photo */}
                            <div className="shrink-0 mx-auto sm:mx-0">
                              {lookupResult.photo ? (
                                <img src={lookupResult.photo} alt={lookupResult.name} className="w-24 h-28 object-cover rounded-lg border-2 border-amber-400 shadow-sm" />
                              ) : (
                                <div className="w-24 h-28 bg-emerald-900/10 border-2 border-dashed border-emerald-250 flex items-center justify-center font-bold text-3xl text-emerald-800 rounded-lg">
                                  {lookupResult.name[0]}
                                </div>
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 space-y-3 font-sans text-xs">
                              <div className="border-b pb-2">
                                <span className="text-[9px] uppercase tracking-widest font-bold text-amber-600 block leading-tight">OPC LIFETIME MEMBER</span>
                                <h4 className="text-lg font-serif font-bold text-emerald-950">{lookupResult.name}</h4>
                                <span className="text-slate-500 font-mono font-bold">CNIC: {lookupResult.cnic}</span>
                              </div>

                              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-slate-600">
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Father's Name</span>
                                  <span className="font-semibold text-emerald-900">{lookupResult.father}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Member ID No.</span>
                                  <span className="font-bold text-emerald-900 font-mono">{lookupResult.membershipId || "OPC-" + String(lookupResult.id).substring(0, 5).toUpperCase()}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Oman Mobile</span>
                                  <span className="font-semibold text-emerald-900 font-mono">{lookupResult.phone}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Dues Status</span>
                                  <span className="font-bold text-emerald-700">✅ PAID (OMR {Number(lookupResult.feeAmount || 5).toFixed(3)})</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* ACTION BUTTON GRID */}
                          <div className="space-y-3">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Available Credential Downloads:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <button
                                onClick={() => {
                                  setActiveDocMember(lookupResult);
                                  setDocModalOpen(true);
                                }}
                                className="bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-900/40 font-bold py-3 px-4 rounded-lg text-xs leading-5 tracking-wide uppercase shadow-xs hover:border-emerald-900 transition flex flex-col items-center justify-center gap-2 cursor-pointer text-center group font-sans"
                              >
                                <CreditCard size={18} className="text-amber-500 group-hover:scale-110 transition shrink-0" />
                                <span>Get Member Card</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveDocMember(lookupResult);
                                  setDocModalOpen(true);
                                }}
                                className="bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-900/40 font-bold py-3 px-4 rounded-lg text-xs leading-5 tracking-wide uppercase shadow-xs hover:border-emerald-900 transition flex flex-col items-center justify-center gap-2 cursor-pointer text-center group font-sans"
                              >
                                <Award size={18} className="text-amber-500 group-hover:scale-110 transition shrink-0" />
                                <span>Get Certificate</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveDocMember(lookupResult);
                                  setDocModalOpen(true);
                                }}
                                className="bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-900/40 font-bold py-3 px-4 rounded-lg text-xs leading-5 tracking-wide uppercase shadow-xs hover:border-emerald-900 transition flex flex-col items-center justify-center gap-2 cursor-pointer text-center group font-sans"
                              >
                                <FileText size={18} className="text-amber-500 group-hover:scale-110 transition shrink-0" />
                                <span>Get Payment Receipt</span>
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-400 text-center mt-1">
                              💡 These buttons will load the official high-resolution documents workspace. You can choose to download PNG images. All credentials contain verifiable cryptographic secure hashes.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-5 text-center text-amber-900 font-sans">
                          <HelpCircle size={32} className="text-amber-500 p-0.5 mx-auto mb-2.5 animate-pulse shrink-0" />
                          <span className="font-bold block text-sm">No Approved Lifetime Member Record Found</span>
                          <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                            We couldn't locate an approved lifetime membership matching <strong>"{lookupValue}"</strong>. 
                            If you recently submitted your registration, please wait for administrative coordinators to review your claim.
                          </p>
                          <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
                            <button
                              onClick={() => {
                                setRegisterTab('submit');
                              }}
                              className="bg-emerald-900 hover:bg-emerald-950 text-white font-bold px-4 py-2 rounded text-[11px] transition cursor-pointer"
                            >
                              Apply for New Membership
                            </button>
                            <a
                              href="tel:+96899111870"
                              className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold px-4 py-2 rounded text-[11px] transition cursor-pointer"
                            >
                              Call Hotline: +968 99111870
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CABINET & MEMBERS DIRECTORY */}
        {currentPage === 'cabinet' && (
          <div className="container mx-auto max-w-7xl px-4 py-8 fade-in">
            <CabinetPanel cabinet={cabinet} members={members} />
          </div>
        )}

        {/* ELECTIONS AND VOTING PAGE */}
        {currentPage === 'elections' && (
          <div className="container mx-auto max-w-4xl px-4 py-8 fade-in">
            <div className="space-y-4 text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-serif font-extrabold text-emerald-950">Cast Your Vote</h2>
              <p className="text-sm text-slate-500 max-w-xl mx-auto">
                Cast your device vote for open elections, and monitor real-time vote distribution metrics.
              </p>
            </div>

            <div className="space-y-6 text-left">
              {elections.length === 0 ? (
                <div className="p-10 bg-white border border-slate-200 rounded-xl text-center text-slate-400 font-medium font-serif max-w-xl mx-auto shadow-xs">
                  No active election cycles configured by the admin board yet.
                </div>
              ) : (
                elections.map((el) => {
                  const sortedCandidates = [...(el.candidates || [])].sort((a, b) => b.votes - a.votes);
                  const totalVotes = el.candidates.reduce((sum, c) => sum + (Number(c.votes) || 0), 0);
                  const hasVoted = userVotedElections[el.id!];

                  return (
                    <div key={el.id} className="bg-white border rounded-xl overflow-hidden shadow-md p-6 space-y-6">
                      <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-4">
                        <div className="space-y-1">
                          <h3 className="font-serif text-xl font-bold text-emerald-950">{el.title}</h3>
                          {el.endDate && (
                            <p className="text-[11px] text-slate-400 font-sans">
                              Deadline: {new Date(el.endDate).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-1.5 rounded text-[10px] uppercase font-bold tracking-wider leading-none ${
                            el.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {el.status === 'open' ? 'Open for voting' : 'Completed / Closed'}
                          </span>
                          {el.status === 'open' && el.endDate && (
                            <CountdownTimer endDate={el.endDate} />
                          )}
                        </div>
                      </div>

                      {/* Bar metrics visual mapping */}
                      <div className="space-y-4">
                        {sortedCandidates.map((c) => {
                          const pct = totalVotes > 0 ? (c.votes / totalVotes) * 100 : 0;
                          return (
                            <div key={c.id} className="space-y-1.5">
                              <div className="flex justify-between text-xs sm:text-sm">
                                <span className="font-semibold text-slate-700">{c.name}</span>
                                <span className="font-bold text-emerald-900 font-mono">{c.votes} votes ({pct.toFixed(0)}%)</span>
                              </div>
                              <div className="h-2.5 w-full bg-slate-105 rounded-full overflow-hidden" style={{ backgroundColor: '#f1f5f9' }}>
                                <div 
                                  className="h-full bg-emerald-800 transition-all duration-300 rounded-full" 
                                  style={{ width: `${pct}%`, backgroundColor: '#1b4d3e' }} 
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Cast active ballot if open */}
                      {el.status === 'open' && (
                        <div className="border-t pt-4 mt-6">
                          {el.endDate && new Date(el.endDate).getTime() <= Date.now() ? (
                            <div className="bg-red-50 text-red-800 p-4 border border-red-100 rounded text-xs font-semibold flex items-center justify-center gap-1.5 font-sans">
                              ⌛ Voting period has naturally expired! No further ballots can be cast.
                            </div>
                          ) : !currentUser ? (
                            <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-5 text-center space-y-3">
                              <span className="text-slate-700 text-xs font-semibold block">You must sign in with your Google account to cast a vote under current OPC guidelines.</span>
                              <button 
                                onClick={handleGoogleSignIn}
                                className="inline-flex items-center gap-2 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-bold py-2.5 px-4 rounded shadow transition active:scale-95 cursor-pointer"
                              >
                                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 rounded-full bg-white p-0.5" />
                                Verify Identity &amp; Sign in to Vote
                              </button>
                            </div>
                          ) : hasVoted ? (
                            <div className="bg-green-50 text-green-850 p-4 border border-green-100 rounded text-xs font-semibold flex items-center justify-center gap-1.5">
                              <UserCheck size={16} /> Ballot Cast! Your vote is securely recorded for this election.
                            </div>
                          ) : (
                            <div className="space-y-3.5">
                              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
                                Choose Candidate:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {el.candidates.map((c) => (
                                  <button
                                    key={c.id}
                                    onClick={() => handlePublicVote(el.id!, c.id)}
                                    className="w-full text-left p-3 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-emerald-800/40 transition flex items-center gap-2.5 font-semibold text-xs cursor-pointer group"
                                  >
                                    <div className="w-4 h-4 rounded-full border border-slate-250 flex items-center justify-center group-hover:border-emerald-800 group-hover:bg-emerald-50">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-800 opacity-0 group-hover:opacity-100" />
                                    </div>
                                    <span className="text-slate-800 font-medium">{c.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* REPORT INCIDENT FORM CLAIM PAGE */}
        {currentPage === 'report' && (
          <div className="container mx-auto max-w-2xl px-4 py-8 fade-in">
            <div className="space-y-4 text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-serif font-extrabold text-emerald-950 font-sans">Report Welfare Incident</h2>
              <p className="text-sm text-slate-500 max-w-lg mx-auto">
                Submit details regarding emergency cases: deaths, critical injuries, or asset loss. 
                Reports are audited by the OPC executive team before being published for collective assistance.
              </p>
            </div>

            {!currentUser ? (
              <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200 text-center space-y-5 max-w-lg mx-auto">
                <div className="w-12 h-12 bg-amber-100 text-emerald-900 rounded-full flex items-center justify-center mx-auto">
                  <Shield size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-lg text-emerald-950">Identity Verification Required</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    To prioritize legitimate emergencies, prevent duplicate fake reporting, and protect welfare funds, 
                    users must securely sign in with Google before filing reports.
                  </p>
                </div>
                <button 
                  onClick={handleGoogleSignIn}
                  className="inline-flex items-center gap-2 bg-emerald-900 hover:bg-emerald-950 text-white font-bold py-3 px-6 rounded-md shadow transition duration-155 cursor-pointer text-xs"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google logo" className="w-4 h-4 rounded-full bg-white p-0.5" />
                  Sign In with Google
                </button>
              </div>
            ) : (
              <>
                {iSuccess && (
                  <div className="bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-lg p-5 mb-6 text-center">
                    <span className="text-emerald-700 block font-bold text-lg mb-1">Claim Submitted Successfully</span>
                    <p className="text-xs text-slate-600">
                      Your incident claim has been posted to our audit queue. OPC officers are reviewing contacts 
                      to prioritize community help.
                    </p>
                  </div>
                )}

                <form onSubmit={handleIncidentSubmit} className="bg-white rounded-xl shadow-md p-6 sm:p-8 space-y-6 text-left border border-slate-200">
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-650 uppercase tracking-wide mb-1.5">
                      Type of Welfare Case *
                    </label>
                    <select
                      value={iType}
                      onChange={(e) => setIType(e.target.value as any)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus:outline-emerald-800 text-sm bg-slate-50/50"
                    >
                      <option value="death">Death / Body Repatriation Assistance</option>
                      <option value="injury">Critical Medical / Body Injury Help</option>
                      <option value="loss">Asset Damage / Financial Hardship Claim</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-650 uppercase tracking-wide mb-1.5">
                      Name of Affected Individual *
                    </label>
                    <input
                      type="text"
                      required
                      value={iName}
                      onChange={(e) => setIName(e.target.value)}
                      placeholder="e.g. Mohammad Khan Swati"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus:outline-emerald-800 text-sm bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-650 uppercase tracking-wide mb-1.5">
                      Description of Incident (Include particulars &amp; required aid) *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={iDesc}
                      onChange={(e) => setIDesc(e.target.value)}
                      placeholder="Write details e.g. Deceased passed away due to cardiac arrest at Ruwi construction site. Relatives need aid for casket transport to Peshawar..."
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus:outline-emerald-800 text-sm bg-slate-50/50 leading-relaxed font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-650 uppercase tracking-wide mb-1.5">
                        Date of Incident *
                      </label>
                      <input
                        type="date"
                        required
                        value={iDate}
                        onChange={(e) => setIDate(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus:outline-emerald-800 text-sm bg-slate-50/50 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-650 uppercase tracking-wide mb-1.5">
                        Your Contact Mobile (Oman) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={iContact}
                        onChange={(e) => setIContact(e.target.value)}
                        placeholder="+968 XXXXXXXX"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus:outline-emerald-800 text-sm bg-slate-50/50 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={iLoading}
                    className="w-full bg-emerald-900 hover:bg-emerald-950 text-white font-bold py-3.5 px-4 rounded-md transition duration-155 cursor-pointer shadow disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {iLoading ? 'Submitting Report Context...' : 'File Incident Report Request'}
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {/* AI ASSISTANT CHATBOT */}
        {currentPage === 'chat' && (
          <div className="container mx-auto max-w-4xl px-4 py-8 fade-in">
            <AIAssistant />
          </div>
        )}

        {/* ADMIN TERMINAL PANEL */}
        {currentPage === 'admin' && (
          <AdminPanel 
            user={adminUser}
            members={members}
            cabinet={cabinet}
            donations={donations}
            incidents={incidents}
            news={news}
            embassy={embassy}
            elections={elections}
            ads={ads}
            meetings={meetings}
            onViewDocuments={(m) => {
              setActiveDocMember(m);
              setDocModalOpen(true);
            }}
          />
        )}

      </main>

      {/* ----------------- APP FOOTER CARD INFO ----------------- */}
      <footer className="bg-emerald-950 text-amber-50/80 border-t border-amber-500/10 py-8 px-4 text-center text-xs">
        <div className="container mx-auto max-w-4xl space-y-3 font-sans">
          <p className="font-serif text-amber-300 font-bold text-sm tracking-wide">
            Oman Pakhtoon Community (OPC) Setup
          </p>
          <p className="text-amber-100/60 leading-relaxed max-w-xl mx-auto">
            Providing reliable diaspora representations, general welfare programs, and cooperative support 
            services across the Sultanate of Oman.
          </p>
          <p className="text-amber-550/50 font-mono text-[10px] text-amber-500/40">
            For general welfare operations, sponsorship deals, or card records &gt; WhatsApp +968 99111870
          </p>
        </div>
      </footer>

      {/* DOCUMENT CARD/CERTIFICATE GENERATOR MODAL */}
      <DocumentModal 
        isOpen={docModalOpen}
        member={activeDocMember}
        isAdmin={!!adminUser}
        onClose={() => {
          setDocModalOpen(false);
          setActiveDocMember(null);
        }}
      />

    </div>
  );
}
