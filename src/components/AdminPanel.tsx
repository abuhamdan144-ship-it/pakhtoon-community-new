import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import AnimatedCounter from './AnimatedCounter';
import { User, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  collection, doc, addDoc, updateDoc, deleteDoc, setDoc, runTransaction, arrayUnion, Timestamp, onSnapshot, query, orderBy, limit, getDocs 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError } from '../firebase';
import { seedFirestoreDatabase } from '../utils/seedFirestore';
import { 
  Member, Donation, CabinetMember, NewsAnnouncement, IncidentReport, EmbassySetting, Election, SponsoredAd, CabinetMeeting, FounderProfile, AdminLog, OperationType 
} from '../types';
import { 
  Users, Award, DollarSign, AlertTriangle, Newspaper, Globe, Vote, Disc, LogOut, CheckCircle2, XCircle, Plus, Trash2, Edit2, Share2, FileSpreadsheet, FileDown, X, Search, ArrowUpDown, ArrowUp, ArrowDown, Cloud, Database, Link2, RefreshCw, Paperclip, FolderPlus, ExternalLink, File as FileIcon 
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import {
  connectGoogleWorkspace,
  getCachedToken,
  getConnectedEmail,
  disconnectGoogleWorkspace,
  exportMembersToGoogleSheet,
  exportIncidentsToGoogleSheet,
  exportDonationsToGoogleSheet,
  listOpcWorkspaceFiles,
  uploadBackupToGoogleDrive,
  deleteGoogleDriveFile,
  openGooglePicker,
  DriveFile
} from '../utils/googleWorkspace';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface AdminPanelProps {
  user: User | null;
  members: Member[];
  cabinet: CabinetMember[];
  donations: Donation[];
  incidents: IncidentReport[];
  news: NewsAnnouncement[];
  embassy: EmbassySetting;
  founderProfile?: FounderProfile;
  elections: Election[];
  ads: SponsoredAd[];
  meetings: CabinetMeeting[];
  onViewDocuments: (member: Member) => void;
}

// Helper to convert base64 with auto scaling so any image size works seamlessly
const getBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const src = reader.result as string;
      if (!file.type.startsWith('image/')) {
        return resolve(src);
      }
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        const maxDim = 1200;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(src);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.8));
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    reader.onerror = error => reject(error);
  });
};

export default function AdminPanel({
  user, members, cabinet, donations, incidents, news, embassy, founderProfile, elections, ads, meetings, onViewDocuments
}: AdminPanelProps) {
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'directory' | 'cabinet' | 'donations' | 'incidents' | 'news' | 'embassy' | 'founder' | 'elections' | 'ads' | 'workspace' | 'meetings' | 'logs'>('overview');

  // --- Form States for Admin Add/Edits ---
  
  // Founder form state
  const [fName, setFName] = useState('');
  const [fPosition, setFPosition] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fAddress, setFAddress] = useState('');
  const [fEst, setFEst] = useState('');
  const [fPhoto, setFPhoto] = useState('');
  const [fQuote, setFQuote] = useState('');
  const [fBio1, setFBio1] = useState('');
  const [fBio2, setFBio2] = useState('');
  const [fSuccess, setFSuccess] = useState(false);
  const [founderSaveLoading, setFounderSaveLoading] = useState(false);

  useEffect(() => {
    if (founderProfile) {
      setFName(founderProfile.name || 'Al-Haj Muhammad Amin');
      setFPosition(founderProfile.position || 'President, Pakhtoon Community');
      setFPhone(founderProfile.phone || '+968 99111870');
      setFEmail(founderProfile.email || 'president@pakhtooncommunity.org');
      setFAddress(founderProfile.address || 'Central Headquarters');
      setFEst(founderProfile.est || 'Welfare Board Established in 2018');
      setFPhoto(founderProfile.photo || '');
      setFQuote(founderProfile.quote || 'By remaining disciplined, cooperative, and united, we not only protect our families but construct a legacy that our next generation will represent with utmost pride.');
      setFBio1(founderProfile.bio1 || 'Al-Haj Muhammad Amin is a respected community builder, philanthropist, and civic coordinator. Animated by a profound love for his people and culture, he founded the Pakhtoon Community registry and welfare program as an anchor point for thousands of Pakhtoon community members who have dedicated their efforts to brotherhood and welfare support.');
      setFBio2(founderProfile.bio2 || 'Under his direct personal guidance, the organization has shifted from an informal network into a fully structured, law-abiding diaspora association that handles essential legal support, medical assistance, repatriation files, and cultural integrations with exceptional meticulousness.');
    }
  }, [founderProfile]);
  
  // Memoized data for Monthly Donation Trends
  const donationChartData = useMemo(() => {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const getParsedDate = (val: any) => {
      if (!val) return null;
      if (typeof val.toDate === 'function') {
        return val.toDate();
      }
      if (val.seconds) {
        return new Date(val.seconds * 1000);
      }
      if (val instanceof Date) {
        return val;
      }
      const parsed = new Date(val);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
      return null;
    };

    const groups: { [key: string]: { amount: number; count: number } } = {};

    donations.forEach(d => {
      let dateObj: Date | null = null;
      if (d.date) {
        dateObj = getParsedDate(d.date);
      }
      if (!dateObj && d.createdAt) {
        dateObj = getParsedDate(d.createdAt);
      }
      if (!dateObj) return;

      const year = dateObj.getFullYear();
      const month = dateObj.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;

      if (!groups[key]) {
        groups[key] = { amount: 0, count: 0 };
      }
      
      if (d.status !== 'rejected') {
        groups[key].amount += Number(d.amount) || 0;
        groups[key].count += 1;
      }
    });

    const sortedKeys = Object.keys(groups).sort();

    if (sortedKeys.length === 0) {
      // Return beautiful trend mock/placeholder slots if empty, representing the last 6 months
      const now = new Date();
      const result = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        result.push({
          label,
          'Amount (OMR)': 0,
          'Donation Count': 0
        });
      }
      return result;
    }

    return sortedKeys.map(key => {
      const [year, monthStr] = key.split('-');
      const monthIndex = parseInt(monthStr, 10) - 1;
      const label = `${monthNames[monthIndex]} ${year}`;
      const stats = groups[key];
      return {
        label,
        'Amount (OMR)': Number(stats.amount.toFixed(3)),
        'Donation Count': stats.count
      };
    });
  }, [donations]);
  
  // Cabinet Meetings form state
  const [mId, setMId] = useState('');
  const [mAgenda, setMAgenda] = useState('');
  const [mDescription, setMDescription] = useState('');
  const [mStatus, setMStatus] = useState<'scheduled' | 'active' | 'completed'>('scheduled');
  
  // Cabinet form state
  const [cId, setCId] = useState('');
  const [cName, setCName] = useState('');
  const [cPosition, setCPosition] = useState('Chairman');
  const [cPhone, setCPhone] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhoto, setCPhoto] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

  const handleManualSeed = async () => {
    if (!confirm('This will populate or refresh sample community records (Cabinet, Members, News, Donations, Elections) into Firestore. Proceed?')) return;
    setIsSeeding(true);
    try {
      const res = await seedFirestoreDatabase(true);
      alert(res.message);
    } catch (e: any) {
      alert('Error seeding database: ' + (e.message || String(e)));
    } finally {
      setIsSeeding(false);
    }
  };

  // Donation form state
  const [dDonor, setDDonor] = useState('');
  const [dPhone, setDPhone] = useState('');
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
  const [elEndDate, setElEndDate] = useState('');
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
  const [adVideo, setAdVideo] = useState('');

  // Edit member modal state
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editName, setEditName] = useState('');
  const [editFather, setEditFather] = useState('');
  const [editCnic, setEditCnic] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editOccupation, setEditOccupation] = useState('');
  const [editEmergency, setEditEmergency] = useState('');
  const [editStatus, setEditStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [editMembershipId, setEditMembershipId] = useState('');
  const [editFeeAmount, setEditFeeAmount] = useState('5');
  const [editPaymentMethod, setEditPaymentMethod] = useState('Bank Transfer');
  const [editPaymentReference, setEditPaymentReference] = useState('');
  const [updatingMemberState, setUpdatingMemberState] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberSortField, setMemberSortField] = useState<'name' | 'createdAt' | 'district' | null>(null);
  const [memberSortOrder, setMemberSortOrder] = useState<'asc' | 'desc'>('asc');

  // Member Directory Custom State
  const [dirStatus, setDirStatus] = useState<'all' | 'active' | 'pending' | 'archived'>('all');
  const [dirDistrict, setDirDistrict] = useState<string>('all');
  const [dirRegDate, setDirRegDate] = useState<'all' | '7days' | '30days' | '90days' | 'custom'>('all');
  const [dirSearch, setDirSearch] = useState<string>('');
  const [dirStartDate, setDirStartDate] = useState<string>('');
  const [dirEndDate, setDirEndDate] = useState<string>('');
  const [dirSortBy, setDirSortBy] = useState<'name' | 'createdAt' | 'district' | 'status'>('createdAt');
  const [dirSortOrder, setDirSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  // Daily Registration Trends State
  const [dailyTrendsTimeframe, setDailyTrendsTimeframe] = useState<'7days' | '14days' | '30days' | '90days' | 'all'>('30days');
  const [dailyTrendsStatus, setDailyTrendsStatus] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');

  const [incidentSearchQuery, setIncidentSearchQuery] = useState('');
  const [incidentSortField, setIncidentSortField] = useState<'type' | 'name' | 'date' | 'status' | null>(null);
  const [incidentSortOrder, setIncidentSortOrder] = useState<'asc' | 'desc'>('asc');

  // Incident Documents management state
  const [activeIncidentDocs, setActiveIncidentDocs] = useState<IncidentReport | null>(null);
  const [isConnectingIncidentDrive, setIsConnectingIncidentDrive] = useState(false);
  const [incidentDriveError, setIncidentDriveError] = useState<string | null>(null);

  // Google Workspace Sync States
  const [googleEmail, setGoogleEmail] = useState<string | null>(getConnectedEmail());
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [workspaceSuccess, setWorkspaceSuccess] = useState<string | null>(null);
  const [googleDriveFiles, setGoogleDriveFiles] = useState<DriveFile[]>([]);
  const [recentlyCreatedSheet, setRecentlyCreatedSheet] = useState<string | null>(null);
  const [deleteConfirmationFile, setDeleteConfirmationFile] = useState<DriveFile | null>(null);

  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const email = user.email || '';
    const isAuthorized = email === 'abuhamdan144@gmail.com' || email === 'admin@opc.org' || email === 'admin@opc.com' || email === 'malakabbas47@gmail.com';
    if (!isAuthorized) return;

    const q = query(
      collection(db, 'admin_logs'),
      orderBy('createdAt', 'desc'),
      limit(200)
    );

    let isMounted = true;
    const fetchLogs = async () => {
      try {
        const snapshot = await getDocs(q);
        if (!isMounted) return;
        const fetchedLogs: AdminLog[] = [];
        snapshot.forEach((docSnap) => {
          fetchedLogs.push({
            id: docSnap.id,
            ...docSnap.data()
          } as AdminLog);
        });
        setLogs(fetchedLogs);
      } catch (error) {
        console.warn("Notice fetching admin logs:", error);
        handleFirestoreError(error, OperationType.GET, 'admin_logs');
      } finally {
        if (isMounted) setLogsLoading(false);
      }
    };

    fetchLogs();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const logAdminAction = async (action: string, details: string) => {
    try {
      if (!user) return;
      await addDoc(collection(db, 'admin_logs'), {
        adminEmail: user.email || 'admin@opc.org',
        action,
        details,
        createdAt: Timestamp.now()
      });
    } catch (err) {
      console.error('Error logging admin action:', err);
    }
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setEditName(member.name || '');
    setEditFather(member.father || '');
    setEditCnic(member.cnic || '');
    setEditDistrict(member.district || '');
    setEditPhone(member.phone || '');
    setEditWhatsapp(member.whatsapp || '');
    setEditAddress(member.address || '');
    setEditOccupation(member.occupation || '');
    setEditEmergency(member.emergency || '');
    setEditStatus(member.status || 'pending');
    setEditMembershipId(member.membershipId || '');
    setEditFeeAmount(member.feeAmount?.toString() || '5');
    setEditPaymentMethod(member.paymentMethod || 'Bank Transfer');
    setEditPaymentReference(member.paymentReference || '');
  };

  const handleUpdateMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editingMember.id) return;
    setUpdatingMemberState(true);
    try {
      let finalMembershipId = editMembershipId;
      let extraUpdate: any = {};

      // If status is transitioning to approved and they do not have a membershipId, issue one!
      if (editStatus === 'approved' && (!editingMember.membershipId && !editMembershipId)) {
        const counterRef = doc(db, 'settings', 'counters');
        await runTransaction(db, async (transaction) => {
          const snap = await transaction.get(counterRef);
          const last = snap.exists() ? (snap.data().lastMemberNumber || 0) : 0;
          const next = last + 1;
          finalMembershipId = `OPC-OM-${new Date().getFullYear()}-${String(next).padStart(4, '0')}`;
          transaction.set(counterRef, { lastMemberNumber: next }, { merge: true });
        });
        extraUpdate.approvedAt = Timestamp.now();
      }

      await updateDoc(doc(db, 'members', editingMember.id), {
        name: editName.trim(),
        father: editFather.trim(),
        cnic: editCnic.trim(),
        district: editDistrict.trim(),
        phone: editPhone.trim(),
        whatsapp: editWhatsapp.trim(),
        address: editAddress.trim(),
        occupation: editOccupation.trim(),
        emergency: editEmergency.trim(),
        status: editStatus,
        membershipId: finalMembershipId,
        feeAmount: Number(editFeeAmount) || 5,
        paymentMethod: editPaymentMethod,
        paymentReference: editPaymentReference.trim(),
        ...extraUpdate
      });

      alert('Member profile updated successfully!');
      setEditingMember(null);
    } catch (err: any) {
      alert('Error updating member: ' + err.message);
    } finally {
      setUpdatingMemberState(false);
    }
  };

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    const trimmedEmail = loginEmail.trim();
    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, loginPassword);
    } catch (err: any) {
      // Self-healing fallback: if sign in fails with invalid credentials but they supplied the correct default email/password,
      // try to register them in real-time. This covers cases where the default account creation failed at bootstrap time.
      if (
        (trimmedEmail === 'admin@opc.org' || trimmedEmail === 'admin@opc.com') &&
        loginPassword === 'admin123' &&
        (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password')
      ) {
        try {
          await createUserWithEmailAndPassword(auth, trimmedEmail, 'admin123');
          // Successfully created and automatically signed in by Firebase
          setLoginLoading(false);
          return;
        } catch (createErr: any) {
          if (createErr.code === 'auth/operation-not-allowed') {
            setLoginError('Error (operation-not-allowed): The Email/Password provider is disabled in your Firebase Console. Please click the link below to allow 1-click credential setup.');
            setLoginLoading(false);
            return;
          } else {
            setLoginError(`Admin registration fallback failed: ${createErr.message}`);
            setLoginLoading(false);
            return;
          }
        }
      }
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
      if (email === 'abuhamdan144@gmail.com' || email === 'admin@opc.org' || email === 'admin@opc.com' || email === 'malakabbas47@gmail.com') {
        // Logged in successfully as designated system administrator
      } else {
        // Not a designated administrator, sign out from Auth instance
        await signOut(auth);
        setLoginError('Your Google account is not configured as an administrator. Please sign in with an authorized administrator account like abuhamdan144@gmail.com or malakabbas47@gmail.com.');
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

      await logAdminAction('Approve Membership', `Approved membership for ${member.name} (CNIC: ${member.cnic || '-'}) with issued ID: ${newId}`);
      alert(`Member approved! Issued Membership ID: ${newId}`);
    } catch (err: any) {
      alert('Error approving member: ' + err.message);
    }
  };

  // Re-queue or retry sending registration credentials email
  const handleResendCredentialsEmail = async (member: Member) => {
    if (!member.id) return;
    try {
      await updateDoc(doc(db, 'members', member.id), {
        emailSent: false,
        emailStatus: null,
        emailError: null
      });
      await logAdminAction('Retry Email Notification', `Reset email notification state to retry SMTP delivery for ${member.name} (${member.email || 'N/A'})`);
      alert(`Email dispatch re-queued successfully! The background polling service will attempt SMTP delivery shortly.`);
    } catch (err: any) {
      alert('Error re-queuing email delivery: ' + err.message);
    }
  };

  const handleRejectMember = async (id: string) => {
    if (!confirm('Reject this application?')) return;
    try {
      await updateDoc(doc(db, 'members', id), { status: 'rejected' });
      await logAdminAction('Reject Membership', `Rejected pending membership application (ID: ${id})`);
    } catch (err: any) {
      alert('Error rejecting: ' + err.message);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Permanently delete this application?')) return;
    try {
      await deleteDoc(doc(db, 'members', id));
      await logAdminAction('Delete Membership Record', `Permanently deleted membership application/record (ID: ${id})`);
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
      email: cEmail.trim().toLowerCase(),
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
    setCEmail(cm.email || '');
    setCPhoto(cm.photo || '');
  };

  const handleDeleteCabinet = async (id: string) => {
    if (!confirm('Remove cabinet member?')) return;
    await deleteDoc(doc(db, 'cabinet', id));
  };

  const resetCabinetForm = () => {
    setCId('');
    setCName('');
    setCPosition('Chairman');
    setCPhone('');
    setCEmail('');
    setCPhoto('');
  };

  const handleCabinetPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await getBase64(file);
      setCPhoto(base64);
    }
  };

  // Cabinet Meetings Actions
  const handleMeetingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mAgenda.trim()) {
      alert('Please specify the Meeting Agenda.');
      return;
    }
    const data: Partial<CabinetMeeting> = {
      agenda: mAgenda.trim(),
      description: mDescription.trim(),
      status: mStatus,
    };

    try {
      if (mId) {
        if (mStatus === 'completed') {
          data.completedAt = new Date().toISOString();
        }
        await updateDoc(doc(db, 'cabinet_meetings', mId), data);
        alert('Cabinet meeting updated.');
      } else {
        data.createdAt = new Date().toISOString();
        data.votes = {};
        await addDoc(collection(db, 'cabinet_meetings'), data);
        alert('Cabinet meeting scheduled.');
      }
      resetMeetingForm();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEditMeeting = (mt: CabinetMeeting) => {
    setMId(mt.id || '');
    setMAgenda(mt.agenda);
    setMDescription(mt.description);
    setMStatus(mt.status);
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!confirm('Permanently delete this cabinet meeting and its votes?')) return;
    try {
      await deleteDoc(doc(db, 'cabinet_meetings', id));
      alert('Cabinet meeting deleted.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const resetMeetingForm = () => {
    setMId('');
    setMAgenda('');
    setMDescription('');
    setMStatus('scheduled');
  };

  // Donation Actions
  const handleDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dDonor || !dAmount || !dPhone) {
      alert('Donor Name, Phone and Amount are required.');
      return;
    }
    try {
      const receiptNo = `OPC-REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await addDoc(collection(db, 'donations'), {
        donor: dDonor.trim(),
        phone: dPhone.trim(),
        amount: parseFloat(dAmount),
        date: dDate,
        method: dMethod,
        note: dNote.trim(),
        status: 'approved',
        receiptNumber: receiptNo,
        createdAt: Timestamp.now()
      });
      alert(`Donation registered successfully and Approved under Serial: ${receiptNo}`);
      setDDonor('');
      setDPhone('');
      setDAmount('');
      setDNote('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDonationApproval = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const receiptNo = `OPC-REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await updateDoc(doc(db, 'donations', id), {
        status,
        receiptNumber: status === 'approved' ? receiptNo : null,
        approvedAt: Timestamp.now(),
        approvedBy: user?.email || 'OPC Administrator'
      });
      const dRecord = donations.find(d => d.id === id);
      const donorInfo = dRecord ? `donor: ${dRecord.donor}, amount: OMR ${Number(dRecord.amount).toFixed(3)}` : `id: ${id}`;
      await logAdminAction('Donation Decision', `Updated donation status to ${status.toUpperCase()} (${donorInfo})`);
      alert(`Donation claim status updated to: ${status.toUpperCase()}`);
    } catch (err: any) {
      alert('Error updating donation claim: ' + err.message);
    }
  };

  const handleDeleteDonation = async (id: string) => {
    if (!confirm('Delete donation record?')) return;
    try {
      const dRecord = donations.find(d => d.id === id);
      const donorInfo = dRecord ? `donor: ${dRecord.donor}, amount: OMR ${Number(dRecord.amount).toFixed(3)}` : `id: ${id}`;
      await deleteDoc(doc(db, 'donations', id));
      await logAdminAction('Delete Donation', `Deleted donation ledger record (${donorInfo})`);
    } catch (err: any) {
      alert('Error deleting donation: ' + err.message);
    }
  };

  // Incident reviews
  const handleIncidentStatus = async (id: string, status: 'published' | 'closed') => {
    try {
      await updateDoc(doc(db, 'incidents', id), { status });
      const iRecord = incidents.find(i => i.id === id);
      const incidentInfo = iRecord ? `affected: ${iRecord.name}, type: ${iRecord.type}` : `id: ${id}`;
      await logAdminAction('Update Incident Status', `Changed welfare claim status to ${status.toUpperCase()} (${incidentInfo})`);
    } catch (err: any) {
      alert('Error updating welfare incident status: ' + err.message);
    }
  };

  const handleDeleteIncident = async (id: string) => {
    if (!confirm('Delete incident report?')) return;
    try {
      const iRecord = incidents.find(i => i.id === id);
      const incidentInfo = iRecord ? `affected: ${iRecord.name}, type: ${iRecord.type}` : `id: ${id}`;
      await deleteDoc(doc(db, 'incidents', id));
      await logAdminAction('Delete Incident', `Permanently deleted welfare incident claim (${incidentInfo})`);
    } catch (err: any) {
      alert('Error deleting welfare incident: ' + err.message);
    }
  };

  const handleAttachIncidentDriveFile = async () => {
    setIncidentDriveError(null);
    let token = getCachedToken();
    if (!token) {
      setIsConnectingIncidentDrive(true);
      try {
        const workspaceconn = await connectGoogleWorkspace();
        if (workspaceconn) {
          token = workspaceconn.accessToken;
          setGoogleEmail(workspaceconn.email);
        }
      } catch (err: any) {
        setIncidentDriveError(err.message || 'Failed to authenticate with Google Drive.');
        setIsConnectingIncidentDrive(false);
        return;
      }
      setIsConnectingIncidentDrive(false);
    }

    if (token) {
      openGooglePicker(token, async (file) => {
        try {
          if (activeIncidentDocs && activeIncidentDocs.id) {
            const currentAttachments = activeIncidentDocs.driveAttachments || [];
            if (currentAttachments.some((f) => f.id === file.id)) {
              setIncidentDriveError('This file is already attached.');
              return;
            }
            const updated = [...currentAttachments, file];
            await updateDoc(doc(db, 'incidents', activeIncidentDocs.id), {
              driveAttachments: updated
            });
            setActiveIncidentDocs(prev => prev ? { ...prev, driveAttachments: updated } : null);
          }
        } catch (err: any) {
          setIncidentDriveError(err.message || 'Failed to save attachment metadata to database.');
        }
      });
    } else {
      setIncidentDriveError('Authorization is required to use Google Drive Picker.');
    }
  };

  const handleRemoveIncidentDriveFile = async (fileId: string) => {
    if (!activeIncidentDocs || !activeIncidentDocs.id) return;
    const confirmRemove = window.confirm(
      'Are you sure you want to remove this attached file from the Claim/Incident? This only deletes the association, not the actual file from Google Drive.'
    );
    if (!confirmRemove) return;

    try {
      const currentAttachments = activeIncidentDocs.driveAttachments || [];
      const updated = currentAttachments.filter(f => f.id !== fileId);
      await updateDoc(doc(db, 'incidents', activeIncidentDocs.id), {
        driveAttachments: updated
      });
      setActiveIncidentDocs(prev => prev ? { ...prev, driveAttachments: updated } : null);
    } catch (err: any) {
      setIncidentDriveError(err.message || 'Failed to remove file connection.');
    }
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

  // Save founder profile settings
  const handleFounderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFounderSaveLoading(true);
    setFSuccess(false);
    try {
      const data: FounderProfile = {
        name: fName.trim(),
        position: fPosition.trim(),
        phone: fPhone.trim(),
        email: fEmail.trim(),
        address: fAddress.trim(),
        est: fEst.trim(),
        photo: fPhoto,
        quote: fQuote.trim(),
        bio1: fBio1.trim(),
        bio2: fBio2.trim()
      };
      await setDoc(doc(db, 'settings', 'founder'), data);
      setFSuccess(true);
      setTimeout(() => setFSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFounderSaveLoading(false);
    }
  };

  const handleFounderPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const file = e.target.files[0];
        const b64 = await getBase64(file);
        setFPhoto(b64);
      } catch (err) {
        console.error("Error setting founder portrait image:", err);
      }
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
        createdAt: Timestamp.now(),
        endDate: elEndDate ? elEndDate : null
      });
      setElTitle('');
      setElEndDate('');
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
      image: adImage || '',
      video: adVideo || '',
    };
    if (!adId && !adImage && !adVideo) {
      alert('Please upload a visual slider image banner or an awareness video.');
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
    setAdImage(ad.image || '');
    setAdVideo(ad.video || '');
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
    setAdVideo('');
  };

  const handleAdImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await getBase64(file);
      setAdImage(base64);
    }
  };

  const handleAdVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await getBase64(file);
      setAdVideo(base64);
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
    // Add UTF-8 Byte Order Mark (BOM) to guarantee that Microsoft Excel reads the file with proper encoding and column formatting
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
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

  const exportApprovedMembers = () => {
    const approved = members.filter(m => m.status === 'approved');
    downloadCSVFile(approved.map(m => ({
      ...m,
      createdAt: m.createdAt?.seconds ? new Date(m.createdAt.seconds * 1000).toLocaleDateString() : '',
      approvedAt: m.approvedAt?.seconds ? new Date(m.approvedAt.seconds * 1000).toLocaleDateString() : ''
    })), [
      { key: 'membershipId', label: 'Membership ID' },
      { key: 'name', label: 'Full Name' },
      { key: 'father', label: 'Father Name' },
      { key: 'cnic', label: 'CNIC/Passport' },
      { key: 'district', label: 'District' },
      { key: 'phone', label: 'Phone' },
      { key: 'whatsapp', label: 'WhatsApp' },
      { key: 'address', label: 'Address' },
      { key: 'occupation', label: 'Occupation' },
      { key: 'emergency', label: 'Emergency Contact' },
      { key: 'feeAmount', label: 'Fee Paid (OMR)' },
      { key: 'paymentMethod', label: 'Payment Method' },
      { key: 'paymentReference', label: 'Payment Reference' },
      { key: 'receiptNumber', label: 'Receipt/Card No' },
      { key: 'createdAt', label: 'Applied On' },
      { key: 'approvedAt', label: 'Approved On' }
    ], 'opc-approved-members-log.csv');
  };

  const exportFilteredMembers = () => {
    downloadCSVFile(sortedAllMembers.map(m => ({
      ...m,
      createdAt: m.createdAt?.seconds ? new Date(m.createdAt.seconds * 1000).toLocaleDateString() : '',
      approvedAt: m.approvedAt?.seconds ? new Date(m.approvedAt.seconds * 1000).toLocaleDateString() : ''
    })), [
      { key: 'membershipId', label: 'Membership ID' },
      { key: 'name', label: 'Full Name' },
      { key: 'father', label: 'Father Name' },
      { key: 'cnic', label: 'CNIC/Passport' },
      { key: 'district', label: 'District' },
      { key: 'phone', label: 'Phone' },
      { key: 'whatsapp', label: 'WhatsApp' },
      { key: 'address', label: 'Address' },
      { key: 'occupation', label: 'Occupation' },
      { key: 'status', label: 'Status' },
      { key: 'emergency', label: 'Emergency Contact' },
      { key: 'feeAmount', label: 'Fee Paid (OMR)' },
      { key: 'paymentMethod', label: 'Payment Method' },
      { key: 'paymentReference', label: 'Payment Reference' },
      { key: 'receiptNumber', label: 'Receipt/Card No' },
      { key: 'createdAt', label: 'Applied On' },
      { key: 'approvedAt', label: 'Approved On' }
    ], memberSearchQuery ? `opc-filtered-members-${memberSearchQuery.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv` : 'opc-filtered-members.csv');
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

  const filteredIncidents = incidents.filter(i => {
    const q = incidentSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (i.name || '').toLowerCase().includes(q) ||
      (i.type || '').toLowerCase().includes(q) ||
      (i.description || '').toLowerCase().includes(q) ||
      (i.contact || '').toLowerCase().includes(q) ||
      (i.date || '').toLowerCase().includes(q) ||
      (i.status || '').toLowerCase().includes(q)
    );
  });

  const handleIncidentSort = (field: 'type' | 'name' | 'date' | 'status') => {
    if (incidentSortField === field) {
      setIncidentSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setIncidentSortField(field);
      setIncidentSortOrder('asc');
    }
  };

  const sortedIncidents = [...filteredIncidents].sort((a, b) => {
    if (!incidentSortField) return 0;
    
    // Sort descending by default for date if not configured otherwise
    let valA = (a[incidentSortField] || '').toLowerCase();
    let valB = (b[incidentSortField] || '').toLowerCase();
    
    if (valA < valB) return incidentSortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return incidentSortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const exportIncidents = () => {
    downloadCSVFile(sortedIncidents, [
      { key: 'type', label: 'Type' },
      { key: 'name', label: 'Affected Individual' },
      { key: 'description', label: 'Incident details' },
      { key: 'date', label: 'Incident date' },
      { key: 'contact', label: 'Submitter Phone' },
      { key: 'status', label: 'Status' }
    ], 'opc-welfare-reports.csv');
  };

  const exportIncidentsPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width; // 210 for A4
      const pageHeight = doc.internal.pageSize.height; // 297 for A4
      let posY = 20;

      const checkPageBreak = (needed: number) => {
        if (posY + needed > pageHeight - 20) {
          doc.addPage();
          posY = 20;
          drawMiniHeader();
          return true;
        }
        return false;
      };

      const drawMiniHeader = () => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.text("OPC WELFARE INCIDENT REGISTRY", 14, 10);
        doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - 25, 10);
        doc.setDrawColor(226, 232, 240); // Slate-200
        doc.line(14, 12, pageWidth - 14, 12);
        posY = 18;
      };

      const drawFooter = () => {
        const totalPages = doc.getNumberOfPages();
        for (let j = 1; j <= totalPages; j++) {
          doc.setPage(j);
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7);
          doc.setTextColor(156, 163, 175); // Gray-400
          doc.text(
            "CONFIDENTIAL - Overseas Pakistanis Advisory Council Administrative Terminal", 
            14, 
            pageHeight - 10
          );
          doc.text(
            `Page ${j} of ${totalPages}`, 
            pageWidth - 30, 
            pageHeight - 10
          );
        }
      };

      // 1. Draw Modern Executive Header
      doc.setFillColor(4, 120, 87); // Emerald-700
      doc.rect(14, posY, pageWidth - 28, 4, 'F');
      posY += 10;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(2, 44, 34); // Deep Emerald/Black
      doc.text("OVERSEAS PAKISTANIS ADVISORY COUNCIL", 14, posY);
      posY += 7;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(6, 78, 59); // Emerald-900
      doc.text("Welfare Division & Emergency Response Registry Log", 14, posY);
      posY += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text(`Generated on: ${new Date().toLocaleString()} (Local Time)`, 14, posY);
      posY += 10;

      // Draw horizontal divider rule
      doc.setDrawColor(203, 213, 225); // Slate-300
      doc.line(14, posY, pageWidth - 14, posY);
      posY += 8;

      // 2. Statistics Panel
      checkPageBreak(30);
      doc.setFillColor(248, 250, 252); // Slate-50
      doc.rect(14, posY, pageWidth - 28, 22, 'F');
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.rect(14, posY, pageWidth - 28, 22);

      const totalCount = sortedIncidents.length;
      const deathCount = sortedIncidents.filter(i => i.type === 'death').length;
      const injuryCount = sortedIncidents.filter(i => i.type === 'injury').length;
      const lossCount = sortedIncidents.filter(i => i.type === 'loss').length;
      const activeCount = sortedIncidents.filter(i => i.status !== 'closed').length;
      const closedCount = sortedIncidents.filter(i => i.status === 'closed').length;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105); // Slate-600
      doc.text("TOTAL DISPATCHED CASES", 18, posY + 7);
      doc.text("BY PRIMARY CLASSIFICATION", 84, posY + 7);
      doc.text("RESOLUTION PROGRESS", 152, posY + 7);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(2, 44, 34);
      doc.text(`${totalCount} Incidents Active/Closed`, 18, posY + 15);
      doc.text(`Deaths: ${deathCount} | Injuries: ${injuryCount} | Losses: ${lossCount}`, 84, posY + 15);
      doc.text(`Active/Pending: ${activeCount} | Resolved: ${closedCount}`, 152, posY + 15);

      posY += 32;

      // 3. Grid / Table Title
      checkPageBreak(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(2, 44, 34);
      doc.text(`Detailed Incident Log Snapshot (${totalCount} Records)`, 14, posY);
      posY += 6;

      // Render Table Headers
      doc.setFillColor(2, 44, 34); // Deep Emerald
      doc.rect(14, posY, pageWidth - 28, 8, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("TYPE / CAT", 18, posY + 5.5);
      doc.text("CLAIMANT / INDIVIDUAL", 45, posY + 5.5);
      doc.text("DATE", 110, posY + 5.5);
      doc.text("SUBMITTER PHONE", 137, posY + 5.5);
      doc.text("STATUS", 175, posY + 5.5);

      posY += 8;

      if (sortedIncidents.length === 0) {
        checkPageBreak(20);
        doc.setFillColor(255, 255, 255);
        doc.rect(14, posY, pageWidth - 28, 15, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(14, posY, pageWidth - 28, 15);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text("No active welfare incidents registered matching current filters.", 24, posY + 9);
        posY += 15;
      } else {
        // Render Row Items
        sortedIncidents.forEach((item, index) => {
          // Calculate needed lines for description
          const maxTextWidth = pageWidth - 42; // Width of description line text box
          const wrappedDescription = doc.splitTextToSize(item.description || 'No description provided.', maxTextWidth);
          const blockHeight = 16 + (wrappedDescription.length * 4.5);

          checkPageBreak(blockHeight);

          // Alternating row background shading
          if (index % 2 === 0) {
            doc.setFillColor(255, 255, 255);
          } else {
            doc.setFillColor(248, 250, 252); // Slate-50 alternating row background
          }
          doc.rect(14, posY, pageWidth - 28, blockHeight, 'F');

          // Optional subtle border
          doc.setDrawColor(241, 245, 249);
          doc.line(14, posY + blockHeight, pageWidth - 14, posY + blockHeight);

          // Type badge styling
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          if (item.type === 'death') {
            doc.setTextColor(185, 28, 28); // Dark Red
            doc.text("[DEATH]", 18, posY + 6);
          } else if (item.type === 'injury') {
            doc.setTextColor(194, 65, 12); // Dark Orange
            doc.text("[INJURY]", 18, posY + 6);
          } else {
            doc.setTextColor(29, 78, 216); // Dark Blue
            doc.text("[LOSS]", 18, posY + 6);
          }

          // Row Primary Values
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(15, 23, 42); // slate-900
          doc.text(item.name || 'Anonymous Claimant', 45, posY + 6);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(51, 65, 85); // slate-700
          doc.text(item.date || 'N/A', 110, posY + 6);
          doc.text(item.contact || 'N/A', 137, posY + 6);

          // Status custom badges
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          if (item.status === 'closed') {
            doc.setTextColor(16, 185, 129); // emerald
            doc.text("RESOLVED", 175, posY + 6);
          } else if (item.status === 'published') {
            doc.setTextColor(59, 130, 246); // blue
            doc.text("PUBLISHED", 175, posY + 6);
          } else {
            doc.setTextColor(217, 119, 6); // amber
            doc.text("PENDING", 175, posY + 6);
          }

          // Sub-description details
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7.5);
          doc.setTextColor(71, 85, 105); // slate-600
          doc.text("Details & Relief Coordination Notes:", 18, posY + 11.5);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(71, 85, 105); // slate-600
          
          wrappedDescription.forEach((line: string, lineIdx: number) => {
            doc.text(line, 18, posY + 16 + (lineIdx * 4.5));
          });

          posY += blockHeight;
        });
      }

      // Add actual page numbers retrospectively across all pages
      drawFooter();

      // Trigger Save
      doc.save(`opc-welfare-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err: any) {
      console.error("Failed to generate PDF report:", err);
      alert("Error generating PDF document: " + (err.message || err));
    }
  };

  const exportSingleIncidentPDF = (item: IncidentReport) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width; // 210 for A4
      const pageHeight = doc.internal.pageSize.height; // 297 for A4
      let posY = 20;

      // Header block
      doc.setFillColor(4, 120, 87); // Emerald-700
      doc.rect(14, posY, pageWidth - 28, 5, 'F');
      posY += 12;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(2, 44, 34); // Deep Emerald/Black
      doc.text("OVERSEAS PAKISTANIS ADVISORY COUNCIL", 14, posY);
      posY += 7;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(6, 78, 59); // Emerald-900
      doc.text("Welfare Case Incident & Assistance Briefing", 14, posY);
      posY += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text(`Official Document ID: OPAC-WCR-${item.id ? item.id.slice(0, 8).toUpperCase() : 'INTERNAL'} | Generated: ${new Date().toLocaleString()}`, 14, posY);
      posY += 10;

      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.line(14, posY, pageWidth - 14, posY);
      posY += 10;

      // Case Metadata Cards
      doc.setFillColor(248, 250, 252); // Slate-50
      doc.rect(14, posY, pageWidth - 28, 38, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, posY, pageWidth - 28, 38);

      // Label column 1
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105); // Slate-600
      doc.text("SUBJECT INDIVIDUAL:", 18, posY + 8);
      doc.text("REPORTED INCIDENT TYPE:", 18, posY + 16);
      doc.text("OCCURRENCE DATE:", 18, posY + 24);
      doc.text("CURRENT REGISTRY STATUS:", 18, posY + 32);

      // Values column 1
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42); // Black/Slate-900
      doc.text(item.name || 'N/A', 68, posY + 8);
      
      let valType = '';
      if (item.type === 'death') {
        doc.setTextColor(185, 28, 28);
        valType = "DEATH / REPATRIATION EMERGENCY";
      } else if (item.type === 'injury') {
        doc.setTextColor(194, 65, 12);
        valType = "MEDEVAC / MEDICAL EMERGENCY INJURY";
      } else {
        doc.setTextColor(29, 78, 216);
        valType = "LOSS OF PROPERTY / LEGAL ASSISTANCE CLAIMS";
      }
      doc.text(valType, 68, posY + 16);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(item.date || 'N/A', 68, posY + 24);

      let valStatus = '';
      if (item.status === 'closed') {
        doc.setTextColor(16, 185, 129);
        valStatus = "RESOLVED & ARCHIVED";
      } else if (item.status === 'published') {
        doc.setTextColor(59, 130, 246);
        valStatus = "ACTIVE / ASSISTANCE PUBLISHED";
      } else {
        doc.setTextColor(217, 119, 6);
        valStatus = "PENDING ASSESSMENT QUEUE";
      }
      doc.text(valStatus, 68, posY + 32);

      posY += 48;

      // Contact detail box
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(14, posY, pageWidth - 28, 14, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text("SUBMITTER EMERGENCY CONTACT:", 18, posY + 9);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(item.contact || 'No Submitter Phone Registered', 80, posY + 9);

      posY += 24;

      // Detailed Incident Description Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(2, 44, 34);
      doc.text("Incident Narrative & Administrative Review Brief", 14, posY);
      posY += 5;

      doc.setDrawColor(203, 213, 225); // Slate-300
      doc.line(14, posY, pageWidth - 14, posY);
      posY += 8;

      // Long text description wrapping
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85); // Slate-700
      const maxTextWidth = pageWidth - 28;
      const lines = doc.splitTextToSize(item.description || 'No descriptive entries provided by submitter.', maxTextWidth);
      lines.forEach((line: string) => {
        if (posY + 6 > pageHeight - 30) {
          doc.addPage();
          posY = 20;
        }
        doc.text(line, 14, posY);
        posY += 6;
      });

      posY += 15;

      // Attachments Section
      if (item.driveAttachments && item.driveAttachments.length > 0) {
        if (posY + 30 > pageHeight - 30) {
          doc.addPage();
          posY = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(2, 44, 34);
        doc.text(`Linked Verification Documents (${item.driveAttachments.length})`, 14, posY);
        posY += 5;

        doc.setDrawColor(203, 213, 225); // Slate-300
        doc.line(14, posY, pageWidth - 14, posY);
        posY += 8;

        item.driveAttachments.forEach((att, attIdx) => {
          if (posY + 10 > pageHeight - 30) {
            doc.addPage();
            posY = 20;
          }
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(15, 23, 42);
          doc.text(`${attIdx + 1}. ${att.name}`, 18, posY);
          posY += 4;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(`Link: ${att.url}`, 18, posY);
          posY += 7;
        });
      }

      // Bottom Signature Blocks
      if (posY + 40 > pageHeight) {
        doc.addPage();
        posY = 20;
      } else {
        posY = pageHeight - 45;
      }

      doc.setDrawColor(203, 213, 225);
      doc.line(14, posY, 80, posY);
      doc.line(pageWidth - 80, posY, pageWidth - 14, posY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Administrative Clerk", 14, posY + 5);
      doc.text("Welfare Secretary Sign-off", pageWidth - 80, posY + 5);

      // Page footer on individual briefing
      const totalPages = doc.getNumberOfPages();
      for (let j = 1; j <= totalPages; j++) {
        doc.setPage(j);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(156, 163, 175);
        doc.text("CONFIDENTIAL OFFICE OF THE PAKISTANI ADVISORY COUNCIL", 14, pageHeight - 10);
        doc.text(`Page ${j} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
      }

      doc.save(`opc-welfare-brief-${item.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
    } catch (err: any) {
      console.error("Failed to generate single PDF briefing:", err);
      alert("Error generating PDF: " + (err.message || err));
    }
  };

  // --- GOOGLE WORKSPACE ACTION HANDLERS ---
  const handleConnectWorkspace = async () => {
    setWorkspaceLoading(true);
    setWorkspaceError(null);
    setWorkspaceSuccess(null);
    try {
      const res = await connectGoogleWorkspace();
      if (res) {
        setGoogleEmail(res.email);
        setWorkspaceSuccess(`Successfully authenticated Google Workspace account: ${res.email}`);
        await handleFetchDriveFiles(res.accessToken);
      }
    } catch (err: any) {
      setWorkspaceError(err.message || 'Failed to authenticate Google Workspace session.');
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const handleDisconnectWorkspace = () => {
    disconnectGoogleWorkspace();
    setGoogleEmail(null);
    setGoogleDriveFiles([]);
    setWorkspaceSuccess('Successfully logged out of Google Workspace account.');
    setWorkspaceError(null);
  };

  const handleFetchDriveFiles = async (tokenOverride?: string) => {
    const token = tokenOverride || getCachedToken();
    if (!token) {
      setWorkspaceError('No active Google session found. Please connect your Workspace account.');
      return;
    }
    setWorkspaceLoading(true);
    try {
      const files = await listOpcWorkspaceFiles(token);
      setGoogleDriveFiles(files);
    } catch (err: any) {
      setWorkspaceError(err.message || 'Failed to retrieve list of files from Google Drive.');
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const handleCreateMembersSheet = async () => {
    const token = getCachedToken();
    if (!token) {
      setWorkspaceError('Please connect to Google Workspace first.');
      return;
    }
    setWorkspaceLoading(true);
    setWorkspaceError(null);
    setWorkspaceSuccess(null);
    try {
      const url = await exportMembersToGoogleSheet(token, members);
      setRecentlyCreatedSheet(url);
      setWorkspaceSuccess('OPC Member Registry successfully exported directly into your Google Sheets!');
      await handleFetchDriveFiles(token);
    } catch (err: any) {
      setWorkspaceError(err.message || 'Failed to export members to Google Sheet.');
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const handleCreateIncidentsSheet = async () => {
    const token = getCachedToken();
    if (!token) {
      setWorkspaceError('Please connect to Google Workspace first.');
      return;
    }
    setWorkspaceLoading(true);
    setWorkspaceError(null);
    setWorkspaceSuccess(null);
    try {
      const url = await exportIncidentsToGoogleSheet(token, incidents);
      setRecentlyCreatedSheet(url);
      setWorkspaceSuccess('OPC Welfare Claims Log successfully exported directly into your Google Sheets!');
      await handleFetchDriveFiles(token);
    } catch (err: any) {
      setWorkspaceError(err.message || 'Failed to export claims to Google Sheet.');
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const handleCreateDonationsSheet = async () => {
    const token = getCachedToken();
    if (!token) {
      setWorkspaceError('Please connect to Google Workspace first.');
      return;
    }
    setWorkspaceLoading(true);
    setWorkspaceError(null);
    setWorkspaceSuccess(null);
    try {
      const url = await exportDonationsToGoogleSheet(token, donations);
      setRecentlyCreatedSheet(url);
      setWorkspaceSuccess('OPC Donations log successfully exported directly into your Google Sheets!');
      await handleFetchDriveFiles(token);
    } catch (err: any) {
      setWorkspaceError(err.message || 'Failed to export donations to Google Sheet.');
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const handleUploadSystemRestorePoint = async () => {
    const token = getCachedToken();
    if (!token) {
      setWorkspaceError('Please connect to Google Workspace first.');
      return;
    }
    setWorkspaceLoading(true);
    setWorkspaceError(null);
    setWorkspaceSuccess(null);
    try {
      const backupFilename = `OPC_Full_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      const payload = {
        meta: {
          generatedAt: new Date().toISOString(),
          opcSystem: 'Pakhtoon Community Executive Panel',
          operator: user?.email || 'admin'
        },
        members,
        donations,
        incidents,
        cabinet,
        news,
        ads
      };
      const fileId = await uploadBackupToGoogleDrive(token, backupFilename, payload);
      setWorkspaceSuccess(`Full OPC Database Snapshot with ${members.length} members & ${donations.length} records successfully uploaded onto your Google Drive! File ID: ${fileId}`);
      await handleFetchDriveFiles(token);
    } catch (err: any) {
      setWorkspaceError(err.message || 'Failed to upload full system restore snapshot to Google Drive.');
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const handleDeleteDriveFileExecution = async () => {
    if (!deleteConfirmationFile) return;
    const token = getCachedToken();
    if (!token) return;
    
    setWorkspaceLoading(true);
    setWorkspaceError(null);
    setWorkspaceSuccess(null);
    const targetId = deleteConfirmationFile.id;
    const targetName = deleteConfirmationFile.name;
    setDeleteConfirmationFile(null);
    
    try {
      await deleteGoogleDriveFile(token, targetId);
      setWorkspaceSuccess(`Successfully deleted Google Drive backup file: "${targetName}"`);
      await handleFetchDriveFiles(token);
    } catch (err: any) {
      setWorkspaceError(err.message || 'Failed to delete file from Google Drive.');
    } finally {
      setWorkspaceLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'workspace') {
      const email = getConnectedEmail();
      const token = getCachedToken();
      if (email && token) {
        setGoogleEmail(email);
        handleFetchDriveFiles(token);
      }
    }
  }, [activeTab]);

  const totalDonations = donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const totalAdRevenue = ads.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const pendingMembers = members.filter(m => m.status === 'pending');
  const approvedMembers = members.filter(m => m.status === 'approved');

  const parseMemberDate = (val: any) => {
    if (!val) return null;
    if (typeof val.toDate === 'function') return val.toDate();
    if (val.seconds) return new Date(val.seconds * 1000);
    if (val instanceof Date) return val;
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const overduePendingCount = useMemo(() => {
    return pendingMembers.filter(m => {
      const d = parseMemberDate(m.createdAt);
      if (!d) return false;
      const hours = (Date.now() - d.getTime()) / (1000 * 60 * 60);
      return hours > 48;
    }).length;
  }, [pendingMembers]);

  const filteredPending = pendingMembers.filter(m => {
    const q = memberSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (m.name || '').toLowerCase().includes(q) ||
      (m.phone || '').toLowerCase().includes(q) ||
      (m.father || '').toLowerCase().includes(q) ||
      (m.membershipId || '').toLowerCase().includes(q) ||
      (m.cnic || '').toLowerCase().includes(q) ||
      (m.district || '').toLowerCase().includes(q) ||
      (m.address || '').toLowerCase().includes(q) ||
      (m.occupation || '').toLowerCase().includes(q)
    );
  });

  const filteredAllMembers = members.filter(m => {
    const q = memberSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (m.name || '').toLowerCase().includes(q) ||
      (m.phone || '').toLowerCase().includes(q) ||
      (m.father || '').toLowerCase().includes(q) ||
      (m.membershipId || '').toLowerCase().includes(q) ||
      (m.cnic || '').toLowerCase().includes(q) ||
      (m.district || '').toLowerCase().includes(q) ||
      (m.address || '').toLowerCase().includes(q) ||
      (m.occupation || '').toLowerCase().includes(q)
    );
  });

  const handleSort = (field: 'name' | 'createdAt' | 'district') => {
    if (memberSortField === field) {
      setMemberSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setMemberSortField(field);
      setMemberSortOrder('asc');
    }
  };

  const sortMembersArray = (arr: Member[]) => {
    if (!memberSortField) return arr;
    return [...arr].sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      if (memberSortField === 'name') {
        valA = (a.name || '').toLowerCase();
        valB = (b.name || '').toLowerCase();
      } else if (memberSortField === 'district') {
        valA = (a.district || '').toLowerCase();
        valB = (b.district || '').toLowerCase();
      } else if (memberSortField === 'createdAt') {
        valA = a.createdAt?.seconds || 0;
        valB = b.createdAt?.seconds || 0;
      }

      if (valA < valB) return memberSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return memberSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query || !query.trim() || !text) return <>{text || ''}</>;
    const q = query.trim();
    const escapedQuery = q.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, index) => 
          part.toLowerCase() === q.toLowerCase() ? (
            <mark key={index} className="bg-amber-200 text-emerald-950 font-bold px-0.5 rounded-sm shadow-xs animate-pulse">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const sortedPending = sortMembersArray(filteredPending);
  const sortedAllMembers = sortMembersArray(filteredAllMembers);

  const dailyRegistrationTrendsData = useMemo(() => {
    const getParsedDate = (val: any) => {
      if (!val) return null;
      if (typeof val.toDate === 'function') {
        return val.toDate();
      }
      if (val.seconds) {
        return new Date(val.seconds * 1000);
      }
      if (val instanceof Date) {
        return val;
      }
      const parsed = new Date(val);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
      return null;
    };

    const now = new Date();
    let cutoffDate: Date | null = null;
    if (dailyTrendsTimeframe === '7days') {
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (dailyTrendsTimeframe === '14days') {
      cutoffDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    } else if (dailyTrendsTimeframe === '30days') {
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (dailyTrendsTimeframe === '90days') {
      cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }

    const dayMap: { [key: string]: { approved: number; pending: number; rejected: number; total: number } } = {};

    // Generate keys for all days in range to ensure a continuous line chart with zero counts
    if (cutoffDate) {
      const temp = new Date(cutoffDate.getTime());
      while (temp <= now) {
        const y = temp.getFullYear();
        const m = String(temp.getMonth() + 1).padStart(2, '0');
        const d = String(temp.getDate()).padStart(2, '0');
        dayMap[`${y}-${m}-${d}`] = { approved: 0, pending: 0, rejected: 0, total: 0 };
        temp.setDate(temp.getDate() + 1);
      }
    }

    members.forEach(m => {
      const d = getParsedDate(m.createdAt);
      if (!d) return;
      if (cutoffDate && d < cutoffDate) return;
      if (d > now) return; // avoid future anomalies

      const y = d.getFullYear();
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      const key = `${y}-${monthStr}-${dayStr}`;

      if (!dayMap[key]) {
        dayMap[key] = { approved: 0, pending: 0, rejected: 0, total: 0 };
      }

      const status = m.status || 'pending';
      if (status === 'approved') {
        dayMap[key].approved++;
      } else if (status === 'rejected') {
        dayMap[key].rejected++;
      } else {
        dayMap[key].pending++;
      }
      dayMap[key].total++;
    });

    const sortedKeys = Object.keys(dayMap).sort();
    return sortedKeys.map(key => {
      const parts = key.split('-');
      const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const label = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const stats = dayMap[key];
      return {
        key,
        label,
        'Daily Registrations': stats.total,
        'Approved': stats.approved,
        'Pending': stats.pending,
        'Archived/Rejected': stats.rejected,
      };
    });
  }, [members, dailyTrendsTimeframe]);

  // Dynamic lists, filters and sorting for Admin Member Directory Interface
  const uniqueDistricts = useMemo(() => {
    const set = new Set<string>();
    members.forEach(m => {
      if (m.district && m.district.trim()) {
        set.add(m.district.trim());
      }
    });
    return Array.from(set).sort();
  }, [members]);

  const filteredDirectoryMembers = useMemo(() => {
    const getParsedDateLocal = (val: any) => {
      if (!val) return null;
      if (typeof val.toDate === 'function') return val.toDate();
      if (val.seconds) return new Date(val.seconds * 1000);
      if (val instanceof Date) return val;
      const parsed = new Date(val);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    return members.filter(m => {
      // 1. Status Filter
      if (dirStatus !== 'all') {
        const mappedStatus = dirStatus === 'active' ? 'approved' : dirStatus === 'archived' ? 'rejected' : 'pending';
        if (m.status !== mappedStatus) {
          return false;
        }
      }

      // 2. District Filter
      if (dirDistrict !== 'all' && m.district?.trim().toLowerCase() !== dirDistrict.trim().toLowerCase()) {
        return false;
      }

      // 3. Search Query Check
      if (dirSearch.trim()) {
        const q = dirSearch.toLowerCase().trim();
        const matches = (
          (m.name || '').toLowerCase().includes(q) ||
          (m.phone || '').toLowerCase().includes(q) ||
          (m.father || '').toLowerCase().includes(q) ||
          (m.membershipId || '').toLowerCase().includes(q) ||
          (m.cnic || '').toLowerCase().includes(q) ||
          (m.district || '').toLowerCase().includes(q) ||
          (m.address || '').toLowerCase().includes(q) ||
          (m.occupation || '').toLowerCase().includes(q)
        );
        if (!matches) return false;
      }

      // 4. Registration Date Range Filter
      if (dirRegDate !== 'all') {
        const regDateObj = getParsedDateLocal(m.createdAt);
        if (!regDateObj) return false;

        const now = new Date();
        if (dirRegDate === '7days') {
          const limit = new Date();
          limit.setDate(now.getDate() - 7);
          if (regDateObj < limit) return false;
        } else if (dirRegDate === '30days') {
          const limit = new Date();
          limit.setDate(now.getDate() - 30);
          if (regDateObj < limit) return false;
        } else if (dirRegDate === '90days') {
          const limit = new Date();
          limit.setDate(now.getDate() - 90);
          if (regDateObj < limit) return false;
        } else if (dirRegDate === 'custom') {
          if (dirStartDate) {
            const start = new Date(dirStartDate);
            start.setHours(0, 0, 0, 0);
            if (regDateObj < start) return false;
          }
          if (dirEndDate) {
            const end = new Date(dirEndDate);
            end.setHours(23, 59, 59, 999);
            if (regDateObj > end) return false;
          }
        }
      }

      return true;
    });
  }, [members, dirStatus, dirDistrict, dirSearch, dirRegDate, dirStartDate, dirEndDate]);

  const sortedDirectoryMembers = useMemo(() => {
    const getParsedDateLocal = (val: any) => {
      if (!val) return null;
      if (typeof val.toDate === 'function') return val.toDate();
      if (val.seconds) return new Date(val.seconds * 1000);
      if (val instanceof Date) return val;
      const parsed = new Date(val);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    return [...filteredDirectoryMembers].sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      if (dirSortBy === 'name') {
        valA = (a.name || '').toLowerCase();
        valB = (b.name || '').toLowerCase();
      } else if (dirSortBy === 'district') {
        valA = (a.district || '').toLowerCase();
        valB = (b.district || '').toLowerCase();
      } else if (dirSortBy === 'status') {
        valA = (a.status || '').toLowerCase();
        valB = (b.status || '').toLowerCase();
      } else if (dirSortBy === 'createdAt') {
        valA = getParsedDateLocal(a.createdAt)?.getTime() || 0;
        valB = getParsedDateLocal(b.createdAt)?.getTime() || 0;
      }

      if (valA < valB) return dirSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return dirSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredDirectoryMembers, dirSortBy, dirSortOrder]);

  const exportDirectoryMembers = () => {
    const headers = [
      'Membership ID', 'Status', 'Full Name', "Father's Name", 'CNIC/Passport',
      'Phone', 'WhatsApp', 'District', 'Address', 'Occupation',
      'Emergency Contact', 'Registration Date', 'Approved Date',
      'Payment Method', 'Payment Reference', 'Receipt Number'
    ];

    const formatRowDate = (val: any) => {
      if (!val) return '';
      if (typeof val.toDate === 'function') return val.toDate().toLocaleString();
      if (val.seconds) return new Date(val.seconds * 1000).toLocaleString();
      return new Date(val).toLocaleString();
    };

    const rows = sortedDirectoryMembers.map(m => [
      m.membershipId || '',
      m.status || '',
      m.name || '',
      m.father || '',
      m.cnic || '',
      m.phone || '',
      m.whatsapp || '',
      m.district || '',
      m.address || '',
      m.occupation || '',
      m.emergency || '',
      formatRowDate(m.createdAt),
      formatRowDate(m.approvedAt),
      m.feeAmount || 0,
      m.paymentMethod || '',
      m.paymentReference || '',
      m.receiptNumber || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const statusPart = dirStatus !== 'all' ? `-${dirStatus}` : '';
    const distPart = dirDistrict !== 'all' ? `-${dirDistrict.replace(/\s+/g, '_')}` : '';
    const datePart = dirRegDate !== 'all' ? `-${dirRegDate}` : '';
    link.setAttribute('download', `opc-directory-export${statusPart}${distPart}${datePart}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSortIndicator = (field: 'name' | 'createdAt' | 'district') => {
    if (memberSortField !== field) {
      return <ArrowUpDown size={12} className="text-slate-400 opacity-60 inline-block align-middle ml-1" />;
    }
    return memberSortOrder === 'asc' ? (
      <ArrowUp size={12} className="text-emerald-700 font-bold inline-block align-middle ml-1" />
    ) : (
      <ArrowDown size={12} className="text-emerald-700 font-bold inline-block align-middle ml-1" />
    );
  };

  const renderIncidentSortIndicator = (field: 'type' | 'name' | 'date' | 'status') => {
    if (incidentSortField !== field) {
      return <ArrowUpDown size={12} className="text-slate-400 opacity-60 inline-block align-middle ml-1" />;
    }
    return incidentSortOrder === 'asc' ? (
      <ArrowUp size={12} className="text-emerald-700 font-bold inline-block align-middle ml-1" />
    ) : (
      <ArrowDown size={12} className="text-emerald-700 font-bold inline-block align-middle ml-1" />
    );
  };

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
            Email: <strong className="text-emerald-800">admin@opc.com</strong><br />
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
          { id: 'directory', label: 'Member Directory', icon: Search },
          { id: 'cabinet', label: 'Cabinet', icon: Award },
          { id: 'incidents', label: 'Welfare Claims', icon: AlertTriangle },
          { id: 'news', label: 'Announcements', icon: Newspaper },
          { id: 'embassy', label: 'Consulate & Liaison', icon: LocationIcon },
          { id: 'founder', label: 'Founder Profile Settings', icon: Award },
          { id: 'elections', label: 'Elections & Polls', icon: Vote },
          { id: 'ads', label: 'Sponsor Ads', icon: Disc },
          { id: 'workspace', label: 'Google Sync Hub', icon: Cloud },
          { id: 'meetings', label: 'Cabinet Assemblies', icon: Award },
          { id: 'logs', label: 'Activity Logs', icon: FileSpreadsheet },
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
              <div>
                <h3 className="text-xl font-bold font-serif text-emerald-950">Community Snapshot</h3>
                <p className="text-xs text-slate-500">Live analytics, member metrics and cloud database controls</p>
              </div>
              <button
                type="button"
                onClick={handleManualSeed}
                disabled={isSeeding}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                <Database size={15} className={isSeeding ? 'animate-spin' : ''} />
                {isSeeding ? 'Seeding Firestore...' : 'Seed Sample Data into Firestore'}
              </button>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="bg-slate-50 border border-slate-200 p-4 rounded-lg"
              >
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Approved Members</p>
                <p className="text-3xl font-serif font-bold text-emerald-900 mt-1">
                  <AnimatedCounter value={approvedMembers.length} />
                </p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-slate-50 border border-slate-200 p-4 rounded-lg"
              >
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Applications</p>
                <p className="text-3xl font-serif font-bold text-amber-600 mt-1">
                  <AnimatedCounter value={pendingMembers.length} />
                </p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="bg-slate-50 border border-slate-200 p-4 rounded-lg"
              >
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registered Districts</p>
                <p className="text-3xl font-serif font-bold text-emerald-900 mt-1">
                  <AnimatedCounter value={11} />
                </p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-slate-50 border border-slate-200 p-4 rounded-lg"
              >
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Welfare Logs</p>
                <p className="text-3xl font-serif font-bold text-blue-900 mt-1">
                  <AnimatedCounter value={incidents.filter(i => i.status !== 'closed').length} />
                </p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="bg-slate-50 border border-slate-200 p-4 rounded-lg"
              >
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cabinet Members</p>
                <p className="text-3xl font-serif font-bold text-teal-900 mt-1">
                  <AnimatedCounter value={cabinet.length} />
                </p>
              </motion.div>
            </div>

            {/* MEMBERSHIP PROCESSING STATUS CHARTS */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 md:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                    <Users size={16} className="text-emerald-800" /> Membership Operations Insights
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">Real-time status tracking, processing efficiency, and enrollment backlogs across districts</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-850">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Feed
                  </span>
                </div>
              </div>

              {members.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-medium">
                  <Users size={32} className="mx-auto mb-2 text-slate-300 animate-bounce" />
                  No member profiles loaded in the database yet. New sign-ups will show up here.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Status Composition Pie Chart */}
                  <div className="lg:col-span-5 bg-white border border-slate-200 p-4 md:p-5 rounded-xl flex flex-col justify-between">
                    <div>
                      <h5 className="font-bold text-slate-800 text-sm">Processing Queue Status</h5>
                      <p className="text-[11px] text-slate-400">Distribution of pending, approved and rejected memberships</p>
                    </div>

                    <div className="h-64 relative flex items-center justify-center my-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Approved', value: approvedMembers.length, color: '#047857' },
                              { name: 'Pending', value: pendingMembers.length, color: '#d97706' },
                              { name: 'Rejected', value: members.filter(m => m.status === 'rejected').length, color: '#ef4444' }
                            ].filter(item => item.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={85}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {[
                              { name: 'Approved', value: approvedMembers.length, color: '#047857' },
                              { name: 'Pending', value: pendingMembers.length, color: '#d97706' },
                              { name: 'Rejected', value: members.filter(m => m.status === 'rejected').length, color: '#ef4444' }
                            ].filter(item => item.value > 0).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              background: '#1e293b', 
                              border: 'none', 
                              borderRadius: '8px', 
                              color: '#fff',
                              fontSize: '11px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      {/* Doughnut Middle Stats Overlay */}
                      <div className="absolute text-center flex flex-col justify-center items-center">
                        <p className="text-3xl font-serif font-bold text-slate-800 leading-none">
                          {members.length}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-1">
                          Total Profiles
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 border-t border-slate-100 pt-3">
                      {[
                        { name: 'Approved Members', count: approvedMembers.length, color: 'bg-emerald-700', text: 'text-emerald-700', percentage: ((approvedMembers.length / (members.length || 1)) * 100).toFixed(0) },
                        { name: 'Applications Pending', count: pendingMembers.length, color: 'bg-amber-600', text: 'text-amber-600', percentage: ((pendingMembers.length / (members.length || 1)) * 100).toFixed(0) },
                        { name: 'Rejected Entries', count: members.filter(m => m.status === 'rejected').length, color: 'bg-red-500', text: 'text-red-500', percentage: ((members.filter(m => m.status === 'rejected').length / (members.length || 1)) * 100).toFixed(0) }
                      ].map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                            <span className="font-semibold text-slate-700">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-medium">({item.percentage}%)</span>
                            <span className={`font-bold ${item.text}`}>{item.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* District Breakdown Stacked Bar Chart */}
                  <div className="lg:col-span-7 bg-white border border-slate-200 p-4 md:p-5 rounded-xl flex flex-col justify-between">
                    <div>
                      <h5 className="font-bold text-slate-800 text-sm">Enrollment Heatmap by District</h5>
                      <p className="text-[11px] text-slate-400">Comparative density of approved and pending memberships across high-participation areas</p>
                    </div>

                    <div className="h-64 mt-4 mb-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={(() => {
                            const districtMap: { [key: string]: { approved: number; pending: number; rejected: number; total: number } } = {};
                            members.forEach(m => {
                              const dist = m.district || 'Other';
                              if (!districtMap[dist]) {
                                districtMap[dist] = { approved: 0, pending: 0, rejected: 0, total: 0 };
                              }
                              districtMap[dist][m.status]++;
                              districtMap[dist].total++;
                            });
                            return Object.entries(districtMap)
                              .map(([name, stats]) => ({
                                name,
                                Approved: stats.approved,
                                Pending: stats.pending,
                                Rejected: stats.rejected,
                                Total: stats.total
                              }))
                              .sort((a, b) => b.Total - a.Total)
                              .slice(0, 6);
                          })()}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="name" 
                            stroke="#64748b" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                          />
                          <YAxis 
                            stroke="#64748b" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                            allowDecimals={false}
                          />
                          <Tooltip
                            contentStyle={{
                              background: '#1e293b',
                              border: 'none',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '11px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                          />
                          <Legend 
                            verticalAlign="top" 
                            height={32} 
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                          />
                          <Bar dataKey="Approved" stackId="status" fill="#047857" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="Pending" stackId="status" fill="#d97706" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="text-[10px] text-slate-400 mt-2 flex justify-between bg-slate-50 p-2 rounded-lg leading-relaxed border border-slate-100">
                      <span>💡 <strong>Tip for Administrators:</strong> Click on &quot;Member Queue&quot; tab above to start assessing the pending applicants.</span>
                    </div>
                  </div>

                  {/* Monthly Sign-ups & Cumulative Growth Premium Chart */}
                  <div className="lg:col-span-12 bg-white border border-slate-200 p-4 md:p-5 rounded-xl flex flex-col justify-between">
                    <div>
                      <h5 className="font-bold text-slate-800 text-sm">Monthly Registry Growth & Enrollment Trends</h5>
                      <p className="text-[11px] text-slate-400">Monthly new registrations (left axis) coupled with overall multi-month cumulative volume (right axis)</p>
                    </div>

                    <div className="h-72 mt-5 mb-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={(() => {
                            const monthNames = [
                              'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                            ];
                            const groups: { [key: string]: { approved: number; pending: number; total: number } } = {};
                            const getParsedDate = (val: any) => {
                              if (!val) return null;
                              if (typeof val.toDate === 'function') {
                                return val.toDate();
                              }
                              if (val.seconds) {
                                return new Date(val.seconds * 1000);
                              }
                              if (val instanceof Date) {
                                return val;
                              }
                              const parsed = new Date(val);
                              if (!isNaN(parsed.getTime())) {
                                return parsed;
                              }
                              return null;
                            };

                            members.forEach(m => {
                              const d = getParsedDate(m.createdAt);
                              if (!d) return;
                              const year = d.getFullYear();
                              const month = d.getMonth();
                              const key = `${year}-${String(month + 1).padStart(2, '0')}`;
                              if (!groups[key]) {
                                groups[key] = { approved: 0, pending: 0, total: 0 };
                              }
                              groups[key][m.status === 'approved' ? 'approved' : 'pending']++;
                              groups[key].total++;
                            });

                            const sortedKeys = Object.keys(groups).sort();
                            if (sortedKeys.length === 0) {
                              const now = new Date();
                              const result = [];
                              for (let i = 5; i >= 0; i--) {
                                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                                const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
                                result.push({ label, 'New Applicants': 0, 'Cumulative Volume': 0 });
                              }
                              return result;
                            }

                            let cumulativeValue = 0;
                            return sortedKeys.map(key => {
                              const [year, monthStr] = key.split('-');
                              const monthIndex = parseInt(monthStr, 10) - 1;
                              const label = `${monthNames[monthIndex]} ${year}`;
                              const stats = groups[key];
                              cumulativeValue += stats.total;
                              return {
                                label,
                                'New Applicants': stats.total,
                                'Approved Profiles': stats.approved,
                                'Cumulative Volume': cumulativeValue
                              };
                            });
                          })()}
                          margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
                        >
                          <defs>
                            <linearGradient id="colorApplicants" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#047857" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#047857" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="label" 
                            stroke="#64748b" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                          />
                          <YAxis 
                            yAxisId="left"
                            stroke="#047857" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                            allowDecimals={false}
                          />
                          <YAxis 
                            yAxisId="right"
                            orientation="right"
                            stroke="#d97706" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                            allowDecimals={false}
                          />
                          <Tooltip
                            contentStyle={{
                              background: '#1e293b',
                              border: 'none',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '11px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                          />
                          <Legend 
                            verticalAlign="top" 
                            height={36} 
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                          />
                          <Area 
                            yAxisId="left"
                            type="monotone" 
                            dataKey="New Applicants" 
                            stroke="#047857" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorApplicants)" 
                          />
                          <Area 
                            yAxisId="left"
                            type="monotone" 
                            dataKey="Approved Profiles" 
                            stroke="#10b981" 
                            strokeWidth={1.5}
                            strokeDasharray="4 4"
                            fillOpacity={0} 
                          />
                          <Line 
                            yAxisId="right"
                            type="monotone" 
                            dataKey="Cumulative Volume" 
                            stroke="#d97706" 
                            strokeWidth={2.5}
                            activeDot={{ r: 6 }}
                            dot={{ r: 3 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="text-[10px] text-slate-400 mt-2 flex justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span>💡 <strong>Registry Fact:</strong> Cumulative Volume displays overall community membership registrations gathered over time.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* DAILY MEMBER REGISTRATION TRENDS LINE CHART */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 md:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                    <Users size={16} className="text-emerald-800" /> Daily Registration Velocity
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track daily new member signups and trace temporal conversion density
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 mr-1">Timeframe:</span>
                  {[
                    { id: '7days', label: '7 Days' },
                    { id: '14days', label: '14 Days' },
                    { id: '30days', label: '30 Days' },
                    { id: '90days', label: '90 Days' },
                    { id: 'all', label: 'All Time' }
                  ].map(tf => (
                    <button
                      key={tf.id}
                      type="button"
                      onClick={() => setDailyTrendsTimeframe(tf.id as any)}
                      className={`px-2.5 py-1 rounded text-xs font-bold uppercase transition duration-150 cursor-pointer ${
                        dailyTrendsTimeframe === tf.id
                          ? 'bg-emerald-800 text-white shadow-sm'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>

              {members.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-medium">
                  <Users size={32} className="mx-auto mb-2 text-slate-300 animate-bounce" />
                  No member profiles loaded in the database yet.
                </div>
              ) : (
                <div className="bg-white border border-slate-200 p-4 md:p-5 rounded-xl">
                  <div className="h-72 my-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={dailyRegistrationTrendsData}
                        margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="label" 
                          stroke="#64748b" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <YAxis 
                          stroke="#047857" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#1e293b',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '11px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          }}
                        />
                        <Legend 
                          verticalAlign="top" 
                          height={36} 
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Daily Registrations"
                          stroke="#047857"
                          strokeWidth={2.5}
                          activeDot={{ r: 6 }}
                          dot={{ r: 3 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Approved"
                          stroke="#10b981"
                          strokeWidth={1.5}
                          strokeDasharray="3 3"
                          dot={{ r: 2 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Pending"
                          stroke="#d97706"
                          strokeWidth={1.5}
                          strokeDasharray="3 3"
                          dot={{ r: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-3 flex justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span>📈 <strong>Registration Density State:</strong> Visualizes the daily enrollment rate. Adjust the timeframe indicators in the top right to focus on shorter or longer periods.</span>
                  </div>
                </div>
              )}
            </div>

            {/* WELFARE FUND DONATIONS INSIGHTS */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 md:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                    <DollarSign size={16} className="text-emerald-800" /> Welfare Fund Donation Insights
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">Track aggregate contribution trends and donation counts over months</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-850">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Sync Active
                  </span>
                </div>
              </div>

              {donations.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-medium bg-white border border-slate-200 rounded-xl">
                  <DollarSign size={32} className="mx-auto mb-2 text-slate-300 animate-bounce" />
                  No donations registered in the database yet. New contributions will show up here.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                  <div className="bg-white border border-slate-200 p-4 md:p-5 rounded-xl flex flex-col justify-between">
                    <div>
                      <h5 className="font-bold text-slate-800 text-sm">Monthly Welfare Fund Trend</h5>
                      <p className="text-[11px] text-slate-400">Visualization of monthly accrued donations (left axis, OMR) and the volume of independent contributions (right axis)</p>
                    </div>

                    <div className="h-72 mt-5 mb-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={donationChartData}
                          margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="label" 
                            stroke="#64748b" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                          />
                          <YAxis 
                            yAxisId="left"
                            stroke="#047857" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                            tickFormatter={(v) => `${v} OMR`}
                          />
                          <YAxis 
                            yAxisId="right"
                            orientation="right"
                            stroke="#0284c7" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                            allowDecimals={false}
                          />
                          <Tooltip
                            contentStyle={{
                              background: '#1e293b',
                              border: 'none',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '11px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                          />
                          <Legend 
                            verticalAlign="top" 
                            height={36} 
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                          />
                          <Line 
                            yAxisId="left"
                            type="monotone" 
                            dataKey="Amount (OMR)" 
                            stroke="#047857" 
                            strokeWidth={2.5}
                            activeDot={{ r: 6 }}
                            dot={{ r: 3 }}
                          />
                          <Line 
                            yAxisId="right"
                            type="monotone" 
                            dataKey="Donation Count" 
                            stroke="#0284c7" 
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={{ r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="text-[10px] text-slate-400 mt-2 flex justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span>💡 <strong>Welfare Fact:</strong> OMR values depict localized financial assets accrued inside the verified community fund.</span>
                    </div>

                  </div>
                </div>
              )}
            </div>

            {/* QUICK ACTIONS & EXPORTS SECTION */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Community Record Keeping &amp; Exports</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-slate-200 rounded-xl p-5 flex flex-col justify-between bg-slate-50/50 hover:border-emerald-200 transition duration-150">
                  <div>
                    <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Users size={16} className="text-emerald-850" /> Member Registry
                    </h5>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Download compiled spreadsheets of community members including system-issued Membership IDs, contact info, and registration status.
                    </p>
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      onClick={exportApprovedMembers}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-800 hover:bg-emerald-950 text-white font-bold py-2.5 px-3 rounded-md text-xs transition duration-150 cursor-pointer shadow-sm"
                    >
                      <CheckCircle2 size={13} /> Export Approved Members CSV
                    </button>
                    <button
                      onClick={exportMembers}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold py-2 px-3 rounded-md text-xs border border-slate-200 transition duration-150 cursor-pointer shadow-sm"
                    >
                      <FileSpreadsheet size={13} /> Export Full Registry CSV
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-5 flex flex-col justify-between bg-slate-50/50 hover:border-emerald-200 transition duration-150">
                  <div>
                    <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <DollarSign size={16} className="text-emerald-850" /> Donation Ledgers
                    </h5>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Download full historical audit records of charity collections, community development funds, and custom ledger notes.
                    </p>
                  </div>
                  <button
                    onClick={exportDonations}
                    className="mt-4 w-full inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold py-2.5 px-3 rounded-md text-xs border border-slate-200 transition duration-150 cursor-pointer shadow-sm"
                  >
                    <FileSpreadsheet size={14} /> Export Donations CSV
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl p-5 flex flex-col justify-between bg-slate-50/50 hover:border-emerald-200 transition duration-150">
                  <div>
                    <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <AlertTriangle size={16} className="text-emerald-850" /> Welfare Claims
                    </h5>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Retrieve community welfare flags, emergency travel assistance requests, and legal coordination tracking records.
                    </p>
                  </div>
                  <button
                    onClick={exportIncidents}
                    className="mt-4 w-full inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold py-2.5 px-3 rounded-md text-xs border border-slate-200 transition duration-150 cursor-pointer shadow-sm"
                  >
                    <FileSpreadsheet size={14} /> Export Claims CSV
                  </button>
                </div>
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
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={exportApprovedMembers}
                  className="inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-3.5 py-2 rounded-md text-xs transition duration-150 cursor-pointer shadow-sm"
                >
                  <CheckCircle2 size={13} /> Export Approved Members CSV
                </button>
                <button 
                  onClick={exportFilteredMembers}
                  className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-2 rounded-md text-xs transition duration-150 cursor-pointer shadow-sm"
                  title="Export currently searched and filtered members list to CSV"
                >
                  <FileSpreadsheet size={13} /> Export Filtered CSV ({sortedAllMembers.length})
                </button>
                <button 
                  onClick={exportMembers}
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold px-3.5 py-2 rounded-md text-xs border border-slate-200 transition duration-150 cursor-pointer"
                >
                  <FileSpreadsheet size={13} /> Export Full Registry CSV
                </button>
              </div>
            </div>

            {/* SEARCH BAR */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="w-full md:max-w-md relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Search members by name, phone, tribe, CNIC..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 shadow-inner"
                />
                {memberSearchQuery && (
                  <button
                    onClick={() => setMemberSearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {memberSearchQuery ? (
                  <span>
                    Found <strong className="text-emerald-800 font-bold">{filteredPending.length}</strong> pending &amp; <strong className="text-emerald-800 font-bold">{filteredAllMembers.length}</strong> registry matches
                  </span>
                ) : (
                  <span>Live lookup matches on Name, Father's Name, Phone, District, Tribe, CNIC, and Occupation</span>
                )}
              </div>
            </div>

            {/* PENDING APPLICATIONS */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-1.5 mb-3 gap-2">
                <span className="text-sm font-bold text-slate-700">
                  Awaiting Review ({filteredPending.length})
                </span>
                {overduePendingCount > 0 && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded text-xs font-bold animate-pulse">
                    <span className="text-amber-600">⚠️</span> {overduePendingCount} application{overduePendingCount > 1 ? 's' : ''} pending for &gt; 48 hours
                  </span>
                )}
              </div>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-emerald-950 text-amber-300">
                    <tr>
                      <th 
                        onClick={() => handleSort('name')} 
                        className="p-3 cursor-pointer select-none hover:bg-emerald-900 transition duration-150"
                        title="Click to sort by Applicant Name"
                      >
                        Applicant details {renderSortIndicator('name')}
                      </th>
                      <th className="p-3">CNIC/Passport</th>
                      <th 
                        onClick={() => handleSort('district')} 
                        className="p-3 cursor-pointer select-none hover:bg-emerald-900 transition duration-150"
                        title="Click to sort by District"
                      >
                        Tribe/District {renderSortIndicator('district')}
                      </th>
                      <th className="p-3">Address</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {sortedPending.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                          {memberSearchQuery ? 'No pending applications match your search query.' : 'No pending applications found.'}
                        </td>
                      </tr>
                    ) : (
                      sortedPending.map((m) => {
                        const createdDate = parseMemberDate(m.createdAt);
                        const hoursInQueue = createdDate ? Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60)) : 0;
                        const isOverdue = hoursInQueue > 48;

                        return (
                          <tr 
                            key={m.id} 
                            className={`transition duration-150 ${
                              isOverdue 
                                ? 'bg-amber-50 hover:bg-amber-100 border-l-4 border-l-amber-500' 
                                : 'hover:bg-slate-50/50'
                            }`}
                          >
                            <td className="p-3 font-semibold text-emerald-950">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{m.name}</span>
                                {isOverdue && (
                                  <span 
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-200 text-amber-900 border border-amber-300 animate-pulse"
                                    title={`Pending for ${hoursInQueue} hours`}
                                  >
                                    🕒 Delayed ({hoursInQueue}h)
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] font-normal text-slate-400 mt-0.5">f: {m.father}</p>
                              {createdDate && (
                                <p className="text-[9px] text-slate-400 mt-0.5 font-mono">
                                  Applied: {createdDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} ({hoursInQueue}h ago)
                                </p>
                              )}
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
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ALL MEMBERS TABLE */}
            <div>
              <div className="flex justify-between items-center border-b pb-1.5 mb-3">
                <span className="text-sm font-bold text-slate-700">
                  All Registry Records ({filteredAllMembers.length})
                </span>
                <button
                  onClick={exportFilteredMembers}
                  className="inline-flex items-center gap-1 bg-emerald-850 hover:bg-emerald-950 text-emerald-850 hover:text-white border border-emerald-200 hover:border-emerald-950 px-2.5 py-1 rounded-md text-[11px] font-semibold transition duration-150 cursor-pointer"
                  title="Export filtered and sorted members log to CSV"
                >
                  <FileSpreadsheet size={12} /> Export Filtered CSV
                </button>
              </div>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                    <tr>
                      <th className="p-3">ID / Reference</th>
                      <th 
                        onClick={() => handleSort('name')} 
                        className="p-3 cursor-pointer select-none hover:bg-slate-200 transition duration-150"
                        title="Click to sort by Name"
                      >
                        Full Name {renderSortIndicator('name')}
                      </th>
                      <th 
                        onClick={() => handleSort('district')} 
                        className="p-3 cursor-pointer select-none hover:bg-slate-200 transition duration-150"
                        title="Click to sort by District"
                      >
                        District {renderSortIndicator('district')}
                      </th>
                      <th className="p-3">Phone</th>
                      <th 
                        onClick={() => handleSort('createdAt')} 
                        className="p-3 cursor-pointer select-none hover:bg-slate-200 transition duration-150"
                        title="Click to sort by Date Registered"
                      >
                        Date Registered {renderSortIndicator('createdAt')}
                      </th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sortedAllMembers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          {memberSearchQuery ? 'No registered members match your search query.' : 'No member records.'}
                        </td>
                      </tr>
                    ) : (
                      sortedAllMembers.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/40">
                          <td className="p-3 font-mono font-bold text-emerald-900">{m.membershipId || '-'}</td>
                          <td className="p-3 font-semibold">{m.name}</td>
                          <td className="p-3">{m.district}</td>
                          <td className="p-3">{m.phone}</td>
                          <td className="p-3 text-slate-500 font-medium">
                            {m.createdAt?.seconds ? new Date(m.createdAt.seconds * 1000).toLocaleDateString() : '-'}
                          </td>
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
                                className="bg-amber-500 hover:bg-amber-600 text-emerald-950 px-2.5 py-1.5 rounded text-xs font-bold transition cursor-pointer inline-block align-middle"
                              >
                                Cards &amp; Receipt
                              </button>
                            )}
                            <button 
                              onClick={() => openEditModal(m)}
                              className="text-emerald-800 hover:text-emerald-950 p-1.5 rounded hover:bg-emerald-50 inline-block align-middle transition cursor-pointer"
                              title="Edit Member Profile"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button 
                              onClick={() => handleDeleteMember(m.id!)}
                              className="text-red-600 hover:text-red-800 p-1.5 rounded hover:bg-red-50 inline-block align-middle transition cursor-pointer"
                              title="Delete Member"
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

        {/* MEMBER DIRECTORY SEARCH INTERFACE */}
        {activeTab === 'directory' && (
          <div className="space-y-6 fade-in">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-2xl font-serif text-emerald-950 font-black flex items-center gap-2">
                  <Search size={22} className="text-emerald-800" /> Executive Member Directory
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  High-Powered Attribute Filter and Registry Query Suite for Welfare Management.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={exportDirectoryMembers}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2.5 rounded-lg text-xs transition duration-150 cursor-pointer shadow-sm flex items-center gap-1.5"
                  title="Export currently filtered search directory as CSV"
                >
                  <FileSpreadsheet size={14} /> Export Directory CSV ({sortedDirectoryMembers.length})
                </button>
                <button
                  onClick={() => {
                    setDirStatus('all');
                    setDirDistrict('all');
                    setDirRegDate('all');
                    setDirSearch('');
                    setDirStartDate('');
                    setDirEndDate('');
                    setExpandedMemberId(null);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-2.5 rounded-lg text-xs transition duration-150 cursor-pointer border border-slate-300 flex items-center gap-1.5"
                  title="Reset all search queries and active filter states"
                >
                  <RefreshCw size={14} /> Reset Filters
                </button>
              </div>
            </div>

            {/* DIRECTORY SNAPSHOT BENTO METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Matched Members</span>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-3xl font-serif font-black text-emerald-900">{sortedDirectoryMembers.length}</span>
                  <span className="text-xs text-slate-400">/ {members.length} total</span>
                </div>
                <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mt-3">
                  <div 
                    className="bg-emerald-700 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(sortedDirectoryMembers.length / (members.length || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Group Approved Ratio</span>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span className="text-3xl font-serif font-black text-emerald-900">
                    {((sortedDirectoryMembers.filter(m => m.status === 'approved').length / (sortedDirectoryMembers.length || 1)) * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs text-slate-400">
                    ({sortedDirectoryMembers.filter(m => m.status === 'approved').length} approved)
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 mt-2 block">
                  Pending: {sortedDirectoryMembers.filter(m => m.status === 'pending').length} | Rejected: {sortedDirectoryMembers.filter(m => m.status === 'rejected').length}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between" id="onboarding-amount-card">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Member Onboarding Amount</span>
                <div className="mt-2">
                  <span className="text-2xl font-serif font-black text-emerald-900 font-sans">
                    OMR {(sortedDirectoryMembers.filter(m => m.status === 'approved').length * 5).toFixed(3)}
                  </span>
                  <span className="text-[10px] text-emerald-800 font-semibold block mt-1">
                    OMR 5 per member (Total: OMR {(members.filter(m => m.status === 'approved').length * 5).toFixed(3)})
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Filter Overview</span>
                <div className="mt-2 space-y-1 text-[11px] text-slate-600">
                  <p className="truncate">District: <strong>{dirDistrict === 'all' ? 'All Districts' : dirDistrict}</strong></p>
                  <p className="truncate">Status: <strong className="capitalize">{dirStatus === 'all' ? 'All statuses' : dirStatus}</strong></p>
                  <p className="truncate">Period: <strong>{dirRegDate === 'all' ? 'All time' : dirRegDate === 'custom' ? 'Custom Range' : `Past ${dirRegDate.replace('days', ' Days')}`}</strong></p>
                </div>
              </div>
            </div>

            {/* STATUS TABBED FILTER UI */}
            <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1 w-full sm:w-auto">
                {[
                  { id: 'all', label: 'All Members', colorClass: 'bg-slate-100 text-slate-800 border-slate-200', activeClass: 'bg-slate-900 text-white shadow-sm border-slate-900', count: members.length },
                  { id: 'active', label: '🟢 Active', colorClass: 'text-emerald-800 bg-emerald-50 border-emerald-200', activeClass: 'bg-emerald-800 text-white shadow-sm border-emerald-800', count: members.filter(m => m.status === 'approved').length },
                  { id: 'pending', label: '🟡 Pending', colorClass: 'text-amber-800 bg-amber-50 border-amber-200', activeClass: 'bg-amber-500 text-white shadow-sm border-amber-500', count: members.filter(m => m.status === 'pending').length },
                  { id: 'archived', label: '🔴 Archived', colorClass: 'text-red-800 bg-red-50 border-red-200', activeClass: 'bg-red-650 text-white shadow-sm border-red-650', count: members.filter(m => m.status === 'rejected').length }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDirStatus(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer border ${
                      dirStatus === tab.id
                        ? tab.activeClass
                        : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-950'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      dirStatus === tab.id
                        ? 'bg-white/20 text-white'
                        : tab.colorClass
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="hidden sm:flex items-center gap-2 text-slate-400 text-xs pr-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold text-slate-500">Live Member Database Linked</span>
              </div>
            </div>

            {/* DYNAMIC SEARCH AND FILTER CONTROLS GRID */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl shadow-inner space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search Term */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Search Keywords</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                      <Search size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="Search name, phone, CNIC, etc."
                      value={dirSearch}
                      onChange={(e) => setDirSearch(e.target.value)}
                      className="w-full pl-8 pr-8 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
                    />
                    {dirSearch && (
                      <button
                        onClick={() => setDirSearch('')}
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* District Filter */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Filter by District</label>
                  <select
                    value={dirDistrict}
                    onChange={(e) => setDirDistrict(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
                  >
                    <option value="all">All Districts ({uniqueDistricts.length})</option>
                    {uniqueDistricts.map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Operational Status</label>
                  <select
                    value={dirStatus}
                    onChange={(e) => setDirStatus(e.target.value as any)}
                    className="w-full py-2 px-3 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active (Approved)</option>
                    <option value="pending">Pending Review</option>
                    <option value="archived">Archived (Rejected)</option>
                  </select>
                </div>

                {/* Date Register Filter */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Registration Date</label>
                  <select
                    value={dirRegDate}
                    onChange={(e) => setDirRegDate(e.target.value as any)}
                    className="w-full py-2 px-3 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
                  >
                    <option value="all">All Registered Dates</option>
                    <option value="7days">Past 7 Days</option>
                    <option value="30days">Past 30 Days</option>
                    <option value="90days">Past 90 Days</option>
                    <option value="custom">Custom Date Range...</option>
                  </select>
                </div>
              </div>

              {/* Custom Date Picker Inputs */}
              {dirRegDate === 'custom' && (
                <div className="grid grid-cols-2 gap-4 max-w-md bg-white border border-slate-200 p-3 rounded-lg animate-slide-up">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">From Date</span>
                    <input
                      type="date"
                      value={dirStartDate}
                      onChange={(e) => setDirStartDate(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-700 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">To Date</span>
                    <input
                      type="date"
                      value={dirEndDate}
                      onChange={(e) => setDirEndDate(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-700 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Advanced Sorting Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-semibold text-slate-600">Sort By Attribute:</span>
                  <div className="flex bg-white rounded-lg border border-slate-200 p-0.5">
                    {[
                      { id: 'createdAt', label: 'Registration Date' },
                      { id: 'name', label: 'Alphabetical Name' },
                      { id: 'district', label: 'Tribe / District' },
                      { id: 'status', label: 'Review Status' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setDirSortBy(opt.id as any)}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                          dirSortBy === opt.id 
                            ? 'bg-emerald-900 text-amber-300' 
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDirSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-900 bg-white border border-slate-200 hover:bg-slate-105 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    {dirSortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    {dirSortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  </button>
                </div>
              </div>
            </div>

            {/* EXPANDABLE MASTER DIRECTORY RECORDS LIST */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[800px]">
                  <thead className="bg-emerald-950 text-amber-300 font-bold">
                    <tr>
                      <th className="p-3.5 pl-5 w-12 text-center">Detail</th>
                      <th className="p-3.5">Member Details</th>
                      <th className="p-3.5">District / Residence</th>
                      <th className="p-3.5">Primary Contact</th>
                      <th className="p-3.5">Registration Time</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right pr-5">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedDirectoryMembers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-16 text-center text-slate-400 font-medium">
                          <Search size={36} className="mx-auto mb-2 text-slate-300 animate-pulse" />
                          No members matching selected filters. Refine district, status, dates, or search term.
                        </td>
                      </tr>
                    ) : (
                      sortedDirectoryMembers.map((m) => {
                        const isExpanded = expandedMemberId === m.id;
                        const regDateStr = m.createdAt
                          ? (m.createdAt.toDate ? m.createdAt.toDate() : new Date(m.createdAt.seconds ? m.createdAt.seconds * 1000 : m.createdAt)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'Unknown';

                        const initials = (m.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                        return (
                          <React.Fragment key={m.id}>
                            <tr 
                              onClick={() => setExpandedMemberId(isExpanded ? null : m.id || null)}
                              className={`hover:bg-slate-50/50 cursor-pointer transition duration-150 ${isExpanded ? 'bg-emerald-50/20' : ''}`}
                            >
                              {/* Toggle Expand Arrow */}
                              <td className="p-3.5 pl-5 text-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedMemberId(isExpanded ? null : m.id || null);
                                  }}
                                  className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition focus:outline-none cursor-pointer"
                                  title={isExpanded ? "Collapse Details" : "Expand Details"}
                                >
                                  {isExpanded ? (
                                    <span className="block text-emerald-800 font-bold">▼</span>
                                  ) : (
                                    <span className="block text-slate-400">▶</span>
                                  )}
                                </button>
                              </td>

                              {/* Member Photo & Name Details */}
                              <td className="p-3.5">
                                <div className="flex items-center gap-3 animate-fade-in">
                                  {m.photo ? (
                                    <img 
                                      src={m.photo} 
                                      alt={m.name} 
                                      className="w-9 h-9 rounded-full object-cover border border-slate-200 bg-slate-50 flex-shrink-0"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-9 h-9 rounded-full bg-emerald-900 text-amber-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                      {initials}
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-semibold text-emerald-955 block text-sm">{highlightMatch(m.name || '', dirSearch)}</span>
                                    <span className="text-[10px] text-slate-400 block">s/o: {highlightMatch(m.father || '', dirSearch)}</span>
                                  </div>
                                </div>
                              </td>

                              {/* District / Address */}
                              <td className="p-3.5">
                                <span className="inline-block bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 mb-0.5">
                                  {highlightMatch(m.district || 'Unassigned', dirSearch)}
                                </span>
                                <span className="text-[10px] text-slate-500 block truncate max-w-xs" title={m.address}>
                                  {highlightMatch(m.address || '', dirSearch)}
                                </span>
                              </td>

                              {/* Phone / whatsapp Contact */}
                              <td className="p-3.5 font-sans">
                                <span className="block text-slate-800 font-semibold">{highlightMatch(m.phone || '', dirSearch)}</span>
                                {m.whatsapp && (
                                  <span className="text-[10px] text-emerald-800 font-medium flex items-center gap-0.5">
                                    🟢 WhatsApp Active
                                  </span>
                                )}
                              </td>

                              {/* Created At / Reg Time */}
                              <td className="p-3.5 text-slate-500 font-medium">
                                <span className="block">{regDateStr}</span>
                                {m.membershipId && (
                                  <span className="text-[10px] text-emerald-800 font-mono block font-bold">ID: {highlightMatch(m.membershipId, dirSearch)}</span>
                                )}
                              </td>

                              {/* Status Badge */}
                              <td className="p-3.5">
                                {m.status === 'approved' && (
                                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 rounded-full py-0.5 text-[10px] font-bold border border-emerald-200">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                    Approved
                                  </span>
                                )}
                                {m.status === 'pending' && (
                                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 rounded-full py-0.5 text-[10px] font-bold border border-amber-200">
                                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                                    Pending
                                  </span>
                                )}
                                {m.status === 'rejected' && (
                                  <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2 rounded-full py-0.5 text-[10px] font-bold border border-red-200">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                    Rejected
                                  </span>
                                )}
                              </td>

                              {/* Quick Actions */}
                              <td className="p-3.5 text-right pr-5 whitespace-nowrap space-x-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onViewDocuments(m);
                                  }}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-950 bg-amber-400 hover:bg-amber-500 px-2.5 py-1.5 rounded transition cursor-pointer"
                                  title="View legal identity card, payment verification receipt, and certificate PDFs"
                                >
                                  <FileIcon size={12} /> Documents
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingMember(m);
                                    setEditName(m.name || '');
                                    setEditFather(m.father || '');
                                    setEditCnic(m.cnic || '');
                                    setEditDistrict(m.district || '');
                                    setEditPhone(m.phone || '');
                                    setEditWhatsapp(m.whatsapp || '');
                                    setEditAddress(m.address || '');
                                    setEditOccupation(m.occupation || '');
                                    setEditEmergency(m.emergency || '');
                                    setEditStatus(m.status || 'pending');
                                    setEditMembershipId(m.membershipId || '');
                                    setEditFeeAmount(String(m.feeAmount || '5'));
                                    setEditPaymentMethod(m.paymentMethod || 'Bank Transfer');
                                    setEditPaymentReference(m.paymentReference || '');
                                  }}
                                  className="text-emerald-800 hover:text-white p-1.5 rounded hover:bg-emerald-900 inline-block align-middle transition cursor-pointer border border-slate-200 hover:border-emerald-900"
                                  title="Edit full member properties profile"
                                >
                                  <Edit2 size={13} />
                                </button>
                              </td>
                            </tr>

                            {/* Dropdown Profile Detail Card */}
                            {isExpanded && (
                              <tr className="bg-slate-50/80 animate-fade-in border-y border-slate-200">
                                <td colSpan={7} className="p-6 pl-14">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    
                                    {/* Primary Info */}
                                    <div className="bg-white border p-4 rounded-xl space-y-2 shadow-xs">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wide border-b pb-1">Primary Identification &amp; Job</span>
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="space-y-0.5">
                                          <span className="text-slate-400 text-[10px] block">Father Name:</span>
                                          <span className="font-semibold text-slate-800">{highlightMatch(m.father || '', dirSearch)}</span>
                                        </div>
                                        <div className="space-y-0.5">
                                          <span className="text-slate-400 text-[10px] block">CNIC / Passport:</span>
                                          <span className="font-mono font-semibold text-slate-800">{highlightMatch(m.cnic || '', dirSearch)}</span>
                                        </div>
                                        <div className="space-y-0.5">
                                          <span className="text-slate-400 text-[10px] block">Occupation:</span>
                                          <span className="font-semibold text-slate-700">{highlightMatch(m.occupation || '', dirSearch)}</span>
                                        </div>
                                        <div className="space-y-0.5 col-span-2">
                                          <span className="text-slate-400 text-[10px] block">Registered Email:</span>
                                          <span className="font-semibold text-slate-700 lowercase truncate block">{highlightMatch(m.email || '', dirSearch)}</span>
                                        </div>
                                      </div>

                                      {/* Email Dispatch & Notification Tracker */}
                                      {m.status === 'approved' && (
                                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-1.5 text-[11px]">
                                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Notification Delivery Status</span>
                                          {m.emailSent ? (
                                            m.emailStatus === 'failed_smtp_fallback' ? (
                                              <div className="bg-red-50 border border-red-200 text-red-800 p-2.5 rounded-lg space-y-1.5 shadow-2xs">
                                                <div className="flex items-start gap-1">
                                                  <AlertTriangle size={13} className="text-red-600 mt-0.5 flex-shrink-0" />
                                                  <div>
                                                    <p className="font-bold">SMTP Dispatch Failed (Zoho Blocked)</p>
                                                    <p className="text-[10px] text-red-700 leading-tight">Your outbound SMTP relay service blocked/deferred this email ("Unusual sending activity detected"). To fix this, unblock your Zoho email account or click below to retry after unblocking.</p>
                                                  </div>
                                                </div>
                                                {m.emailError && (
                                                  <p className="text-[9px] bg-red-100/50 p-1 rounded font-mono text-red-900 truncate">
                                                    Error: {m.emailError}
                                                  </p>
                                                )}
                                                <div className="flex items-center gap-1.5 pt-1">
                                                  <button
                                                    type="button"
                                                    onClick={() => handleResendCredentialsEmail(m)}
                                                    className="bg-white hover:bg-slate-100 border border-red-300 hover:border-red-400 text-red-800 text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                                  >
                                                    <RefreshCw size={10} /> Retry SMTP Dispatch
                                                  </button>
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="bg-emerald-50 border border-emerald-150 text-emerald-800 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs">
                                                <CheckCircle2 size={12} className="text-emerald-600 flex-shrink-0" />
                                                <div>
                                                  <p className="font-bold leading-tight">Official Welcome Email Sent</p>
                                                  <p className="text-[10px] text-emerald-700 leading-none">Delivered successfully to registered mailbox.</p>
                                                </div>
                                              </div>
                                            )
                                          ) : (
                                            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs">
                                              <RefreshCw size={12} className="text-amber-600 animate-spin flex-shrink-0" />
                                              <div>
                                                <p className="font-bold leading-tight">SMTP Delivery Queued</p>
                                                <p className="text-[10px] text-amber-700 leading-none">The background service is preparing delivery...</p>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {/* Residence, Emergency Contacts */}
                                    <div className="bg-white border p-4 rounded-xl space-y-2 shadow-xs">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wide border-b pb-1">Welfare, Safety &amp; Emergency Contacts</span>
                                      <div className="grid grid-cols-1 gap-2 text-xs">
                                        <div className="space-y-0.5">
                                          <span className="text-slate-400 text-[10px] block">Address:</span>
                                          <span className="font-medium text-slate-800 leading-relaxed">{highlightMatch(m.address || '', dirSearch)}</span>
                                        </div>
                                        <div className="space-y-0.5">
                                          <span className="text-slate-400 text-[10px] block">Emergency Contact:</span>
                                          <span className="font-semibold text-slate-800">{highlightMatch(m.emergency || '', dirSearch)}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Registry Finance Ledger details */}
                                    <div className="bg-white border p-4 rounded-xl space-y-2 shadow-xs">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wide border-b pb-1">Welfare Dues / Payment Details</span>
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="space-y-0.5">
                                          <span className="text-slate-400 text-[10px] block">Dues Paid:</span>
                                          <span className="font-black text-emerald-900">OMR {m.feeAmount || 0}</span>
                                        </div>
                                        <div className="space-y-0.5">
                                          <span className="text-slate-400 text-[10px] block">Payment Method:</span>
                                          <span className="font-semibold text-slate-700">{m.paymentMethod || 'N/A'}</span>
                                        </div>
                                        <div className="space-y-0.5 col-span-2">
                                          <span className="text-slate-400 text-[10px] block">Txn Reference:</span>
                                          <span className="font-mono text-slate-700 font-medium truncate block">{m.paymentReference || 'N/A'}</span>
                                        </div>
                                      </div>
                                    </div>

                                  </div>

                                  {/* Attached Documents Section */}
                                  {m.driveAttachments && m.driveAttachments.length > 0 && (
                                    <div className="mt-4 bg-white border border-slate-200 p-4 rounded-xl space-y-2 shadow-xs">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wide border-b pb-1 flex items-center gap-1">
                                        <Paperclip size={12} className="text-slate-400" /> Attached Administrative Verification Documents ({m.driveAttachments.length})
                                      </span>
                                      <div className="flex flex-wrap gap-2 pt-1">
                                        {m.driveAttachments.map((file) => (
                                          <a
                                            key={file.id}
                                            href={file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-150 transition cursor-pointer"
                                          >
                                            <FileIcon size={12} />
                                            <span className="max-w-[180px] truncate">{file.name}</span>
                                            <ExternalLink size={10} className="text-emerald-700 flex-shrink-0" />
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Inline Admin Approval Panel */}
                                  {m.status === 'pending' && (
                                    <div className="mt-4 bg-amber-50/60 border border-amber-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                      <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-amber-955">Awaiting Registration Approval</p>
                                        <p className="text-[11px] text-slate-500 leading-relaxed">Confirm payment and administrative credentials match before issuing the official RFID membership ID.</p>
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleApproveMember(m)}
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition shadow-sm cursor-pointer"
                                        >
                                          Approve Registration
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRejectMember(m.id!)}
                                          className="bg-red-650 hover:bg-red-750 text-white font-bold text-xs px-4 py-2 rounded-lg transition shadow-sm cursor-pointer"
                                        >
                                          Reject
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
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
                    {['Chairman', 'Deputy Chairman', 'President', 'Co-President', 'Senior Vice President', 'Vice President', 'General Secretary', 'Joint Secretary', 'Finance Secretary', 'Information Secretary', 'Welfare Secretary', 'Cultural Secretary', 'Building Secretary', 'Chief Organizer', 'Member - Executive Committee', 'Other'].map(pos => (
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1 font-sans">Google Email (For Chamber Access & Voting)</label>
                  <input 
                    type="email" 
                    value={cEmail} 
                    onChange={e => setCEmail(e.target.value)}
                    placeholder="e.g. member@gmail.com"
                    className="w-full px-3 py-2 border rounded bg-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
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
                    <th className="p-3">Verified Google Email</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cabinet.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">No officers registered.</td>
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
                        <td className="p-3 text-slate-600 font-mono text-[11px]">{cm.email || <span className="text-amber-600 font-sans italic text-[10px] bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded">No email linked (Cannot access/vote)</span>}</td>
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

            <form onSubmit={handleDonationSubmit} className="max-w-2xl bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-4 font-sans">
              <h4 className="font-bold text-sm text-emerald-900 border-b pb-1.5 flex items-center gap-1.5">
                <DollarSign size={16} /> Record Physical Donation Receipt / Log Pre-Approved Dues
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Donor Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={dDonor} 
                    onChange={e => setDDonor(e.target.value)}
                    placeholder="e.g. Javed Swati"
                    className="w-full px-3 py-2 border rounded bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Donor Phone *</label>
                  <input 
                    type="tel" 
                    required 
                    value={dPhone} 
                    onChange={e => setDPhone(e.target.value)}
                    placeholder="e.g. +968 99111870"
                    className="w-full px-3 py-2 border rounded bg-white text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 font-sans">Donated Amount (OMR) *</label>
                  <input 
                    type="number" 
                    step="0.001" 
                    min="0.001"
                    required 
                    value={dAmount} 
                    onChange={e => setDAmount(e.target.value)}
                    placeholder="0.000"
                    className="w-full px-3 py-2 border rounded bg-white text-sm font-mono"
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
                    className="w-full px-3 py-2 border rounded bg-white text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 font-sans">Payment Method</label>
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
                <label className="block text-xs font-semibold text-slate-600 mb-1 font-sans">Notes / Purpose</label>
                <input 
                  type="text" 
                  value={dNote} 
                  onChange={e => setDNote(e.target.value)}
                  placeholder="e.g. Swat Flood Welfare Support"
                  className="w-full px-3 py-2 border rounded bg-white text-sm"
                />
              </div>

              <button type="submit" className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2 rounded text-xs cursor-pointer shadow-xs font-sans">
                Save Ledger Record (Pre-Approved)
              </button>
            </form>

            <div className="overflow-x-auto border rounded-xl bg-white shadow-xs">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3">Reference Date</th>
                    <th className="p-3">Donor Name</th>
                    <th className="p-3">Donor Phone</th>
                    <th className="p-3">Amount (OMR)</th>
                    <th className="p-3">Gateway Method</th>
                    <th className="p-3">Approval Status</th>
                    <th className="p-3 text-left">Memo Notes</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-600 text-left">
                  {donations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400">No registered donations log.</td>
                    </tr>
                  ) : (
                    donations.map(d => (
                      <tr key={d.id} className="hover:bg-slate-50/40 border-b">
                        <td className="p-3 font-mono text-[11px] whitespace-nowrap">{d.date}</td>
                        <td className="p-3 font-semibold text-emerald-950 uppercase">{d.donor}</td>
                        <td className="p-3 font-mono text-[11px]">{d.phone || '-'}</td>
                        <td className="p-3 text-emerald-900 font-bold font-mono">OMR {Number(d.amount).toFixed(3)}</td>
                        <td className="p-3 text-slate-600">{d.method}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase font-sans ${
                            d.status === 'approved' 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : d.status === 'rejected'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-amber-100 text-amber-80 * border border-amber-200'
                          }`}>
                            {d.status || 'pending'}
                          </span>
                          {d.receiptNumber && (
                            <span className="block mt-1 text-[9px] font-mono font-medium text-slate-400 text-left">
                              ID: {d.receiptNumber}
                            </span>
                          )}
                        </td>
                        <td className="p-3 italic text-slate-400 text-left">{d.note || '-'}</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end items-center gap-1 whitespace-nowrap">
                            {d.status === 'pending' && (
                              <div className="flex items-center gap-1.5 mr-2">
                                <button
                                  type="button"
                                  onClick={() => handleDonationApproval(d.id!, 'approved')}
                                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-2 py-1 rounded text-[10px] uppercase tracking-wider transition cursor-pointer"
                                  title="Approve Claims"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDonationApproval(d.id!, 'rejected')}
                                  className="bg-red-655 hover:bg-red-700 text-white font-bold px-2 py-1 rounded text-[10px] uppercase tracking-wider transition cursor-pointer"
                                  title="Reject Claims"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                            <button onClick={() => handleDeleteDonation(d.id!)} className="text-red-650 p-1.5 rounded hover:bg-red-50 cursor-pointer" title="Delete record">
                              <Trash2 size={14} />
                            </button>
                          </div>
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
              <div className="flex flex-wrap items-center gap-2">
                <button 
                  onClick={exportIncidentsPDF}
                  className="inline-flex items-center gap-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold px-3.5 py-2 rounded-md text-xs transition duration-150 cursor-pointer shadow-sm"
                  title="Generate dynamic executive PDF report from filtered incidents"
                >
                  <FileDown size={14} /> Download PDF Report ({sortedIncidents.length})
                </button>
                <button 
                  onClick={exportIncidents}
                  className="inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-3.5 py-2 rounded-md text-xs transition duration-150 cursor-pointer shadow-sm"
                >
                  <FileSpreadsheet size={14} /> Export Incidence Claims CSV
                </button>
              </div>
            </div>

            {/* INCIDENT SEARCH BAR */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="w-full md:max-w-md relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Search welfare claims by name, type, phone, details..."
                  value={incidentSearchQuery}
                  onChange={(e) => setIncidentSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 shadow-inner"
                />
                {incidentSearchQuery && (
                  <button
                    onClick={() => setIncidentSearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {incidentSearchQuery ? (
                  <span>
                    Found <strong className="text-emerald-800 font-bold">{sortedIncidents.length}</strong> welfare claim matches
                  </span>
                ) : (
                  <span>Live lookup matches on Claimant Name, Incident Type, Details, Submitter Contact, and Status</span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-100">
                  <tr>
                    <th 
                      onClick={() => handleIncidentSort('type')}
                      className="p-3 cursor-pointer select-none hover:bg-slate-200 transition duration-150"
                      title="Click to sort by Type"
                    >
                      Type {renderIncidentSortIndicator('type')}
                    </th>
                    <th 
                      onClick={() => handleIncidentSort('name')}
                      className="p-3 cursor-pointer select-none hover:bg-slate-200 transition duration-150"
                      title="Click to sort by Claimant Name"
                    >
                      Affected Claimant {renderIncidentSortIndicator('name')}
                    </th>
                    <th className="p-3">Description Context</th>
                    <th 
                      onClick={() => handleIncidentSort('date')}
                      className="p-3 cursor-pointer select-none hover:bg-slate-200 transition duration-150"
                      title="Click to sort by Date"
                    >
                      Incident Date {renderIncidentSortIndicator('date')}
                    </th>
                    <th className="p-3">Reporter Phone</th>
                    <th 
                      onClick={() => handleIncidentSort('status')}
                      className="p-3 cursor-pointer select-none hover:bg-slate-200 transition duration-150"
                      title="Click to sort by Status"
                    >
                      Status {renderIncidentSortIndicator('status')}
                    </th>
                    <th className="p-3 text-right">Review Options</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-600">
                  {sortedIncidents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        {incidentSearchQuery ? 'No listed incidents match your search query.' : 'No listed incidents.'}
                      </td>
                    </tr>
                  ) : (
                    sortedIncidents.map(i => (
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
                              className="bg-emerald-600 text-white px-2 py-1 rounded text-[10px] font-semibold cursor-pointer hover:bg-emerald-700 inline-block align-middle"
                            >
                              Approve / Publish
                            </button>
                          )}
                          {i.status !== 'closed' && (
                            <button 
                              onClick={() => handleIncidentStatus(i.id!, 'closed')} 
                              className="bg-slate-200 text-slate-700 px-2 py-1 rounded text-[10px] font-semibold cursor-pointer hover:bg-slate-350 inline-block align-middle"
                            >
                              Archive / Close
                            </button>
                          )}
                          <button 
                            onClick={() => exportSingleIncidentPDF(i)}
                            className="bg-rose-50 text-rose-800 px-2 py-1 rounded text-[10px] font-semibold cursor-pointer hover:bg-rose-100 inline-flex items-center gap-1 inline-block align-middle"
                            title="Download official PDF emergency case briefing"
                          >
                            <FileDown size={11} />
                            PDF Brief
                          </button>
                          <button 
                            onClick={() => setActiveIncidentDocs(i)} 
                            className="bg-emerald-50 text-emerald-800 px-2 py-1 rounded text-[10px] font-semibold cursor-pointer hover:bg-emerald-100 inline-flex items-center gap-1 inline-block align-middle"
                            title="Manage Google Drive attachments"
                          >
                            <Paperclip size={11} />
                            Docs ({i.driveAttachments?.length || 0})
                          </button>
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

        {/* FOUNDER TAB */}
        {activeTab === 'founder' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-serif text-emerald-950 font-sans">Patron-Founder Profile Customization</h3>
            <p className="text-xs text-slate-500 max-w-2xl font-sans">
              Modify the public presentation, quotes, contact details, and biographic narratives of the OPC patron/founder. Changes applied here will update both the homepage founder's message section and the detailed bio presentation pop-up.
            </p>

            <form onSubmit={handleFounderSubmit} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6 max-w-4xl">
              <h4 className="font-bold text-sm text-emerald-950 border-b pb-2 flex items-center gap-2">
                <Award size={16} className="text-amber-500" />
                Personal Profile &amp; Bio Information
              </h4>

              {fSuccess && (
                <div id="founder-save-alert-success" className="bg-emerald-50 text-emerald-800 text-xs p-3.5 rounded-lg font-semibold border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 size={16} /> Modified founder settings saved successfully! Live profile is updated.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Photo Upload Panel */}
                <div className="md:col-span-1 bg-white p-5 rounded-xl border border-slate-200 flex flex-col items-center justify-between text-center space-y-4">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Portrait Image</span>
                  
                  <div className="relative w-36 h-36 rounded-full border-4 border-amber-400 p-1 bg-slate-105 overflow-hidden flex items-center justify-center">
                    <img 
                      src={fPhoto || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=256&h=256'} 
                      alt="Founder Upload Preview" 
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>

                  <div className="w-full">
                    <label className="block text-[11px] font-bold text-slate-650 cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 py-2 px-3 rounded-lg transition duration-150">
                      Upload Portrait photo JPEG/PNG
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFounderPhotoUpload} 
                        className="hidden" 
                      />
                    </label>
                    <span className="text-[9px] text-slate-400 block mt-1.5 leading-relaxed">
                      Upload Portrait photo.
                    </span>
                  </div>
                </div>

                {/* Identity Information inputs */}
                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-650 mb-1">Founder Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={fName} 
                        onChange={e => setFName(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg bg-white text-sm focus:outline-emerald-800"
                        placeholder="Al-Haj Muhammad Amin"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-650 mb-1">Founder Position</label>
                      <input 
                        type="text" 
                        required
                        value={fPosition} 
                        onChange={e => setFPosition(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg bg-white text-sm focus:outline-emerald-800"
                        placeholder="President, Pakhtoon Community"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-650 mb-1">Contact phone</label>
                      <input 
                        type="text" 
                        value={fPhone} 
                        onChange={e => setFPhone(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg bg-white text-sm focus:outline-emerald-800 font-mono"
                        placeholder="+968 99111870"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-650 mb-1">Official Email</label>
                      <input 
                        type="email" 
                        value={fEmail} 
                        onChange={e => setFEmail(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg bg-white text-sm focus:outline-emerald-800"
                        placeholder="president@pakhtooncommunity.org"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-650 mb-1">Headquarters address</label>
                      <input 
                        type="text" 
                        value={fAddress} 
                        onChange={e => setFAddress(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg bg-white text-sm focus:outline-emerald-800"
                        placeholder="Central Headquarters"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-650 mb-1">Board Established Statement</label>
                      <input 
                        type="text" 
                        value={fEst} 
                        onChange={e => setFEst(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg bg-white text-sm focus:outline-emerald-800"
                        placeholder="Welfare Board Established in 2018"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Inspiration Quote */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-emerald-950">Inspirational Vision statement / Message Quote</label>
                <textarea 
                  rows={3}
                  required
                  value={fQuote} 
                  onChange={e => setFQuote(e.target.value)}
                  className="w-full px-4 py-2 text-sm border rounded-lg bg-white focus:outline-emerald-800 text-wrap break-words"
                  placeholder="Insert inspiring quote displayed on the primary landing page card..."
                />
              </div>

              {/* Detailed Biographic Paragraphs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-650">Biographic Narrative paragraph 1</label>
                  <textarea 
                    rows={6}
                    required
                    value={fBio1} 
                    onChange={e => setFBio1(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg bg-white focus:outline-emerald-800 leading-relaxed text-wrap break-words"
                    placeholder="First detailed biography block displayed in the pop-up modal..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-650">Biographic Narrative paragraph 2</label>
                  <textarea 
                    rows={6}
                    value={fBio2} 
                    onChange={e => setFBio2(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg bg-white focus:outline-emerald-800 leading-relaxed text-wrap break-words"
                    placeholder="Optional second detailed biography block..."
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button 
                  type="submit" 
                  disabled={founderSaveLoading}
                  className={`bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-6 py-2.5 rounded-lg text-xs cursor-pointer inline-flex items-center gap-2 shadow-xs transition ${founderSaveLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {founderSaveLoading ? 'Updating Database...' : 'Save Profile Changes'}
                </button>
              </div>
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
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 font-sans">Voting End Date (Optional)</label>
                <input 
                  type="datetime-local" 
                  value={elEndDate} 
                  onChange={e => setElEndDate(e.target.value)}
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
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                              el.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'
                            }`}>
                              Status: {el.status}
                            </span>
                            {el.endDate && (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                Ends: {new Date(el.endDate).toLocaleString()}
                              </span>
                            )}
                          </div>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-dashed border-slate-200 p-3 rounded-lg">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Option A: Upload Banner Image</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAdImageChange}
                    className="w-full text-xs"
                  />
                  {adImage && (
                    <div className="mt-2">
                      <p className="text-[10px] text-slate-400 mb-1">Banner Image Preview:</p>
                      <img src={adImage} alt="Ad sponsor upload result" className="h-16 w-full object-cover border rounded border-slate-300 bg-slate-100" />
                    </div>
                  )}
                </div>

                <div className="border border-dashed border-slate-200 p-3 rounded-lg">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Option B: Upload Community Awareness Video (MP4/WebM/etc)</label>
                  <input 
                    type="file" 
                    accept="video/*" 
                    onChange={handleAdVideoChange}
                    className="w-full text-xs"
                  />
                  {adVideo && (
                    <div className="mt-2">
                      <p className="text-[10px] text-slate-400 mb-1">Awareness Video Preview:</p>
                      <video src={adVideo} controls className="h-16 w-full object-cover border rounded border-slate-300 bg-black" />
                    </div>
                  )}
                </div>
              </div>

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
                    <th className="p-3">Banner / Video Asset</th>
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
                          {ad.video ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-emerald-700 font-bold bg-emerald-55/60 border border-emerald-200 px-1 py-0.5 rounded text-[9px] uppercase">Video 🎥</span>
                              <video src={ad.video} className="h-8 w-20 object-cover border rounded shadow-xs bg-black" muted />
                            </div>
                          ) : ad.image ? (
                            <img src={ad.image} alt={ad.name} className="h-8 w-20 object-cover border rounded shadow-xs" />
                          ) : (
                            <span className="text-[10px] text-slate-400">No media URL</span>
                          )}
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

        {/* GOOGLE WORKSPACE HUB TAB */}
        {activeTab === 'workspace' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold font-serif text-emerald-950">Google Workspace Synchronization Hub</h3>
                <p className="text-xs text-slate-500">
                  Export registries, donations, and claims directly to Google Pages or create restore snapshots on Google Drive.
                </p>
              </div>
              
              {googleEmail && (
                <button
                  onClick={handleDisconnectWorkspace}
                  className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-4 py-2 border border-red-200 rounded-lg text-xs transition duration-150 cursor-pointer"
                >
                  Disconnect Account
                </button>
              )}
            </div>

            {/* ERROR AND SUCCESS VIEWS */}
            {workspaceError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg text-xs flex gap-3 text-red-800 animate-fade">
                <AlertTriangle size={16} className="shrink-0 text-red-600" />
                <div>
                  <h4 className="font-bold">Execution Blocked</h4>
                  <p className="text-red-750 font-medium mt-0.5">{workspaceError}</p>
                </div>
              </div>
            )}

            {workspaceSuccess && (
              <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg text-xs flex gap-3 text-emerald-800 animate-fade">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                <div className="flex-1">
                  <h4 className="font-bold">Action Completed</h4>
                  <p className="text-emerald-700 font-medium mt-0.5">{workspaceSuccess}</p>
                  
                  {recentlyCreatedSheet && (
                    <div className="mt-2.5">
                      <a
                        href={recentlyCreatedSheet}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-bold px-3 py-1.5 rounded text-[11px] shadow-sm transition cursor-pointer"
                      >
                        <Link2 size={12} /> Launch Live Spreadsheet
                      </a>
                    </div>
                  )}
                </div>
                <button onClick={() => setWorkspaceSuccess(null)} className="text-emerald-400 hover:text-emerald-600 cursor-pointer">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* IF NOT AUTHENTICATED */}
            {!googleEmail ? (
              <div className="bg-slate-50 border border-slate-200 p-8 rounded-2xl text-center flex flex-col items-center justify-center space-y-4 max-w-2xl mx-auto">
                <div className="bg-emerald-50 p-4 rounded-full border border-emerald-100 shadow-xs text-emerald-800">
                  <Cloud size={32} strokeWidth={1.5} />
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-bold font-sans text-slate-800">Connect to Google Workspace</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Link with Google dynamically in real time to enable auto-saving member databases, donation registers, and incident tables right directly into Google Spreadsheets on your Drive.
                  </p>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={handleConnectWorkspace}
                    disabled={workspaceLoading}
                    className="relative flex items-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-300 px-6 py-3 rounded-xl shadow-xs hover:shadow-sm transition duration-150 cursor-pointer text-sm disabled:opacity-50"
                  >
                    {workspaceLoading ? (
                      <RefreshCw size={16} className="animate-spin text-slate-400" />
                    ) : (
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-[18px] h-[18px] block shrink-0">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                      </svg>
                    )}
                    <span>{workspaceLoading ? 'Connecting Workspace...' : 'Authorize Google Account'}</span>
                  </button>
                </div>
              </div>
            ) : (
              // IF AUTHENTICATED
              <div className="space-y-6">
                
                {/* STATUS HEADER BAR */}
                <div className="bg-emerald-950 p-4 rounded-xl flex items-center justify-between text-white shadow-sm border border-emerald-900">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-800 text-amber-300 p-2.5 rounded-full border border-emerald-800">
                      <Cloud size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">Google Workspace Sync Connected</h4>
                      <p className="text-[11px] text-slate-350 font-mono mt-0.5">Linked Email: {googleEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-450 bg-green-400 animate-pulse"></span>
                    <span className="text-[10px] uppercase font-bold text-green-400 font-mono">Sync Online</span>
                  </div>
                </div>

                {/* DOUBLE BENTO GRID SCHEMES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* GENERATIVE EXPORT SHEETS */}
                  <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
                    <div className="flex items-center gap-2 border-b pb-3">
                      <div className="bg-green-50 text-green-700 p-2 rounded-lg">
                        <FileSpreadsheet size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-800">Instant Sheets Database Sync</h4>
                        <p className="text-[10px] text-slate-400">Export filtered community logs directly as editable documents.</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-4 p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition">
                        <div>
                          <p className="text-xs font-bold text-slate-700">Members Queue Export</p>
                          <p className="text-[10px] text-slate-400">{members.length} registered members</p>
                        </div>
                        <button
                          onClick={handleCreateMembersSheet}
                          disabled={workspaceLoading}
                          className="bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-300 text-white text-[11px] font-bold py-1.5 px-3 rounded transition cursor-pointer"
                        >
                          Export to Sheets
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-4 p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition">
                        <div>
                          <p className="text-xs font-bold text-slate-700">Financial Ledger Export</p>
                          <p className="text-[10px] text-slate-400">{donations.length} donor archives</p>
                        </div>
                        <button
                          onClick={handleCreateDonationsSheet}
                          disabled={workspaceLoading}
                          className="bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-300 text-white text-[11px] font-bold py-1.5 px-3 rounded transition cursor-pointer"
                        >
                          Export to Sheets
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-4 p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition">
                        <div>
                          <p className="text-xs font-bold text-slate-700">Welfare Claims History</p>
                          <p className="text-[10px] text-slate-400">{incidents.length} emergency reporting cases</p>
                        </div>
                        <button
                          onClick={handleCreateIncidentsSheet}
                          disabled={workspaceLoading}
                          className="bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-300 text-white text-[11px] font-bold py-1.5 px-3 rounded transition cursor-pointer"
                        >
                          Export to Sheets
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* RESTORE ARCHIVE BACKUP SYSTEM */}
                  <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
                    <div className="flex items-center gap-2 border-b pb-3">
                      <div className="bg-blue-50 text-blue-700 p-2 rounded-lg">
                        <Database size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-800">State Backups & Restore Snapshots</h4>
                        <p className="text-[10px] text-slate-400">Post localized full snapshots of databases into Google Drive.</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-200 rounded-xl space-y-3 bg-slate-50 text-center">
                      <Cloud className="text-blue-500 animate-pulse" size={24} />
                      <div>
                        <p className="text-xs font-bold text-slate-700">Compile Full Snapshot Point</p>
                        <p className="text-[10px] text-slate-400 max-w-xs mt-0.5 leading-relaxed">
                          Captures active profiles, lists, financial ledgers, and banner campaigns, compiles them into a secure restore node, and uploads onto Google Drive.
                        </p>
                      </div>
                      <button
                        onClick={handleUploadSystemRestorePoint}
                        disabled={workspaceLoading}
                        className="bg-indigo-700 hover:bg-indigo-850 disabled:bg-slate-250 text-white text-[11px] font-bold py-2 px-4 rounded-lg shadow-xs transition cursor-pointer"
                      >
                        {workspaceLoading ? 'Compiling JSON...' : 'Push State Snapshot to Drive'}
                      </button>
                    </div>
                  </div>

                </div>

                {/* STORAGE VIEW PORT EXCLUSIVES */}
                <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <div className="flex items-center gap-2">
                      <Cloud size={16} className="text-emerald-800" />
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">Active Backups Tree in Google Drive</h4>
                        <p className="text-[10px] text-slate-400">Sync history folders matching community headers.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleFetchDriveFiles()}
                      disabled={workspaceLoading}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition duration-150 cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-slate-150 bg-white"
                    >
                      <RefreshCw size={11} className={workspaceLoading ? 'animate-spin' : ''} />
                      Fetch Files
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-150 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 font-bold border-b border-slate-150">
                        <tr>
                          <th className="p-3">Filename On Drive</th>
                          <th className="p-3">File Category</th>
                          <th className="p-3">Snapshot Created Date</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-slate-600">
                        {googleDriveFiles.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-slate-400 font-medium font-sans">
                              {workspaceLoading ? 'Polling Drive directory...' : 'No OPC logs found under connected Google Drive hierarchy.'}
                            </td>
                          </tr>
                        ) : (
                          googleDriveFiles.map(f => {
                            const isSheet = f.mimeType?.includes('spreadsheet');
                            return (
                              <tr key={f.id} className="hover:bg-slate-50/45 animate-fade">
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <div className={isSheet ? 'text-green-600' : 'text-blue-600'}>
                                      <FileSpreadsheet size={13} />
                                    </div>
                                    <span className="font-bold text-slate-800 truncate max-w-xs">{f.name}</span>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isSheet ? 'bg-green-50 text-green-800' : 'bg-blue-50 text-blue-805 text-blue-800'
                                  }`}>
                                    {isSheet ? 'Google Sheets' : 'System Restore Node'}
                                  </span>
                                </td>
                                <td className="p-3 font-mono text-[10px] text-slate-500">
                                  {new Date(f.createdTime).toLocaleString()}
                                </td>
                                <td className="p-3 text-right whitespace-nowrap space-x-2">
                                  <a 
                                    href={f.webViewLink} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-blue-650 hover:text-blue-800 font-bold cursor-pointer p-1.5 rounded hover:bg-slate-150 hover:bg-slate-100 transition text-[11px]"
                                  >
                                    <Link2 size={11} /> Open Drive File
                                  </a>
                                  <button
                                    onClick={() => setDeleteConfirmationFile(f)}
                                    className="text-red-600 hover:text-red-900 p-1.5 rounded hover:bg-red-50 transition cursor-pointer"
                                    title="Delete file permanently"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
            
          </div>
        )}

        {/* CABINET ASSEMBLY MEETINGS TAB */}
        {activeTab === 'meetings' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold font-serif text-emerald-950">Cabinet Assembly Meetings & Debates</h3>
                <p className="text-xs text-slate-500">
                  Manage council meetings, propose live questions/topics, track ballot distributions, and complete resolutions.
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleMeetingSubmit} className="max-w-2xl bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-4 text-left">
              <h4 className="font-bold text-sm text-slate-800">
                {mId ? 'Modify Legislative Assembly Topic' : 'Schedule New Live Resolution Campaign'}
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Legislative Resolution / Question *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Should we expand repatriation budget limits?"
                    value={mAgenda}
                    onChange={(e) => setMAgenda(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-2 text-xs focus:outline-emerald-800 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Detailed Background Context & Motive Description *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide explanatory briefing..."
                    value={mDescription}
                    onChange={(e) => setMDescription(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-2 text-xs focus:outline-emerald-800 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Assembly State *</label>
                  <select
                    value={mStatus}
                    onChange={(e) => setMStatus(e.target.value as any)}
                    className="bg-white border rounded p-2 text-xs focus:outline-emerald-800 font-sans cursor-pointer"
                  >
                    <option value="scheduled">Scheduled (Archived Draft)</option>
                    <option value="active">Active (Voting Open)</option>
                    <option value="completed">Completed (Voting Blocked / Archived)</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="bg-emerald-900 border border-emerald-950 text-white hover:bg-emerald-800 text-[11px] font-bold py-2 px-4 rounded transition cursor-pointer font-sans shadow-sm"
                  >
                    {mId ? 'Update Proposal' : 'Launch Proposal'}
                  </button>
                  <button
                    type="button"
                    onClick={resetMeetingForm}
                    className="bg-slate-300 hover:bg-slate-400 text-slate-800 text-[11px] font-bold py-2 px-4 rounded transition cursor-pointer font-sans shadow-2xs"
                  >
                    Reset Form
                  </button>
                </div>
              </div>
            </form>

            {/* List */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 border-b bg-slate-50">
                <h4 className="font-bold text-xs text-slate-700">All Assemblies Records ({meetings.length})</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b text-slate-600 font-bold">
                    <tr>
                      <th className="p-3">Agenda / Question</th>
                      <th className="p-3">Motive Background</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Ballots Cast</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-600">
                    {meetings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 italic">No assemblies records catalogued.</td>
                      </tr>
                    ) : (
                      meetings.map((mt) => {
                        const totalVotes = Object.keys(mt.votes || {}).length;
                        return (
                          <tr key={mt.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-bold text-slate-800 max-w-xs truncate">{mt.agenda}</td>
                            <td className="p-3 text-slate-500 max-w-sm truncate">{mt.description}</td>
                            <td className="p-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                mt.status === 'active' 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                  : mt.status === 'completed'
                                  ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                {mt.status}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-700">{totalVotes} members voted</td>
                            <td className="p-3 text-right whitespace-nowrap space-x-2">
                              <button
                                onClick={() => handleEditMeeting(mt)}
                                className="text-blue-600 hover:bg-blue-50 py-1 px-2.5 rounded transition cursor-pointer text-[11px] font-bold font-sans"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteMeeting(mt.id!)}
                                className="text-red-605 text-red-600 hover:bg-red-50 py-1 px-2.5 rounded transition cursor-pointer text-[11px] font-bold font-sans"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* SYSTEM ACTIVITY LOGTAB */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold font-serif text-emerald-950">System Activity Log</h3>
                <p className="text-xs text-slate-500">
                  Immutable audit records of administrative operations, catalogued for compliance, security, and governance.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium font-sans">Real-time Stream</span>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-3.5 font-bold text-slate-700 font-sans uppercase tracking-wider">Timestamp</th>
                      <th className="p-3.5 font-bold text-slate-700 font-sans uppercase tracking-wider">Admin Email</th>
                      <th className="p-3.5 font-bold text-slate-700 font-sans uppercase tracking-wider">Action</th>
                      <th className="p-3.5 font-bold text-slate-700 font-sans uppercase tracking-wider">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {logsLoading ? (
                      <tr>
                        <td colSpan={4} className="p-10 text-center text-slate-400 font-sans">
                          <RefreshCw size={18} className="animate-spin mx-auto text-slate-350 mb-2" />
                          <span>Streaming live activity logs from secure ledger...</span>
                        </td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-10 text-center text-slate-400 font-sans">
                          No audit entries recorded in the current database node yet.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => {
                        let dateFormatted = '';
                        try {
                          if (log.createdAt?.toDate) {
                            dateFormatted = log.createdAt.toDate().toLocaleString();
                          } else if (log.createdAt?.seconds) {
                            dateFormatted = new Date(log.createdAt.seconds * 1000).toLocaleString();
                          } else if (log.createdAt) {
                            dateFormatted = new Date(log.createdAt).toLocaleString();
                          } else {
                            dateFormatted = 'N/A';
                          }
                        } catch (e) {
                          dateFormatted = 'Invalid Date';
                        }
                        return (
                          <tr key={log.id || Math.random().toString()} className="hover:bg-slate-50/40 transition">
                            <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                              {dateFormatted}
                            </td>
                            <td className="p-3.5 font-semibold text-emerald-950 font-sans whitespace-nowrap">
                              {log.adminEmail}
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-bold tracking-wide uppercase font-sans">
                                {log.action}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-700 text-xs font-sans max-w-sm xl:max-w-2xl truncate" title={log.details}>
                              {log.details}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* DRIVE DELETE FILE CONFIRMATION DIALOG MODAL */}
        {deleteConfirmationFile && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-150 animate-fade">
              <div className="flex items-center gap-3 text-red-600">
                <div className="bg-red-50 text-red-700 p-2.5 rounded-full">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-sans">Delete from Drive?</h3>
              </div>
              
              <p className="text-xs text-slate-500 leading-relaxed">
                Confirming dynamic cloud deletion of <strong className="text-slate-800">"{deleteConfirmationFile.name}"</strong>? This will permanently delete this spreadsheet or database backup from Google Drive.
              </p>
              
              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => setDeleteConfirmationFile(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded text-xs transition cursor-pointer border border-slate-205 border-slate-200"
                >
                  Cancel Execution
                </button>
                <button
                  onClick={handleDeleteDriveFileExecution}
                  className="bg-red-700 hover:bg-red-800 text-white font-bold px-4 py-2 rounded text-xs transition cursor-pointer shadow-xs"
                >
                  Delete File Permanently
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Member Profile Modal */}
        {editingMember && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative">
              <button 
                onClick={() => setEditingMember(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                type="button"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-5">
                <Users size={22} className="text-emerald-800" />
                <div>
                  <h3 className="text-lg font-serif text-emerald-950 font-bold">
                    Edit Member Profile
                  </h3>
                  <p className="text-xs text-slate-400">Modify demographic, contact, and administrative details</p>
                </div>
              </div>

              <form onSubmit={handleUpdateMemberSubmit} className="space-y-4 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={editName} 
                      onChange={e => setEditName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-emerald-800 text-xs text-slate-800 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Father's Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={editFather} 
                      onChange={e => setEditFather(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-emerald-800 text-xs text-slate-800 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">CNIC / Identity Card *</label>
                    <input 
                      type="text" 
                      required 
                      value={editCnic} 
                      onChange={e => setEditCnic(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-emerald-800 text-xs text-slate-800 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">District / Tribe *</label>
                    <input 
                      type="text" 
                      required 
                      value={editDistrict} 
                      onChange={e => setEditDistrict(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-emerald-800 text-xs text-slate-800 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number *</label>
                    <input 
                      type="text" 
                      required 
                      value={editPhone} 
                      onChange={e => setEditPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-emerald-800 text-xs text-slate-800 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp (Optional)</label>
                    <input 
                      type="text" 
                      value={editWhatsapp} 
                      onChange={e => setEditWhatsapp(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-emerald-800 text-xs text-slate-800 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Occupation (Optional)</label>
                    <input 
                      type="text" 
                      value={editOccupation} 
                      onChange={e => setEditOccupation(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-emerald-800 text-xs text-slate-800 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">Emergency Contact (Optional)</label>
                    <input 
                      type="text" 
                      value={editEmergency} 
                      onChange={e => setEditEmergency(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-emerald-800 text-xs text-slate-800 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Residential Address *</label>
                  <textarea 
                    required 
                    value={editAddress} 
                    rows={2}
                    onChange={e => setEditAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-emerald-800 text-xs text-slate-800 bg-slate-50/50"
                  />
                </div>

                {/* Edit Payment Receipt verification block */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h6 className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Registration Payment Verification</h6>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1 font-sans">Fee Paid (OMR)</label>
                      <select 
                        value={editFeeAmount} 
                        onChange={e => setEditFeeAmount(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs text-slate-800 bg-white"
                      >
                        <option value="5">5.000 OMR (Standard)</option>
                        <option value="10">10.000 OMR (Premium / Supporter)</option>
                        <option value="3">3.050 OMR (Concessionary)</option>
                        <option value="0">0.000 OMR (Waiver)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1 font-sans">Payment Method</label>
                      <select 
                        value={editPaymentMethod} 
                        onChange={e => setEditPaymentMethod(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs text-slate-800 bg-white"
                      >
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Mobile Wallet">Mobile Wallet</option>
                        <option value="Cash">Cash to Agent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1 font-sans">Reference / Txn ID</label>
                      <input 
                        type="text" 
                        value={editPaymentReference} 
                        onChange={e => setEditPaymentReference(e.target.value)}
                        placeholder="e.g. Reference string"
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs text-slate-800 bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Processing Status</label>
                    <select 
                      value={editStatus} 
                      onChange={e => setEditStatus(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-emerald-800 text-xs text-slate-800 bg-white"
                    >
                      <option value="pending">⏳ Pending Queue</option>
                      <option value="approved">✅ Approved</option>
                      <option value="rejected">❌ Rejected / Void</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Membership ID (Optional/System Issued)</label>
                    <input 
                      type="text" 
                      value={editMembershipId} 
                      onChange={e => setEditMembershipId(e.target.value)}
                      placeholder="e.g. OPC-OM-2026-0001"
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-emerald-800 text-xs text-slate-800 bg-slate-50/50"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Leave blank to let the system generate automatically if status is changed to Approved.</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingMember(null)}
                    className="px-4 py-2 bg-slate-150 hover:bg-slate-200 text-slate-700 font-semibold rounded-md text-xs transition duration-150 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingMemberState}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-950 text-white font-bold rounded-md text-xs transition duration-150 cursor-pointer disabled:opacity-50"
                  >
                    {updatingMemberState ? 'Saving Updates...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* INCIDENT DOCUMENTS MODAL */}
        {activeIncidentDocs && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 overflow-y-auto">
            <div className="bg-white rounded-lg p-5 border hover:border-slate-300 md:p-6 max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative">
              <button 
                onClick={() => setActiveIncidentDocs(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors z-10"
              >
                <X size={20} />
              </button>

              <div className="border-b border-slate-100 pb-3 mb-5">
                <span className="text-[10px] text-emerald-800 uppercase font-bold tracking-wide">Welfare Case Reference</span>
                <h3 className="text-xl font-serif text-emerald-950 font-bold">
                  Welfare Claim Documents Manager
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Manage external verification letters, medical receipts, or welfare grants documents hosted on Google Drive for: <strong className="text-emerald-850 font-bold">{activeIncidentDocs.name}</strong>
                </p>
              </div>

              {incidentDriveError && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-200 mb-4">
                  {incidentDriveError}
                </div>
              )}

              {/* Attach/Select Drive File Controls */}
              <div className="flex justify-between items-center gap-4 bg-slate-50 p-4 border border-slate-150 rounded-xl mb-5">
                <div className="text-[11px] text-slate-500 font-sans leading-relaxed">
                  Directly query and attach external medical files, death certifications, or court orders linked safely directly from your Google Drive.
                </div>
                <button
                  onClick={handleAttachIncidentDriveFile}
                  disabled={isConnectingIncidentDrive}
                  className="flex items-center gap-1.5 bg-emerald-850 hover:bg-emerald-900 text-white font-bold text-xs py-2 px-3.5 rounded-lg shadow-sm font-sans shrink-0 hover:shadow transition duration-155 cursor-pointer disabled:opacity-50"
                >
                  {isConnectingIncidentDrive ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <FolderPlus size={13} />
                      Link Google Drive File
                    </>
                  )}
                </button>
              </div>

              {/* Attachments List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Attached records ({activeIncidentDocs.driveAttachments?.length || 0})</h4>
                
                {!activeIncidentDocs.driveAttachments || activeIncidentDocs.driveAttachments.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                    <FileIcon size={32} className="mx-auto text-slate-350 mb-2" />
                    <p className="text-xs font-semibold text-slate-500">No official document links linked yet.</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Attach medical clearances, receipts, or legal reports above.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {activeIncidentDocs.driveAttachments.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 bg-emerald-50 text-emerald-850 rounded-lg">
                            <FileIcon size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-850 truncate" title={f.name}>
                              {f.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">
                              ID: {f.id}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded transition"
                            title="Open in Google Drive"
                          >
                            <ExternalLink size={15} />
                          </a>
                          <button
                            onClick={() => handleRemoveIncidentDriveFile(f.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                            title="Remove attachment link"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setActiveIncidentDocs(null)}
                  className="px-4 py-2 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold rounded-md text-xs transition duration-150 cursor-pointer"
                >
                  Close Manager
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Dummy constant to prevent undefined compiler crashes since Globe serves inside standard packages
const LocationIcon = Globe;
