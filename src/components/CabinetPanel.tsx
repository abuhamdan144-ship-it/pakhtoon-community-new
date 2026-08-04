import React, { useState } from 'react';
import { CabinetMember, Member, CabinetMeeting } from '../types';
import { 
  Search, Phone, Mail, Award, Users, ShieldAlert, CheckCircle,
  ThumbsUp, ThumbsDown, MessageSquare, Plus, Check,
  Clock, Lock, Send, AlertCircle, Trash2, CheckSquare
} from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';

interface CabinetPanelProps {
  cabinet: CabinetMember[];
  members: Member[];
  meetings?: CabinetMeeting[];
  currentUser?: any;
  isAdmin?: boolean;
}

const POSITION_ORDER = [
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
  
  const idx = POSITION_ORDER.indexOf(cleanPos);
  if (idx !== -1) return idx;

  if (cleanPos.includes('chairman')) return 0;
  if (cleanPos.includes('president')) return 3;
  if (cleanPos.includes('secretary')) return 8;
  if (cleanPos.includes('organizer')) return 13;
  if (cleanPos.includes('member') || cleanPos.includes('committee')) return 14;

  return POSITION_ORDER.length; // fallback
};

export default function CabinetPanel({ 
  cabinet, 
  members,
  meetings = [],
  currentUser,
  isAdmin = false
}: CabinetPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'executive' | 'registered' | 'assembly'>('executive');

  // Legislative Form States
  const [newAgenda, setNewAgenda] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);

  // Authenticated cabinet member finder
  const loggedInCabinetMember = cabinet.find(
    (cm) => cm.email && cm.email.toLowerCase().trim() === currentUser?.email?.toLowerCase().trim()
  );
  const isCabinetMember = !!loggedInCabinetMember || isAdmin;

  // Filter and sort Cabinet Members by Position priority
  const sortedCabinet = [...cabinet]
    .filter(cm => {
      const query = searchQuery.toLowerCase();
      return (
        cm.name.toLowerCase().includes(query) ||
        cm.position.toLowerCase().includes(query) ||
        (cm.phone && cm.phone.includes(query)) ||
        (cm.email && cm.email.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      const priorityA = getPositionPriority(a.position);
      const priorityB = getPositionPriority(b.position);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      return a.name.localeCompare(b.name);
    });

  // Approved general members
  const approvedMembers = members.filter(m => m.status === 'approved');
  const filteredGeneralMembers = approvedMembers.filter(m => {
    const query = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(query) ||
      m.father.toLowerCase().includes(query) ||
      m.district.toLowerCase().includes(query) ||
      m.phone.includes(query) ||
      (m.cnic && m.cnic.includes(query))
    );
  });

  // Assembly topic / question submit handler
  const handleSubmitTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgenda.trim()) {
      alert('Please specify a legislative topic or resolution question.');
      return;
    }
    if (!newDescription.trim()) {
      alert('Please provide detailed contextual briefing for this topic.');
      return;
    }
    setSubmitting(true);
    try {
      const topicData = {
        agenda: newAgenda.trim(),
        description: newDescription.trim(),
        status: 'active',
        votes: {},
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'cabinet_meetings'), topicData);
      setNewAgenda('');
      setNewDescription('');
      setFormOpen(false);
      alert('Legislative assembly topic successfully proposed for vote!');
    } catch (err: any) {
      console.error('Error creating topic:', err);
      alert('Failed to publish proposal: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Vote cast handler
  const handleCastVote = async (topicId: string, choice: 'Approve' | 'Reject' | 'Abstain') => {
    if (!currentUser) {
      alert('Please sign in to cast your legislative vote.');
      return;
    }
    if (!isCabinetMember) {
      alert('Only verified Executive Cabinet members are permitted to vote in this assembly.');
      return;
    }
    const userEmail = currentUser.email?.toLowerCase().trim();
    if (!userEmail) {
      alert('Unable to retrieve your email address for validation.');
      return;
    }

    setVotingId(topicId);
    try {
      const topic = meetings.find(m => m.id === topicId);
      if (!topic) return;

      const updatedVotes = { ...(topic.votes || {}) };
      const safeEmailKey = userEmail.replace(/\./g, '_');
      updatedVotes[safeEmailKey] = choice;

      await updateDoc(doc(db, 'cabinet_meetings', topicId), {
        votes: updatedVotes
      });
    } catch (err: any) {
      console.error('Error casting vote:', err);
      alert('Failed to record vote: ' + err.message);
    } finally {
      setVotingId(null);
    }
  };

  // Close poll handler for admin
  const handleCloseTopic = async (topicId: string) => {
    if (!confirm('Are you sure you want to close this poll/topic and finalize the resolution? After closing, no more votes can be cast.')) {
      return;
    }
    try {
      await updateDoc(doc(db, 'cabinet_meetings', topicId), {
        status: 'completed',
        completedAt: new Date().toISOString()
      });
      alert('Resolution finalized and archived.');
    } catch (err: any) {
      console.error('Error closing topic:', err);
      alert('Failed to close topic: ' + err.message);
    }
  };

  // Helper to render vote breakdowns
  const renderVoteBreakdown = (votesMap: { [email: string]: 'Approve' | 'Reject' | 'Abstain' } = {}) => {
    const keys = Object.keys(votesMap);
    if (keys.length === 0) {
      return (
        <div className="p-4 bg-slate-50 border border-dashed rounded-xl text-center">
          <p className="text-xs text-slate-400 font-sans italic">No legislative votes have been registered yet.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        {keys.map((safeEmailKey) => {
          const voteVal = votesMap[safeEmailKey];
          const originalEmail = safeEmailKey.replace(/_/g, '.');
          const officer = cabinet.find(
            (cm) => cm.email && cm.email.toLowerCase().trim() === originalEmail
          );

          return (
            <div 
              key={safeEmailKey} 
              className="flex items-center justify-between p-2.5 border border-slate-100 rounded-xl bg-slate-50/50"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {officer?.photo ? (
                  <img src={officer.photo} alt={officer.name} className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 font-serif flex items-center justify-center text-xs shrink-0 font-bold border border-emerald-100">
                    {officer?.name?.[0] || '?'}
                  </div>
                )}
                <div className="text-left min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate leading-none mb-1">{officer?.name || 'Unknown Officer'}</p>
                  <p className="text-[10px] text-slate-400 truncate font-mono leading-none">{officer?.position || originalEmail}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 select-none ${
                voteVal === 'Approve' 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                  : voteVal === 'Reject'
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {voteVal === 'Approve' ? 'Agree' : voteVal === 'Reject' ? 'Disagree' : 'Abstain'}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const activeTopics = meetings.filter(m => m.status === 'active');
  const completedTopics = meetings.filter(m => m.status === 'completed');

  return (
    <div className="space-y-6 fade-in text-left">
      
      {/* Page Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto mb-8">
        <h2 className="text-3xl sm:text-4xl font-serif font-extrabold text-emerald-950 text-center w-full">Community Directory</h2>
        <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed text-center">
          Access the authorized database of Pakhtoon Community representatives, Cabinet officers, and community members.
        </p>
      </div>

      {/* Sub-Tabs Selector & Search box */}
      <div className="bg-white border p-4 sm:p-5 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          
          {/* Sub-Tabs Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto font-sans">
            <button
              onClick={() => { setActiveSubTab('executive'); setSearchQuery(''); }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeSubTab === 'executive'
                  ? 'bg-emerald-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Award size={15} />
              Executive Cabinet ({cabinet.length})
            </button>
            <button
              onClick={() => { setActiveSubTab('registered'); setSearchQuery(''); }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeSubTab === 'registered'
                  ? 'bg-emerald-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users size={15} />
              Verified Members ({approvedMembers.length})
            </button>
            <button
              onClick={() => { setActiveSubTab('assembly'); setSearchQuery(''); }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeSubTab === 'assembly'
                  ? 'bg-emerald-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <MessageSquare size={15} />
              Cabinet Assembly ({meetings.length})
            </button>
          </div>

          {/* Search Inputs */}
          {activeSubTab !== 'assembly' && (
            <div className="relative w-full sm:w-72 font-sans">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder={`Search ${activeSubTab === 'executive' ? 'officers...' : 'verified members...'}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-emerald-800 transition"
              />
            </div>
          )}

        </div>
      </div>

      {/* SUB TAB CONTENT */}
      {activeSubTab === 'executive' && (
        <div className="space-y-6">
          {sortedCabinet.length === 0 ? (
            <div className="p-12 bg-white border border-slate-150 rounded-2xl text-center space-y-2">
              <ShieldAlert className="mx-auto text-slate-300" size={32} />
              <p className="text-slate-400 font-serif font-medium text-sm">No Cabinet officers found matching terms.</p>
              <p className="text-xs text-slate-400">Try refining search parameters or clearing filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 font-sans">
              {sortedCabinet.map((cm, idx) => {
                const priority = getPositionPriority(cm.position);
                const isTopOfficer = priority <= 2;

                return (
                  <div 
                    key={cm.id || idx} 
                    className={`bg-white border rounded-2xl shadow-xs hover:shadow-md transition duration-200 overflow-hidden flex flex-col items-center p-6 text-center text-slate-800 space-y-4 relative ${
                      isTopOfficer ? 'border-amber-400 bg-amber-500/5' : 'border-slate-150'
                    }`}
                  >
                    <div className="absolute top-3 right-3 select-none">
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                        Rank #{idx + 1}
                      </span>
                    </div>

                    {cm.photo ? (
                      <img 
                        src={cm.photo} 
                        alt={cm.name} 
                        className={`w-24 h-24 rounded-full object-cover mx-auto transition-transform duration-200 ${
                          isTopOfficer ? 'border-4 border-amber-400' : 'border-4 border-emerald-900/10 shadow-xs'
                        }`}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className={`w-24 h-24 rounded-full flex items-center justify-center font-bold font-serif text-3xl mx-auto shadow-inner ${
                        isTopOfficer ? 'bg-amber-100 border-2 border-amber-300 text-amber-800' : 'bg-emerald-50 border border-emerald-100 text-emerald-800'
                      }`}>
                        {cm.name[0]}
                      </div>
                    )}

                    <div className="space-y-1">
                      <h4 className="font-serif font-bold text-emerald-950 text-base leading-snug">{cm.name}</h4>
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                        isTopOfficer ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-emerald-50 text-emerald-990 border border-emerald-100'
                      }`}>
                        {cm.position}
                      </span>
                    </div>

                    <div className="w-full border-t border-slate-100 pt-3 space-y-2 text-xs font-mono text-slate-550 select-all">
                      {cm.phone && (
                        <div className="flex items-center justify-center gap-1.5">
                          <Phone size={12} className="text-slate-400" />
                          <a href={`tel:${cm.phone}`} className="hover:text-emerald-800 font-semibold">{cm.phone}</a>
                        </div>
                      )}
                      {cm.email ? (
                        <div className="flex items-center justify-center gap-1.5 truncate max-w-full">
                          <Mail size={12} className="text-slate-400 shrink-0" />
                          <a href={`mailto:${cm.email}`} className="hover:text-emerald-800 truncate font-semibold lowercase text-[10px]">{cm.email}</a>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-300/80 uppercase tracking-widest font-sans italic">No Email Provided</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'registered' && (
        <div className="space-y-6">
          {filteredGeneralMembers.length === 0 ? (
            <div className="p-12 bg-white border border-slate-150 rounded-2xl text-center space-y-2">
              <ShieldAlert className="mx-auto text-slate-300" size={32} />
              <p className="text-slate-400 font-serif font-medium text-sm">No registered community members found matching terms.</p>
              <p className="text-xs text-slate-400">Try searching for other KPK districts, phone configurations, or names.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-xs font-sans">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold select-none">
                      <th className="p-4">Membership Card</th>
                      <th className="p-4">Full Member Name</th>
                      <th className="p-4">Father Name</th>
                      <th className="p-4">District (KPK)</th>
                      <th className="p-4">Emergency Contact</th>
                      <th className="p-4 text-center">Verification Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 select-all">
                    {filteredGeneralMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-mono font-bold text-emerald-900">
                          {m.membershipId || (
                            <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-normal">Pending Issue</span>
                          )}
                        </td>
                        <td className="p-4 font-bold text-slate-900">
                          {m.name}
                        </td>
                        <td className="p-4 font-medium text-slate-500">{m.father}</td>
                        <td className="p-4">
                          <span className="bg-emerald-50 text-emerald-900 border border-emerald-100 px-2 py-0.5 rounded font-bold text-[10px] tracking-wide uppercase">
                             {m.district}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-medium text-slate-500">
                          {m.phone}
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                            <CheckCircle size={10} className="text-emerald-700" />
                            VERIFIED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CABINET ASSEMBLY PORTAL */}
      {activeSubTab === 'assembly' && (
        <div className="space-y-6 font-sans">
          
          {/* User Status / Credential Alert block */}
          <div className="bg-white border rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${isCabinetMember ? 'bg-emerald-50 text-emerald-800' : currentUser ? 'bg-blue-50 text-blue-800' : 'bg-slate-105 bg-slate-100 text-slate-550'}`}>
                {isCabinetMember ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              </div>
              <div className="text-left">
                <h4 className="font-bold text-sm text-slate-800">
                  {isCabinetMember ? 'Authorized Cabinet Member Access' : currentUser ? 'Assembly General Observer' : 'Sign In Required for Assembly'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  {isCabinetMember 
                    ? `Verified Session: ${loggedInCabinetMember?.name || 'Administrator'} (${loggedInCabinetMember?.position || 'Admin Executive'}). You are cleared to submit assembly questions and vote are set to agree/disagree.`
                    : currentUser
                    ? `Observer mode: Logged in as ${currentUser.email}. You can view the legislative proposals and debates, but voting & creating is restricted to checked cabinet members.`
                    : 'Access requires authentication. Use the "Sign In" button in the community header bar to identify yourself.'
                  }
                </p>
              </div>
            </div>

            {/* Proposal Add trigger */}
            {isCabinetMember && (
              <button
                onClick={() => setFormOpen(!formOpen)}
                className="w-full sm:w-auto bg-emerald-900 border border-emerald-950 hover:bg-emerald-800 text-amber-300 text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition duration-150 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                <Plus size={14} className={formOpen ? 'rotate-45 transition-transform' : 'transition-transform'} />
                {formOpen ? 'Collapse Form' : 'Propose Topic / Question'}
              </button>
            )}
          </div>

          {/* New Legislative Proposal Form */}
          {isCabinetMember && formOpen && (
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-inner space-y-4 animate-fade">
              <div className="border-b pb-2">
                <h4 className="font-bold text-sm text-emerald-950">Add Assembly Question & Legislative Resolution</h4>
                <p className="text-[11px] text-slate-500">Pose an official question to the Executive Cabinet. Results are tabulated in real-time.</p>
              </div>

              <form onSubmit={handleSubmitTopic} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Proposal Topic / Main Question *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Should we approve 500 OMR from emergency reserves for repatriation support in Ruwi?"
                    value={newAgenda}
                    onChange={(e) => setNewAgenda(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs focus:outline-emerald-800 shadow-2xs font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contextual Background & Motive Briefing *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide a detailed brief of why we are discussing this. Be explicit regarding budgets, timeframes, and responsibilities so that officers can make an informed choice."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs focus:outline-emerald-800 shadow-2xs font-sans"
                  />
                </div>

                <div className="flex justify-end gap-3 font-sans pt-2">
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold py-2 px-4 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-emerald-900 text-white hover:bg-emerald-800 disabled:bg-slate-300 text-xs font-bold py-2 px-5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                  >
                    {submitting ? 'Publishing...' : 'Publish Proposed Question'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ACTIVE RESOLUTION LISTINGS */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Clock size={16} className="text-emerald-800" />
              <h3 className="font-serif font-bold text-emerald-950 text-lg">Active Assembly Debates ({activeTopics.length})</h3>
            </div>

            {activeTopics.length === 0 ? (
              <div className="p-12 bg-white border border-dashed rounded-2xl text-center space-y-2">
                <p className="text-slate-400 text-sm font-sans italic">There are no active legislative debates at this time.</p>
                <p className="text-xs text-slate-400">Cabinet officers can propose a new topic above.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {activeTopics.map((topic) => {
                  const votesObj = topic.votes || {};
                  const votersCount = Object.keys(votesObj).length;
                  const agreeVotes = Object.values(votesObj).filter(v => v === 'Approve').length;
                  const disagreeVotes = Object.values(votesObj).filter(v => v === 'Reject').length;
                  const abstainVotes = Object.values(votesObj).filter(v => v === 'Abstain').length;

                  // Percentages for beautiful visual rendering
                  const totalYesNo = agreeVotes + disagreeVotes;
                  const agreePct = totalYesNo > 0 ? (agreeVotes / totalYesNo) * 100 : 0;
                  const disagreePct = totalYesNo > 0 ? (disagreeVotes / totalYesNo) * 100 : 0;

                  // Check if the current user has voted
                  const currentUserSafeKey = currentUser?.email?.toLowerCase().trim().replace(/\./g, '_');
                  const currentUserVote = currentUserSafeKey ? (votesObj[currentUserSafeKey] as any) : null;

                  return (
                    <div key={topic.id} className="bg-white border rounded-2xl shadow-xs overflow-hidden flex flex-col font-sans hover:shadow-sm transition">
                      <div className="bg-emerald-905 bg-emerald-900 p-4 shrink-0 flex items-center justify-between text-white select-none">
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-800 text-emerald-100 font-bold border border-emerald-700 text-[10px] tracking-wider uppercase px-2 py-0.5 rounded">
                            Active Debate
                          </span>
                          <span className="text-slate-200 text-xs font-mono">
                            Proposed: {new Date(topic.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => handleCloseTopic(topic.id!)}
                            className="bg-amber-300 text-emerald-950 hover:bg-amber-400 text-[10px] font-black uppercase tracking-wider py-1 px-3 rounded-lg cursor-pointer transition shadow-xs"
                          >
                            Close & Archival
                          </button>
                        )}
                      </div>

                      <div className="p-6 space-y-4">
                        <div className="space-y-2 text-left">
                          <h4 className="text-emerald-950 text-base sm:text-lg font-bold leading-tight font-serif select-text">
                            {topic.agenda}
                          </h4>
                          <p className="text-slate-600 text-xs leading-relaxed font-sans select-text whitespace-pre-wrap bg-slate-50 border p-4 rounded-xl">
                            {topic.description}
                          </p>
                        </div>

                        {/* Legislative Vote Visual Gauge Bars */}
                        <div className="space-y-3 bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                            <span className="flex items-center gap-1 text-emerald-800">
                              <ThumbsUp size={12} /> AGREE ({agreeVotes})
                            </span>
                            <span className="flex items-center gap-1 text-rose-850 text-rose-800">
                              DISAGREE ({disagreeVotes}) <ThumbsDown size={12} />
                            </span>
                          </div>

                          <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
                            {totalYesNo === 0 ? (
                              <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                                <span className="text-[8px] text-slate-400 font-black uppercase select-none">Pending First Ballot</span>
                              </div>
                            ) : (
                              <>
                                <div style={{ width: `${agreePct}%` }} className="bg-emerald-600 h-full transition-all duration-300" />
                                <div style={{ width: `${disagreePct}%` }} className="bg-rose-500 h-full transition-all duration-300" />
                              </>
                            )}
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                            <span>{agreePct.toFixed(0)}% Agree Support</span>
                            <span>{abstainVotes > 0 && `${abstainVotes} abstained`}</span>
                            <span>{disagreePct.toFixed(0)}% Disagree Support</span>
                          </div>
                        </div>

                        {/* Interactive ballot controls */}
                        {isCabinetMember ? (
                          <div className="border border-emerald-900/10 bg-emerald-500/5 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-left">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                                <CheckSquare size={13} className="text-emerald-700 shrink-0" />
                                Cast Executive Council Ballot
                              </p>
                              <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                                {currentUserVote 
                                  ? `Your recorded vote is: ${currentUserVote === 'Approve' ? 'AGREE / APPROVE' : currentUserVote === 'Reject' ? 'DISAGREE / REJECT' : 'ABSTAIN'}. Changing choice updates results immediately.`
                                  : 'Pick agreement. Your verified name record will be mapped on the ledger below.'
                                }
                              </p>
                            </div>

                            <div className="flex gap-2 w-full sm:w-auto shrink-0 font-sans">
                              <button
                                onClick={() => handleCastVote(topic.id!, 'Approve')}
                                disabled={votingId === topic.id}
                                className={`flex-1 sm:flex-initial text-xs font-extrabold px-3 py-2 rounded-xl border flex items-center justify-center gap-1 transition cursor-pointer select-none shadow-2xs ${
                                  currentUserVote === 'Approve'
                                    ? 'bg-emerald-750 bg-emerald-700 border-emerald-900 text-white'
                                    : 'bg-white border-slate-200 text-emerald-850 hover:bg-emerald-50'
                                }`}
                              >
                                <ThumbsUp size={11} />
                                Agree
                              </button>
                              <button
                                onClick={() => handleCastVote(topic.id!, 'Reject')}
                                disabled={votingId === topic.id}
                                className={`flex-1 sm:flex-initial text-xs font-extrabold px-3 py-2 rounded-xl border flex items-center justify-center gap-1 transition cursor-pointer select-none shadow-2xs ${
                                  currentUserVote === 'Reject'
                                    ? 'bg-rose-750 bg-rose-700 border-rose-900 text-white'
                                    : 'bg-white border-slate-200 text-rose-850 hover:bg-rose-50'
                                }`}
                              >
                                <ThumbsDown size={11} />
                                Disagree
                              </button>
                              <button
                                onClick={() => handleCastVote(topic.id!, 'Abstain')}
                                disabled={votingId === topic.id}
                                className={`flex-1 sm:flex-initial text-xs font-extrabold px-3 py-2 rounded-xl border flex items-center justify-center gap-1 transition cursor-pointer select-none shadow-2xs ${
                                  currentUserVote === 'Abstain'
                                    ? 'bg-amber-700 border-amber-900 text-white'
                                    : 'bg-white border-slate-200 text-amber-800 hover:bg-amber-50'
                                }`}
                              >
                                Abstain
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl flex items-center gap-2 text-left">
                            <Lock size={14} className="text-slate-450 shrink-0" />
                            <p className="text-[11px] text-slate-500 font-sans">
                              {currentUser 
                                ? 'Only recognized cabinet officers whose Google account email is listed in the cabinet repository have vote authorization.'
                                : 'Please sign in with your verified Google email account to access voting options.'
                              }
                            </p>
                          </div>
                        )}

                        {/* Votes Ledger Breakdown toggler/header */}
                        <div className="pt-2 text-left">
                          <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                            <Users size={12} />
                            Legislative Voters Roll Ledger ({votersCount})
                          </h5>
                          {renderVoteBreakdown(topic.votes)}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* HISTORICAL RESOLUTIONS ARCHIVE */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2 border-b border-slate-150 pb-2">
              <CheckCircle size={16} className="text-slate-500" />
              <h3 className="font-serif font-bold text-slate-750 text-lg">Resolved Resolutions Archive ({completedTopics.length})</h3>
            </div>

            {completedTopics.length === 0 ? (
              <div className="p-8 bg-slate-50 border border-dashed rounded-2xl text-center">
                <p className="text-slate-400 text-xs font-sans italic">No finalized legislative resolutions reside in the historical archive yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedTopics.map((topic) => {
                  const votesObj = topic.votes || {};
                  const agreeVotes = Object.values(votesObj).filter(v => v === 'Approve').length;
                  const disagreeVotes = Object.values(votesObj).filter(v => v === 'Reject').length;
                  const isApproved = agreeVotes > disagreeVotes;

                  return (
                    <div key={topic.id} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3 font-sans transition col-span-1 text-left flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center select-none border-b border-slate-150 pb-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            isApproved ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {isApproved ? 'Approved Resolution' : 'Scheme Rejected'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Closed: {topic.completedAt ? new Date(topic.completedAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-bold text-sm text-slate-800 leading-tight select-text">{topic.agenda}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed select-text whitespace-pre-wrap">
                            {topic.description}
                          </p>
                        </div>
                      </div>

                      <div className="p-2.5 bg-white border rounded-xl flex items-center justify-between text-[11px] font-mono text-slate-600 self-stretch mt-3 select-none">
                        <span>Ballot Count: {Object.keys(votesObj).length}</span>
                        <span>{agreeVotes} Agree • {disagreeVotes} Disagree</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
