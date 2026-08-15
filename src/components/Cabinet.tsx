import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark, Phone, Mail, Award, RotateCw, ExternalLink, ShieldCheck, Search } from 'lucide-react';
import { CabinetMember } from '../types';

interface CabinetProps {
  cabinet: CabinetMember[];
}

export default function Cabinet({ cabinet }: CabinetProps) {
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const membersToDisplay = cabinet || [];

  const filteredMembers = membersToDisplay.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="py-20 bg-gradient-to-b from-[#0e2e25] via-[#1b4d3e] to-[#0e2e25] text-[#faf6ed] relative border-b border-[#d4af37]/30">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b4d3e] border border-[#d4af37]/50 text-[#d4af37] text-xs font-black uppercase tracking-widest">
            <Landmark size={14} />
            <span>EXECUTIVE LEADERSHIP & CABINET ASSEMBLY</span>
          </div>
          
          <h2 className="text-3xl sm:text-5xl font-serif font-black text-white">
            Meet Our Cabinet Officials
          </h2>
          <p className="text-sm sm:text-base text-[#faf6ed]/80">
            Click any official card to flip for direct phone, email, and diplomatic verification details.
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto pt-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#d4af37]" size={18} />
              <input 
                type="text"
                placeholder="Search by name or position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0e2e25] border border-[#d4af37]/40 text-xs font-semibold text-white placeholder-[#faf6ed]/50 focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>
        </div>

        {/* 3D Flip Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredMembers.map((member, index) => {
            const isFlipped = flippedCardId === (member.id || String(index));
            const cardId = member.id || String(index);

            return (
              <div 
                key={cardId} 
                className="h-[380px] w-full [perspective:1000px] cursor-pointer group"
                onClick={() => setFlippedCardId(isFlipped ? null : cardId)}
              >
                <motion.div
                  initial={false}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="relative w-full h-full rounded-2xl [transform-style:preserve-3d] shadow-2xl"
                >
                  
                  {/* FRONT OF CARD */}
                  <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-[#1b4d3e] via-[#0e2e25] to-[#1b4d3e] border-2 border-[#d4af37]/60 p-6 flex flex-col justify-between [backface-visibility:hidden] overflow-hidden">
                    
                    {/* Background Pattern */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#d4af37]/15 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-start justify-between">
                      <span className="px-2.5 py-1 rounded-md bg-[#0e2e25] border border-[#d4af37]/40 text-[10px] font-mono font-bold text-[#d4af37]">
                        OFFICIAL CABINET
                      </span>
                      <button 
                        className="p-1.5 rounded-full bg-[#1b4d3e] border border-[#d4af37]/40 text-[#d4af37] hover:scale-110 transition"
                        title="Flip for contact info"
                      >
                        <RotateCw size={14} />
                      </button>
                    </div>

                    {/* Member Photo & Title */}
                    <div className="text-center space-y-3 my-auto">
                      <div className="relative mx-auto w-28 h-28">
                        <img 
                          src={member.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'} 
                          alt={member.name}
                          className="w-28 h-28 rounded-full object-cover border-2 border-[#d4af37] shadow-xl mx-auto"
                        />
                        <span className="absolute bottom-0 right-1 bg-emerald-500 p-1 rounded-full border border-[#0e2e25]" title="Verified Official">
                          <ShieldCheck size={12} className="text-[#0e2e25]" />
                        </span>
                      </div>

                      <div>
                        <h3 className="font-serif text-xl font-bold text-white group-hover:text-[#d4af37] transition">
                          {member.name}
                        </h3>
                        <p className="text-xs font-semibold text-[#d4af37] tracking-wider uppercase mt-1">
                          {member.position}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Prompt */}
                    <div className="pt-3 border-t border-[#d4af37]/20 text-center text-[10px] text-[#faf6ed]/60 font-mono">
                      Tap card to reveal phone & email contacts
                    </div>

                  </div>

                  {/* BACK OF CARD */}
                  <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-[#0e2e25] via-[#1b4d3e] to-[#0e2e25] border-2 border-[#d4af37] p-6 flex flex-col justify-between [transform:rotateY(180deg)] [backface-visibility:hidden]">
                    
                    <div className="flex items-center justify-between border-b border-[#d4af37]/30 pb-3">
                      <div className="flex items-center gap-2 text-[#d4af37]">
                        <Award size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Contact & Credentials</span>
                      </div>
                      <button className="p-1 rounded-full bg-[#1b4d3e] text-[#d4af37]">
                        <RotateCw size={14} />
                      </button>
                    </div>

                    <div className="space-y-4 my-auto">
                      <div className="p-3 rounded-xl bg-[#0e2e25]/90 border border-[#d4af37]/30 flex items-center gap-3">
                        <Phone className="text-[#d4af37] shrink-0" size={18} />
                        <div className="truncate">
                          <span className="block text-[9px] uppercase font-bold text-[#faf6ed]/60">Official Hotline</span>
                          <a href={`tel:${member.phone || '+968 99111870'}`} className="text-xs font-mono font-bold text-white hover:text-[#d4af37]">
                            {member.phone || '+968 99111870'}
                          </a>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-[#0e2e25]/90 border border-[#d4af37]/30 flex items-center gap-3">
                        <Mail className="text-[#d4af37] shrink-0" size={18} />
                        <div className="truncate">
                          <span className="block text-[9px] uppercase font-bold text-[#faf6ed]/60">Official Email</span>
                          <a href={`mailto:${member.email || 'info@pakhtoonoman.org'}`} className="text-xs font-mono font-bold text-white hover:text-[#d4af37] truncate block">
                            {member.email || 'info@pakhtoonoman.org'}
                          </a>
                        </div>
                      </div>
                    </div>

                    <a 
                      href={`https://wa.me/${(member.phone || '96899111870').replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs text-center flex items-center justify-center gap-2 border border-emerald-400 transition"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>WhatsApp Direct Message</span>
                      <ExternalLink size={14} />
                    </a>

                  </div>

                </motion.div>
              </div>
            );
          })}
        </div>

      </div>

    </section>
  );
}
