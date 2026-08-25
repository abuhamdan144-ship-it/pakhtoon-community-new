import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Database,
  FileText,
  LoaderCircle,
  LogIn,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { onSnapshot, orderBy, query } from 'firebase/firestore';
import { auth } from '../firebase/config';
import { collections } from '../firebase/collections';

const tabs = ['Overview', 'Members', 'Donations', 'Settings'];
const AUTHORISED_ADMIN_EMAILS = new Set([
  'abuhamdan144@gmail.com',
  'admin@opc.org',
  'admin@opc.com',
  'malakabbas47@gmail.com',
]);

function TabIcon({ tab, size = 17 }) {
  if (tab === 'Overview') return <Database size={size} />;
  if (tab === 'Members') return <Users size={size} />;
  if (tab === 'Donations') return <FileText size={size} />;
  return <Settings size={size} />;
}

function isAuthorisedAdmin(user) {
  const email = user?.email?.trim().toLowerCase();
  return Boolean(email && AUTHORISED_ADMIN_EMAILS.has(email));
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState('');
  const [dataError, setDataError] = useState('');
  const [members, setMembers] = useState([]);

  const authorised = useMemo(() => isAuthorisedAdmin(user), [user]);

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
      setMembers([]);
      setDataError('');
      return undefined;
    }

    setDataError('');
    const memberQuery = query(collections.members, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      memberQuery,
      (snapshot) => {
        setMembers(snapshot.docs.map((memberDoc) => ({ id: memberDoc.id, ...memberDoc.data() })));
      },
      () => {
        setDataError('Your signed-in account is not permitted to read membership records.');
        setMembers([]);
      },
    );

    return () => unsubscribe();
  }, [authorised]);

  const handleSignIn = async () => {
    setSigningIn(true);
    setAuthError('');

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const credential = await signInWithPopup(auth, provider);

      if (!isAuthorisedAdmin(credential.user)) {
        await signOut(auth);
        setAuthError('This Google account is not authorised to access the OPC administrator portal.');
      }
    } catch (error) {
      setAuthError(error?.code === 'auth/popup-closed-by-user'
        ? 'Sign-in was cancelled. Please try again when you are ready.'
        : 'Secure sign-in could not be completed. Please try again or confirm Google sign-in is enabled.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setMembers([]);
    setActiveTab('Overview');
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#f4f7f6] pt-20">
        <div className="mx-auto flex max-w-xl items-center justify-center px-4 py-24">
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-5 text-gray-700 shadow-sm">
            <LoaderCircle className="animate-spin text-gold" size={22} />
            <span className="font-semibold">Checking secure administrator access…</span>
          </div>
        </div>
      </div>
    );
  }

  if (!authorised) {
    return (
      <div className="min-h-screen bg-[#f4f7f6] pt-20">
        <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center px-4 py-12 sm:px-6">
          <section className="w-full overflow-hidden rounded-3xl border border-white/10 bg-forest-dark text-white shadow-2xl shadow-forest-dark/20">
            <div className="border-b border-white/10 bg-gradient-to-r from-forest-dark to-[#0c5042] px-7 py-8 sm:px-9">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold text-forest-dark shadow-lg shadow-black/20">
                <ShieldCheck size={26} strokeWidth={2.2} />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">Protected workspace</p>
              <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight">OPC Administrator Portal</h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/70">
                Membership data is protected. Sign in with an authorised Google account to continue.
              </p>
            </div>

            <div className="px-7 py-7 sm:px-9">
              {authError && (
                <div className="mb-5 flex gap-3 rounded-xl border border-red-300/25 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-100">
                  <AlertTriangle className="mt-0.5 shrink-0 text-red-300" size={17} />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSignIn}
                disabled={signingIn}
                className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-gold px-5 py-3.5 font-bold text-forest-dark transition hover:bg-[#ecd477] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {signingIn ? <LoaderCircle className="animate-spin" size={19} /> : <LogIn size={19} />}
                {signingIn ? 'Signing in securely…' : 'Sign in with Google'}
              </button>

              <p className="mt-5 text-center text-xs leading-5 text-white/45">
                Access is restricted to authorised OPC administrators. Member records are not made public.
              </p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const approvedMembers = members.filter((member) => member.status === 'approved');
  const pendingMembers = members.filter((member) => member.status === 'pending');

  return (
    <div className="min-h-screen bg-[#f4f7f6] pt-20">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-2xl border border-white/10 bg-forest-dark text-white shadow-xl shadow-forest-dark/15">
          <div className="flex flex-col gap-5 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold text-lg font-black text-forest-dark">OPC</div>
              <div>
                <p className="font-serif text-xl font-bold leading-none text-gold">Admin Portal</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.17em] text-white/55">Oman Pakhtoon Community</p>
              </div>
            </div>

            <div className="order-3 -mx-5 overflow-x-auto border-t border-white/10 px-5 pt-4 lg:order-2 lg:mx-0 lg:flex-1 lg:border-0 lg:px-6 lg:pt-0">
              <nav className="flex min-w-max items-center gap-2" aria-label="Administrator dashboard sections">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                      activeTab === tab
                        ? 'bg-gold text-forest-dark shadow-[0_0_18px_rgba(212,175,55,0.24)]'
                        : 'text-white/65 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <TabIcon tab={tab} />
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            <div className="order-2 flex items-center gap-3 self-start lg:order-3 lg:self-auto">
              <span className="hidden max-w-48 truncate text-xs text-white/55 sm:inline">{user.email}</span>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 rounded-lg border border-red-300/20 px-3 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-400/10 hover:text-red-200"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="mt-7 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7 lg:p-9">
          {dataError && (
            <div className="mb-7 flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <AlertTriangle className="mt-0.5 shrink-0" size={17} />
              <span>{dataError}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Administrator workspace</p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-800">{activeTab}</h1>
                </div>
                {activeTab === 'Overview' && <p className="text-sm text-gray-500">Live community metrics from Firestore</p>}
              </div>

              {activeTab === 'Overview' && (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-white to-[#f5faf8] p-6 shadow-sm">
                    <p className="mb-2 text-sm font-bold text-gray-500">Approved Members</p>
                    <p className="font-mono text-4xl font-bold text-forest-dark">{approvedMembers.length}</p>
                    <p className="mt-2 text-xs text-gray-400">Ready for community services</p>
                  </div>
                  <div className="rounded-xl border border-orange-100 bg-gradient-to-br from-white to-orange-50 p-6 shadow-sm">
                    <p className="mb-2 text-sm font-bold text-gray-500">Pending Approval</p>
                    <p className="font-mono text-4xl font-bold text-orange-500">{pendingMembers.length}</p>
                    <p className="mt-2 text-xs text-gray-400">Awaiting administrative review</p>
                  </div>
                  <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50 p-6 shadow-sm">
                    <p className="mb-2 text-sm font-bold text-gray-500">Total Donations</p>
                    <p className="font-mono text-4xl font-bold text-emerald-600">0 <span className="text-lg">OMR</span></p>
                    <p className="mt-2 text-xs text-gray-400">Welfare fund record</p>
                  </div>
                </div>
              )}

              {activeTab === 'Members' && (
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left">
                      <thead className="bg-gray-50 text-sm text-gray-600">
                        <tr>
                          <th className="border-b px-5 py-4 font-bold">Membership ID</th>
                          <th className="border-b px-5 py-4 font-bold">Name</th>
                          <th className="border-b px-5 py-4 font-bold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((member) => (
                          <tr key={member.id} className="border-b last:border-0 hover:bg-gray-50/70">
                            <td className="px-5 py-4 font-mono text-sm text-gray-600">{member.membershipId || 'PENDING'}</td>
                            <td className="px-5 py-4 font-bold text-gray-800">{member.name}</td>
                            <td className="px-5 py-4">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                member.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                              }`}>
                                {(member.status || 'pending').toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'Donations' && (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center text-gray-500">
                  Donation reporting will appear here when welfare fund records are connected.
                </div>
              )}

              {activeTab === 'Settings' && (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center text-gray-500">
                  Administrator settings will appear here.
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
