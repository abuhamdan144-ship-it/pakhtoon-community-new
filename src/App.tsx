import React, { useState, useEffect } from 'react';
import { 
  collection, onSnapshot, addDoc, query, orderBy, Timestamp, doc, runTransaction, getDoc, setDoc, where, deleteDoc 
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
  return errInfo;
}
import { 
  Member, Donation, CabinetMember, CabinetMeeting, NewsAnnouncement, IncidentReport, EmbassySetting, Election, SponsoredAd, FounderProfile 
} from './types';

// Importing sub-components & modular components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Hero from './components/Hero';
import Stats from './components/Stats';
import Cabinet from './components/Cabinet';
import News from './components/News';
import ElectionsComponent from './components/Elections';
import Incidents from './components/Incidents';
import LiveTV from './components/LiveTV';
import Membership from './components/Membership';

// Importing pages
import Home from './pages/Home';
import Register from './pages/Register';
import ElectionsPage from './pages/Elections';
import Report from './pages/Report';
import AdminPage from './pages/Admin';

import SponsoredBillboard from './components/SponsoredBillboard';
import Glass3DPipeTicker from './components/Glass3DPipeTicker';
import OmanDistrictMap from './components/OmanDistrictMap';
import DocumentModal from './components/DocumentModal';
import FounderProfileModal from './components/FounderProfileModal';
import AdminPanel from './components/AdminPanel';
import AIAssistant from './components/AIAssistant';
import CountdownTimer from './components/CountdownTimer';
import CabinetPanel from './components/CabinetPanel';
import LiveCardPreview from './components/LiveCardPreview';
import AnimatedCounter from './components/AnimatedCounter';
import FormSubmitButton from './components/FormSubmitButton';
import { 
  NationalDayAnnouncementBar, 
  PakistanZindabadSection, 
  CrescentStarIcon, 
  PakistaniFlagVector, 
  fireNationalConfetti 
} from './components/NationalDayTheme';
import { CARD_COLORS } from './components/CardColors';
import logoImg from './assets/images/pukhtoon_community_logo_1785867933974.jpg';
import { translations, languageNames, Language } from './translations';

import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';

import { 
  Phone, Mail, Calendar, MapPin, Shield, Menu, X, Landmark, FileText, Vote, PlusCircle, HelpCircle, UserCheck, MessageSquare, Search, UserPlus, CreditCard, Award, CheckCircle, Quote, ArrowUp, DollarSign, Bell 
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

const feedContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const feedItemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'register' | 'cabinet' | 'elections' | 'report' | 'chat' | 'admin'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showPortalMainContent, setShowPortalMainContent] = useState(true);
  const [isNationalThemeActive, setIsNationalThemeActive] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- Realtime DB Collections State ---
  const [members, setMembers] = useState<Member[]>([]);
  const [cabinet, setCabinet] = useState<CabinetMember[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const donationTotal = donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const [news, setNews] = useState<NewsAnnouncement[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [embassy, setEmbassy] = useState<EmbassySetting>({});
  const [founderProfile, setFounderProfile] = useState<FounderProfile>({});
  const [elections, setElections] = useState<Election[]>([]);
  const [ads, setAds] = useState<SponsoredAd[]>([]);
  const [meetings, setMeetings] = useState<CabinetMeeting[]>([]);

  // Auth Users
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<User | null>(null);

  // Active Doc Generation
  const [activeDocMember, setActiveDocMember] = useState<Member | null>(null);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [founderModalOpen, setFounderModalOpen] = useState(false);

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
  const [rCardColor, setRCardColor] = useState('emerald');
  const [registerTab, setRegisterTab] = useState<'submit' | 'lookup'>('submit');
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('opc_lang');
    return (stored as Language) || 'en';
  });
  const t = translations[language];
  const [bellMenuOpen, setBellMenuOpen] = useState(false);
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('opc_lang', lang);
  };
  const [lookupValue, setLookupValue] = useState('');
  const [lookupResult, setLookupResult] = useState<Member | null>(null);
  const [lookupAttempted, setLookupAttempted] = useState(false);

  // --- Public Donation Claim Form State ---
  const [pubDonorName, setPubDonorName] = useState('');
  const [pubDonorPhone, setPubDonorPhone] = useState('');
  const [pubDonorAmount, setPubDonorAmount] = useState('');
  const [pubDonorDate, setPubDonorDate] = useState(new Date().toISOString().slice(0, 10));
  const [pubDonorMethod, setPubDonorMethod] = useState<'Bank Transfer' | 'Cash' | 'Mobile Wallet'>('Bank Transfer');
  const [pubDonorNote, setPubDonorNote] = useState('');
  const [pubDonorLoading, setPubDonorLoading] = useState(false);
  const [pubDonorSuccess, setPubDonorSuccess] = useState(false);
  const [pubDonorError, setPubDonorError] = useState('');

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
        const allItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Donation }));
        
        // Filter out any test donations matching Pco/Pso/1470 so they never appear on UI, stats or export logs
        const list = allItems.filter(d => {
          const donorLower = (d.donor || '').trim().toLowerCase();
          const noteLower = (d.note || '').trim().toLowerCase();
          const isTest = donorLower === 'pco' || d.amount === 1470 || noteLower === 'pso' || donorLower.includes('pco') || noteLower.includes('pso');
          return !isTest;
        });
        
        setDonations(list);
        
        // Auto-purge any test donation from the DB (only triggered for authorized admins to prevent guest permission-denied errors)
        if (adminUser) {
          allItems.forEach(d => {
            const donorLower = (d.donor || '').trim().toLowerCase();
            const noteLower = (d.note || '').trim().toLowerCase();
            if (donorLower === 'pco' || d.amount === 1470 || noteLower === 'pso' || donorLower.includes('pco') || noteLower.includes('pso')) {
              console.log('Detected test donation. Auto-purging:', d.id);
              deleteDoc(doc(db, 'donations', d.id)).catch(() => {
                // Silently handle deletion error since items are already safely filtered on frontend list
              });
            }
          });
        }
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

    // Founder setting snapshot
    const unsubscribeFounder = onSnapshot(
      doc(db, 'settings', 'founder'),
      (snapshot) => {
        if (snapshot.exists()) {
          setFounderProfile(snapshot.data() as FounderProfile);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'settings/founder');
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

    // Cabinet Meetings snapshot (available to any authenticated user/cabinet officer)
    let unsubscribeMeetings = () => {};
    if (currentUser) {
      unsubscribeMeetings = onSnapshot(
        query(collection(db, 'cabinet_meetings'), orderBy('createdAt', 'desc')),
        (snapshot) => {
          setMeetings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as CabinetMeeting })));
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'cabinet_meetings');
        }
      );
    }

    return () => {
      unsubscribeMembers();
      unsubscribeCabinet();
      unsubscribeDonations();
      unsubscribeNews();
      unsubscribeIncidents();
      unsubscribeEmbassy();
      unsubscribeFounder();
      unsubscribeElections();
      unsubscribeAds();
      unsubscribeMeetings();
    };
  }, [adminUser, currentUser]);

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
          cardColor: rCardColor,
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
      setRCardColor('emerald');
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

  // Helper for Membership component direct registration
  const handleNewMemberRegister = async (data: Omit<Member, 'id' | 'createdAt' | 'status'>) => {
    try {
      await addDoc(collection(db, 'members'), {
        ...data,
        status: 'pending',
        createdAt: Timestamp.now()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'members');
      throw err;
    }
  };

  // Helper for Incidents component direct filing
  const handleIncidentSubmitDirect = async (data: Omit<IncidentReport, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'incidents'), {
        ...data,
        status: 'pending',
        createdAt: Timestamp.now()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'incidents');
      throw err;
    }
  };

  const handlePublicDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubDonorName.trim() || !pubDonorAmount || !pubDonorPhone.trim()) {
      setPubDonorError('Please complete all required fields (*).');
      return;
    }
    setPubDonorLoading(true);
    setPubDonorSuccess(false);
    setPubDonorError('');
    try {
      try {
        await addDoc(collection(db, 'donations'), {
          donor: pubDonorName.trim(),
          phone: pubDonorPhone.trim(),
          amount: parseFloat(pubDonorAmount),
          date: pubDonorDate,
          method: pubDonorMethod,
          note: pubDonorNote.trim(),
          status: 'pending',
          createdAt: Timestamp.now()
        });
      } catch (fErr) {
        handleFirestoreError(fErr, OperationType.CREATE, 'donations');
      }
      setPubDonorSuccess(true);
      setPubDonorName('');
      setPubDonorPhone('');
      setPubDonorAmount('');
      setPubDonorNote('');
    } catch (err: any) {
      setPubDonorError(err.message || 'Error logging donation claim.');
    } finally {
      setPubDonorLoading(false);
    }
  };

  const downloadDonationReceiptPDF = (d: Donation) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width; // 210 for A4
      const pageHeight = doc.internal.pageSize.height; // 297 for A4

      // Draw background decorations
      doc.setFillColor(27, 77, 62); // Emerald Green
      doc.rect(0, 0, pageWidth, 5, 'F');

      // Watermark
      doc.setFontSize(24);
      doc.setTextColor(242, 245, 243);
      doc.setFont('helvetica', 'bold');
      doc.text("OMAN PAKHTOON COMMUNITY", pageWidth / 2, 110, { align: 'center', angle: 25 });

      // Title header
      doc.setFontSize(18);
      doc.setTextColor(27, 77, 62);
      doc.text("OMAN PAKHTOON COMMUNITY", pageWidth / 2, 25, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(200, 16, 46); // Crimson
      doc.setFont('helvetica', 'bold');
      doc.text("COMMUNITY WELFARE FUND & DONATION RECEIPT", pageWidth / 2, 32, { align: 'center' });

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text("Official Welfare Society, Muscat, Sultanate of Oman | Admin Code: OPC-OM", pageWidth / 2, 38, { align: 'center' });

      // Divider Line
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.5);
      doc.line(15, 45, pageWidth - 15, 45);

      // Details Box Left
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text("DONOR DETAILS / RECEIPT TO:", 15, 55);

      doc.setFontSize(12);
      doc.setTextColor(27, 77, 62);
      doc.setFont('helvetica', 'bold');
      doc.text(d.donor.toUpperCase(), 15, 62);

      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      doc.text(`Mobile Phone No: ${d.phone}`, 15, 68);
      doc.text(`Payment Gateway: ${d.method}`, 15, 73);
      if (d.note) {
        doc.text(`Memo Note: ${d.note}`, 15, 78);
      }

      // Receipt Metadata Right
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text("RECEIPT METADATA:", pageWidth - 15, 55, { align: 'right' });

      const issueYear = new Date(d.createdAt?.seconds ? d.createdAt.seconds * 1000 : Date.now()).getFullYear();
      const receiptNo = d.receiptNumber || `OPC-REC-${issueYear}-${String(d.id).substring(0, 5).toUpperCase()}`;
      doc.setFontSize(11);
      doc.setTextColor(200, 16, 46);
      doc.text(`Receipt Serial: ${receiptNo}`, pageWidth - 15, 62, { align: 'right' });

      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      doc.text(`Payment Date: ${d.date}`, pageWidth - 15, 68, { align: 'right' });
      doc.text(`Approval Status: APPROVED & RECORDED`, pageWidth - 15, 73, { align: 'right' });

      // Table Dues Block
      doc.setFillColor(248, 250, 252);
      doc.rect(15, 88, pageWidth - 30, 10, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, 88, pageWidth - 30, 10, 'S');

      doc.setFontSize(9);
      doc.setTextColor(27, 77, 62);
      doc.setFont('helvetica', 'bold');
      doc.text("TRANSACTION DESCRIPTION", 18, 94);
      doc.text("TOTAL APPROVED DUES (OMR)", pageWidth - 18, 94, { align: 'right' });

      // Table Row
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'normal');
      doc.text("Oman Pakhtoon Community Welfare Fund General Donation Contribution", 18, 110);

      doc.setFont('helvetica', 'bold');
      doc.text(`${Number(d.amount).toFixed(3)} OMR`, pageWidth - 18, 110, { align: 'right' });

      // Divider Row
      doc.line(15, 116, pageWidth - 15, 116);

      // Explainer Footer
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      doc.text("Your donation directly backs Body Repatriation, critical medical care, and asset", 18, 126);
      doc.text("hardship relief programs for Pakhtoons in the Sultanate of Oman.", 18, 131);

      // Calculations summary box
      const calcX = pageWidth - 90;
      doc.setFillColor(241, 245, 249);
      doc.rect(calcX, 138, 75, 20, 'F');
      doc.rect(calcX, 138, 75, 20, 'S');

      doc.setFontSize(9);
      doc.setTextColor(27, 77, 62);
      doc.setFont('helvetica', 'bold');
      doc.text("GRAND CERTIFIED AMOUNT:", calcX + 3, 144);

      doc.setFontSize(11);
      doc.setTextColor(200, 16, 46);
      doc.text(`${Number(d.amount).toFixed(3)} OMR`, pageWidth - 18, 151, { align: 'right' });

      // Official Received Seal
      doc.setDrawColor(4, 120, 87);
      doc.setLineWidth(1);
      doc.rect(15, 138, 55, 20, 'S');
      doc.setFontSize(11);
      doc.setTextColor(4, 120, 87);
      doc.text("RECEIVED", 42, 147, { align: 'center' });
      doc.setFontSize(6);
      doc.text("OPC TREASURY UNIT", 42, 154, { align: 'center' });

      // Signatures
      doc.setLineWidth(0.3);
      doc.line(pageWidth - 85, 195, pageWidth - 25, 195);
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text("IKRAM BACHA", pageWidth - 55, 201, { align: 'center' });
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text("Official Collector / Treasurer", pageWidth - 55, 206, { align: 'center' });

      // Disclaimer Footer Text
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'italic');
      doc.text("This official electronic system-generated receipt is fully certified and issued by OPC.", pageWidth / 2, 235, { align: 'center' });
      doc.text("Support Desk & WhatsApp Contact: +968 99111870", pageWidth / 2, 240, { align: 'center' });

      doc.save(`OPC-Donation-Receipt-${d.id}.pdf`);
    } catch (err: any) {
      alert("Failed to render PDF: " + err.message);
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
  const baseRegisteredMembers = 1379;
  const totalApprovedMembers = baseRegisteredMembers + members.filter(m => m.status === 'approved').length;
  const accumulativeFunds = donations
    .filter(d => d.status === 'approved')
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const accumulativeOnboardingAmount = members
    .filter(m => m.status === 'approved')
    .reduce((sum, m) => sum + (m.feeAmount !== undefined ? Number(m.feeAmount) : 5), 0);
  const reportedIncidentCount = incidents.filter(i => i.status === 'published').length;

  // Notification variables for open elections
  const openElections = elections.filter(el => el.status === 'open');
  const unvotedOpenCount = openElections.filter(el => !userVotedElections[el.id || '']).length;

  return (
    <div className={`min-h-screen flex flex-col font-sans ${isNationalThemeActive ? 'bg-emerald-950/5' : 'bg-amber-50/15'}`}>
      
      {/* 14 August Independence Day Announcement Bar */}
      <NationalDayAnnouncementBar 
        isThemeActive={isNationalThemeActive} 
        onToggleTheme={() => setIsNationalThemeActive(!isNationalThemeActive)} 
      />
      
      {/* Sticky Glassmorphism Header Navbar */}
      <Navbar 
        activeTab={currentPage}
        setActiveTab={(tab) => {
          setCurrentPage(tab as any);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        lang={language}
        setLang={handleLanguageChange}
        isAdmin={!!adminUser}
        onOpenAdminAuth={() => {
          if (adminUser) {
            setCurrentPage('admin');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            handleGoogleSignIn();
          }
        }}
      />


      {/* ----------------- PAGES CONTENT ----------------- */}
      <main className="flex-1">

        {/* HOME PORTAL */}
        {currentPage === 'home' && (
          <Home 
            onNavigate={(tab) => {
              setCurrentPage(tab as any);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            members={members}
            cabinet={cabinet}
            news={news}
            incidents={incidents}
            ads={ads}
            donationTotal={donationTotal}
          />
        )}

















        {/* REGISTER MEMBERSHIP PAGE */}
        {currentPage === 'register' && (
          <Register 
            onRegisterMember={handleNewMemberRegister} 
          />
        )}

        {/* CABINET & MEMBERS DIRECTORY */}
        {currentPage === 'cabinet' && (
          <div className="container mx-auto max-w-7xl px-4 py-8 fade-in">
            <CabinetPanel 
              cabinet={cabinet} 
              members={members} 
              meetings={meetings} 
              currentUser={currentUser} 
              isAdmin={!!adminUser} 
            />
          </div>
        )}

        {/* ELECTIONS AND VOTING PAGE */}
        {currentPage === 'elections' && (
          <ElectionsPage 
            elections={elections} 
            onCastVote={handlePublicVote} 
            userEmail={currentUser?.email}
          />
        )}

        {/* REPORT INCIDENT FORM CLAIM PAGE */}
        {currentPage === 'report' && (
          <Report 
            incidents={incidents}
            onSubmitIncident={handleIncidentSubmitDirect} 
          />
        )}

        {/* AI ASSISTANT CHATBOT */}
        {currentPage === 'chat' && (
          <div className="container mx-auto max-w-4xl px-4 py-8 fade-in">
            <AIAssistant language={language} />
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
            founderProfile={founderProfile}
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

      {/* ----------------- ANIMATED COMMUNITY FOOTER ----------------- */}
      <Footer onNavigate={(tab) => {
        setCurrentPage(tab as any);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }} />

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

      {/* FOUNDER DETAILED BIO PROFILE MODAL */}
      <FounderProfileModal 
        isOpen={founderModalOpen}
        onClose={() => setFounderModalOpen(false)}
        profile={founderProfile}
      />

      {/* Floating Back to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 35, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 35, scale: 0.85 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-amber-500 hover:bg-amber-600 text-emerald-950 shadow-lg border border-amber-400 focus:outline-emerald-800 transition cursor-pointer flex items-center justify-center shadow-amber-500/20"
            title="Back to Top"
            id="floating-scroll-to-top-btn"
          >
            <ArrowUp size={20} className="stroke-[2.5]" />
          </motion.button>
        )}
      </AnimatePresence>

    </div>
  );
}
