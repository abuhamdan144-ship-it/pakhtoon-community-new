import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, FileText, Database, Settings, LogOut } from 'lucide-react';
import { collections } from '../firebase/collections';
import { onSnapshot, query, orderBy } from 'firebase/firestore';

const tabs = ['Overview', 'Members', 'Donations', 'Settings'];

export default function Admin() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const q = query(collections.members, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMembers(data);
    });
    return () => unsub();
  }, []);

  if (!isAuthenticated) {
    return <div className="min-h-screen pt-20 flex items-center justify-center">Login required.</div>;
  }

  const approvedMembers = members.filter(m => m.status === 'approved');
  const pendingMembers = members.filter(m => m.status === 'pending');

  return (
    <div className="min-h-screen pt-20 bg-[#f4f7f6]">
      <div className="flex h-[calc(100vh-80px)]">
        
        {/* Sidebar */}
        <div className="w-64 bg-forest-dark text-white p-6 flex flex-col">
          <div className="mb-10">
            <h2 className="text-gold font-serif text-2xl font-bold">Admin Portal</h2>
          </div>
          
          <div className="flex-1 space-y-2">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
                  activeTab === tab 
                  ? 'bg-gold/10 text-gold shadow-[0_0_15px_rgba(212,175,55,0.2)] font-bold border-l-2 border-gold' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab === 'Overview' && <Database size={18} />}
                {tab === 'Members' && <Users size={18} />}
                {tab === 'Donations' && <FileText size={18} />}
                {tab === 'Settings' && <Settings size={18} />}
                {tab}
              </button>
            ))}
          </div>

          <button className="flex items-center gap-3 text-red-400 hover:text-red-300 px-4 py-3">
            <LogOut size={18} /> Logout
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-10 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl font-bold text-gray-800 mb-8">{activeTab}</h1>
              
              {activeTab === 'Overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500 font-bold mb-1">Total Members</p>
                    <p className="text-4xl font-mono text-forest-dark">{approvedMembers.length}</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500 font-bold mb-1">Pending Approval</p>
                    <p className="text-4xl font-mono text-orange-500">{pendingMembers.length}</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500 font-bold mb-1">Total Donations</p>
                    <p className="text-4xl font-mono text-green-600">0 <span className="text-lg">OMR</span></p>
                  </div>
                </div>
              )}

              {activeTab === 'Members' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 text-sm">
                      <tr>
                        <th className="p-4 border-b">ID</th>
                        <th className="p-4 border-b">Name</th>
                        <th className="p-4 border-b">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map(m => (
                        <tr key={m.id} className="border-b">
                          <td className="p-4 font-mono">{m.membershipId || 'PENDING'}</td>
                          <td className="p-4 font-bold">{m.name}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              m.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {m.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
