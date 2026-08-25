import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, FileText, Database, Settings, LogOut } from 'lucide-react';
import { collections } from '../firebase/collections';
import { onSnapshot, query, orderBy } from 'firebase/firestore';

const tabs = ['Overview', 'Members', 'Donations', 'Settings'];

function TabIcon({ tab, size = 17 }) {
  if (tab === 'Overview') return <Database size={size} />;
  if (tab === 'Members') return <Users size={size} />;
  if (tab === 'Donations') return <FileText size={size} />;
  return <Settings size={size} />;
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const q = query(collections.members, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setMembers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  if (!isAuthenticated) {
    return <div className="min-h-screen pt-20 flex items-center justify-center">Login required.</div>;
  }

  const approvedMembers = members.filter(member => member.status === 'approved');
  const pendingMembers = members.filter(member => member.status === 'pending');

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
                {tabs.map(tab => (
                  <button
                    key={tab}
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

            <button
              onClick={() => setIsAuthenticated(false)}
              className="order-2 inline-flex items-center gap-2 self-start rounded-lg border border-red-300/20 px-3 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-400/10 hover:text-red-200 lg:order-3 lg:self-auto"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>

        <main className="mt-7 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7 lg:p-9">
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
                        {members.map(member => (
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
