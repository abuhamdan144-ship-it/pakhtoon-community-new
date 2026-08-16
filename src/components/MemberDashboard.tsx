import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Search, Download, Eye, EyeOff } from 'lucide-react';
import { db } from '../config/firebase'; // Adjust path based on your project
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'approved' | 'pending' | 'rejected' | 'archived';
  joinDate: string;
  district?: string;
  registeredAt?: any;
}

interface CabinetMember {
  id: string;
  name: string;
  position: string;
  email: string;
  phone: string;
  district?: string;
  priority?: number;
}

const MemberDashboard: React.FC = () => {
  const [registeredMembers, setRegisteredMembers] = useState<Member[]>([]);
  const [cabinetMembers, setCabinetMembers] = useState<CabinetMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'registered' | 'cabinet'>('registered');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending' | 'rejected' | 'archived'>('all');
  const [showDetails, setShowDetails] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch Registered Members
      const membersQuery = query(collection(db, 'members'), orderBy('registeredAt', 'desc'));
      const membersSnapshot = await getDocs(membersQuery);
      const membersList: Member[] = membersSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || '',
        email: doc.data().email || '',
        phone: doc.data().phone || '',
        status: doc.data().status || 'pending',
        district: doc.data().district || '',
        joinDate: doc.data().registeredAt?.toDate?.()?.toLocaleDateString() || '',
        registeredAt: doc.data().registeredAt,
      }));

      // Fetch Cabinet Members
      const cabinetQuery = query(
        collection(db, 'cabinet'),
        orderBy('priority', 'asc')
      );
      const cabinetSnapshot = await getDocs(cabinetQuery);
      const cabinetList: CabinetMember[] = cabinetSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || '',
        position: doc.data().position || '',
        email: doc.data().email || '',
        phone: doc.data().phone || '',
        district: doc.data().district || '',
        priority: doc.data().priority || 999,
      }));

      setRegisteredMembers(membersList);
      setCabinetMembers(cabinetList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.error('Error fetching Firebase data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter registered members
  const filteredMembers = registeredMembers.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone.includes(searchQuery);

    const matchesStatus = filterStatus === 'all' || member.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Filter cabinet members
  const filteredCabinet = cabinetMembers.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const downloadAsCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0] || {});
    const csv = [
      headers.join(','),
      ...data.map((row) =>
        headers.map((header) => `"${row[header] || ''}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString()}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
        <div className="max-w-7xl mx-auto text-center py-20">
          <div className="inline-block animate-spin">
            <Users size={40} className="text-blue-400" />
          </div>
          <p className="text-white mt-4">Loading member data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Member Database</h1>
          <p className="text-slate-400">View registered members and cabinet members</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-600">
          <button
            onClick={() => setActiveTab('registered')}
            className={`px-6 py-3 font-semibold transition-all border-b-2 ${
              activeTab === 'registered'
                ? 'text-blue-400 border-blue-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <Users className="inline mr-2" size={18} />
            Registered Members ({registeredMembers.length})
          </button>
          <button
            onClick={() => setActiveTab('cabinet')}
            className={`px-6 py-3 font-semibold transition-all border-b-2 ${
              activeTab === 'cabinet'
                ? 'text-blue-400 border-blue-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <UserCheck className="inline mr-2" size={18} />
            Cabinet Members ({cabinetMembers.length})
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8 border border-slate-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-3 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-lg pl-12 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {activeTab === 'registered' && (
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="archived">Archived</option>
              </select>
            )}

            <button
              onClick={() =>
                downloadAsCSV(
                  activeTab === 'registered' ? filteredMembers : filteredCabinet,
                  activeTab === 'registered' ? 'members' : 'cabinet'
                )
              }
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Download size={18} />
              Export
            </button>
          </div>
        </div>

        {/* Registered Members Tab */}
        {activeTab === 'registered' && (
          <div className="space-y-4">
            {filteredMembers.length === 0 ? (
              <div className="bg-slate-800 rounded-lg p-12 text-center border border-slate-700">
                <Users size={40} className="mx-auto text-slate-400 mb-4" />
                <p className="text-slate-400">No members found</p>
              </div>
            ) : (
              filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-slate-800 rounded-lg border border-slate-700 hover:border-blue-500 transition-all overflow-hidden"
                >
                  <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                      <p className="text-slate-400 text-sm">{member.email}</p>
                      <p className="text-slate-400 text-sm">{member.phone}</p>
                      {member.district && (
                        <p className="text-slate-400 text-sm">📍 {member.district}</p>
                      )}
                      <p className="text-slate-500 text-xs mt-2">Joined: {member.joinDate}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(member.status)}`}>
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </span>

                      <button
                        onClick={() => setShowDetails(showDetails === member.id ? null : member.id)}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        {showDetails === member.id ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {showDetails === member.id && (
                    <div className="bg-slate-700 px-6 py-4 border-t border-slate-600 text-sm text-slate-300">
                      <p>
                        <strong>ID:</strong> {member.id}
                      </p>
                      <p>
                        <strong>Status:</strong> {member.status}
                      </p>
                      {member.district && (
                        <p>
                          <strong>District:</strong> {member.district}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Cabinet Members Tab */}
        {activeTab === 'cabinet' && (
          <div className="space-y-4">
            {filteredCabinet.length === 0 ? (
              <div className="bg-slate-800 rounded-lg p-12 text-center border border-slate-700">
                <UserCheck size={40} className="mx-auto text-slate-400 mb-4" />
                <p className="text-slate-400">No cabinet members found</p>
              </div>
            ) : (
              filteredCabinet.map((member) => (
                <div
                  key={member.id}
                  className="bg-slate-800 rounded-lg border border-slate-700 hover:border-blue-500 transition-all overflow-hidden"
                >
                  <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                      <p className="text-blue-400 text-sm font-semibold">{member.position}</p>
                      <p className="text-slate-400 text-sm">{member.email}</p>
                      <p className="text-slate-400 text-sm">{member.phone}</p>
                      {member.district && (
                        <p className="text-slate-400 text-sm">📍 {member.district}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowDetails(showDetails === member.id ? null : member.id)}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        {showDetails === member.id ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {showDetails === member.id && (
                    <div className="bg-slate-700 px-6 py-4 border-t border-slate-600 text-sm text-slate-300">
                      <p>
                        <strong>ID:</strong> {member.id}
                      </p>
                      <p>
                        <strong>Position:</strong> {member.position}
                      </p>
                      {member.priority && (
                        <p>
                          <strong>Priority:</strong> {member.priority}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <p className="text-slate-400 text-sm">Total Registered Members</p>
            <p className="text-4xl font-bold text-blue-400">{registeredMembers.length}</p>
            {registeredMembers.length > 0 && (
              <div className="mt-4 text-xs text-slate-400 space-y-1">
                <p>✅ Approved: {registeredMembers.filter((m) => m.status === 'approved').length}</p>
                <p>⏳ Pending: {registeredMembers.filter((m) => m.status === 'pending').length}</p>
              </div>
            )}
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <p className="text-slate-400 text-sm">Total Cabinet Members</p>
            <p className="text-4xl font-bold text-green-400">{cabinetMembers.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;
