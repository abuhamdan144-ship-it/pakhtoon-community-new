import React, { useState, useEffect } from 'react';
import { User, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  collection, doc, addDoc, updateDoc, deleteDoc, setDoc, runTransaction, arrayUnion, Timestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { 
  Member, Donation, CabinetMember, NewsAnnouncement, IncidentReport, EmbassySetting, Election, SponsoredAd 
} from '../types';
import { 
  Users, Award, DollarSign, AlertTriangle, Newspaper, Globe, Vote, Disc, LogOut, CheckCircle2, XCircle, Plus, Trash2, Edit2, Share2, FileSpreadsheet, X, Search, ArrowUpDown, ArrowUp, ArrowDown, Cloud, Database, Link2, RefreshCw, Paperclip, FolderPlus, ExternalLink, File as FileIcon 
} from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'cabinet' | 'donations' | 'incidents' | 'news' | 'embassy' | 'elections' | 'ads' | 'workspace'>('overview');

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
          opcSystem: 'Oman Pakistani Community Executive Panel',
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

  const sortedPending = sortMembersArray(filteredPending);
  const sortedAllMembers = sortMembersArray(filteredAllMembers);

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
          { id: 'cabinet', label: 'Cabinet', icon: Award },
          { id: 'donations', label: 'Donation Ledgers', icon: DollarSign },
          { id: 'incidents', label: 'Welfare Claims', icon: AlertTriangle },
          { id: 'news', label: 'Announcements', icon: Newspaper },
          { id: 'embassy', label: 'Muscat Consulate', icon: LocationIcon },
          { id: 'elections', label: 'Elections & Polls', icon: Vote },
          { id: 'ads', label: 'Sponsor Ads', icon: Disc },
          { id: 'workspace', label: 'Google Sync Hub', icon: Cloud },
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
              <span className="text-sm font-bold text-slate-700 block border-b pb-1.5 mb-3">
                Awaiting Review ({filteredPending.length})
              </span>
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
                      <th className="p-3">Oman Address</th>
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
                      sortedPending.map((m) => (
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
              <div className="flex justify-between items-center border-b pb-1.5 mb-3">
                <span className="text-sm font-bold text-slate-700">
                  All Registry Records ({filteredAllMembers.length})
                </span>
                <button
                  onClick={exportMembers}
                  className="inline-flex items-center gap-1 bg-emerald-850 hover:bg-emerald-950 text-emerald-850 hover:text-white border border-emerald-200 hover:border-emerald-950 px-2.5 py-1 rounded-md text-[11px] font-semibold transition duration-150 cursor-pointer"
                  title="Export full registry log to CSV"
                >
                  <FileSpreadsheet size={12} /> Export CSV
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
                className="inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-3.5 py-2 rounded-md text-xs transition duration-150 cursor-pointer shadow-sm"
              >
                <FileSpreadsheet size={14} /> Export Incidence Claims CSV
              </button>
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
