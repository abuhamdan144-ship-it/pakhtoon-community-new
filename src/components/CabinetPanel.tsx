import React, { useState } from 'react';
import { CabinetMember, Member } from '../types';
import { Search, Phone, Mail, Award, Users, ShieldAlert, CheckCircle } from 'lucide-react';

interface CabinetPanelProps {
  cabinet: CabinetMember[];
  members: Member[];
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
  
  // Precise match in priority list
  const idx = POSITION_ORDER.indexOf(cleanPos);
  if (idx !== -1) return idx;

  // Let's also handle loose matching if needed
  if (cleanPos.includes('chairman')) return 0;
  if (cleanPos.includes('president')) return 3;
  if (cleanPos.includes('secretary')) return 8;
  if (cleanPos.includes('organizer')) return 13;
  if (cleanPos.includes('member') || cleanPos.includes('committee')) return 14;

  return POSITION_ORDER.length; // fallback
};

export default function CabinetPanel({ cabinet, members }: CabinetPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'executive' | 'registered'>('executive');

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

  return (
    <div className="space-y-6 fade-in text-left">
      
      {/* Page Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto mb-8">
        <h2 className="text-3xl sm:text-4xl font-serif font-extrabold text-emerald-950">OPC Directory</h2>
        <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed">
          Access the authorized database of Oman Pakhtoon Community representatives, Cabinet officers, and community members.
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
          </div>

          {/* Search Inputs */}
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

        </div>
      </div>

      {/* SUB TAB CONTENT */}
      {activeSubTab === 'executive' ? (
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
                const isTopOfficer = priority <= 2; // Chairman, Deputy, President

                return (
                  <div 
                    key={cm.id || idx} 
                    className={`bg-white border rounded-2xl shadow-xs hover:shadow-md transition duration-200 overflow-hidden flex flex-col items-center p-6 text-center text-slate-800 space-y-4 relative ${
                      isTopOfficer ? 'border-amber-400 bg-amber-500/5' : 'border-slate-150'
                    }`}
                  >
                    {/* Position priority indicator */}
                    <div className="absolute top-3 right-3 select-none">
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                        Rank #{idx + 1}
                      </span>
                    </div>

                    {/* Member photo / fallback avatar */}
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

                    {/* Officer Bio details */}
                    <div className="space-y-1">
                      <h4 className="font-serif font-bold text-emerald-950 text-base leading-snug">{cm.name}</h4>
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                        isTopOfficer ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-emerald-50 text-emerald-990 border border-emerald-100'
                      }`}>
                        {cm.position}
                      </span>
                    </div>

                    {/* Contacts block */}
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
      ) : (
        <div className="space-y-6">
          {filteredGeneralMembers.length === 0 ? (
            <div className="p-12 bg-white border border-slate-150 rounded-2xl text-center space-y-2">
              <ShieldAlert className="mx-auto text-slate-300" size={32} />
              <p className="text-slate-400 font-serif font-medium text-sm">No registered community members found matching terms.</p>
              <p className="text-xs text-slate-400">Try searching for other districts, phone configurations, or names.</p>
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

    </div>
  );
}
