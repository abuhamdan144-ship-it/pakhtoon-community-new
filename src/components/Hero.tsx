import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, UserPlus, Vote, AlertCircle, Sparkles, ChevronRight, 
  Award, Globe, HeartHandshake, PhoneCall, Radio 
} from 'lucide-react';
import logoImg from '../assets/images/pukhtoon_community_logo_1785867933974.jpg';

interface HeroProps {
  onNavigate: (tab: string) => void;
  memberCount: number;
  incidentCount: number;
  donationTotal: number;
}

export default function Hero({
  onNavigate,
  memberCount,
  incidentCount,
  donationTotal
}: HeroProps) {
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#0e2e25] via-[#1b4d3e] to-[#0e2e25] text-[#faf6ed] py-16 lg:py-24 border-b border-[#d4af37]/30">
      
      {/* Background Animated Ambient Glow Orbs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#d4af37]/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          
          {/* Left Hero Text Column */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            
            {/* Top Badge */}
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1b4d3e]/90 border border-[#d4af37]/50 shadow-lg shadow-[#0e2e25]/50">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4af37] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#d4af37]"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-widest text-[#d4af37]">
                Official Oman Diaspora Portal • Muscat & Salalah
              </span>
              <Sparkles size={14} className="text-[#d4af37] animate-spin" />
            </motion.div>

            {/* Main Title */}
            <motion.div variants={itemVariants} className="space-y-3">
              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-wide">
                Pakhtoon Community <br />
                <span className="bg-gradient-to-r from-[#d4af37] via-amber-200 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(212,175,55,0.4)]">
                  Assembly Sultanate of Oman
                </span>
              </h1>
              <p className="text-sm sm:text-lg text-[#faf6ed]/90 max-w-2xl font-sans leading-relaxed pt-2">
                Empowering the Pakhtoon diaspora across Muscat, Salalah, Sohar, and Nizwa. 
                Providing official digital membership credentials, executive cabinet democracy, 
                repatriation emergency relief, and community welfare services.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(212, 175, 55, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('register')}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#d4af37] via-amber-400 to-[#d4af37] text-[#0e2e25] font-black text-sm tracking-wide shadow-2xl flex items-center gap-2 cursor-pointer border border-amber-200"
              >
                <UserPlus size={18} />
                <span>Apply Membership ID</span>
                <ChevronRight size={16} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('elections')}
                className="px-6 py-3.5 rounded-2xl bg-[#1b4d3e]/90 hover:bg-[#1b4d3e] text-white border border-[#d4af37]/60 font-black text-sm tracking-wide shadow-xl flex items-center gap-2 cursor-pointer backdrop-blur-md"
              >
                <Vote size={18} className="text-[#d4af37]" />
                <span>Live Elections Vote</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('incidents')}
                className="px-5 py-3.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-bold text-sm tracking-wide flex items-center gap-2 cursor-pointer"
              >
                <AlertCircle size={18} className="text-amber-400" />
                <span>Welfare Claim</span>
              </motion.button>

            </motion.div>

            {/* Quick Live Stats Ticker Bar */}
            <motion.div variants={itemVariants} className="pt-6 grid grid-cols-3 gap-3 border-t border-[#d4af37]/20 max-w-xl">
              <div className="bg-[#1b4d3e]/40 p-3 rounded-xl border border-[#d4af37]/20 text-center lg:text-left">
                <span className="block text-2xl font-extrabold text-[#d4af37] font-mono">
                  {(memberCount > 100 ? memberCount : 1280 + memberCount).toLocaleString()}+
                </span>
                <span className="text-[11px] font-semibold text-[#faf6ed]/70 uppercase tracking-wider">Approved Members</span>
              </div>
              <div className="bg-[#1b4d3e]/40 p-3 rounded-xl border border-[#d4af37]/20 text-center lg:text-left">
                <span className="block text-2xl font-extrabold text-[#d4af37] font-mono">
                  {incidentCount > 50 ? incidentCount : 112 + incidentCount}
                </span>
                <span className="text-[11px] font-semibold text-[#faf6ed]/70 uppercase tracking-wider">Claims Settled</span>
              </div>
              <div className="bg-[#1b4d3e]/40 p-3 rounded-xl border border-[#d4af37]/20 text-center lg:text-left">
                <span className="block text-2xl font-extrabold text-[#d4af37] font-mono">
                  {donationTotal >= 10000 ? `${(donationTotal / 1000).toFixed(1)}k` : `${((45200 + donationTotal) / 1000).toFixed(1)}k`}
                </span>
                <span className="text-[11px] font-semibold text-[#faf6ed]/70 uppercase tracking-wider">OMR Relief Pool</span>
              </div>
            </motion.div>

          </div>

          {/* Right Hero Cinematic Emblem / ID Preview Box */}
          <motion.div variants={itemVariants} className="lg:col-span-5 relative">
            <div className="relative mx-auto w-full max-w-md p-6 rounded-3xl bg-gradient-to-br from-[#1b4d3e] to-[#0e2e25] border-2 border-[#d4af37]/60 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_30px_rgba(212,175,55,0.3)] space-y-6">
              
              {/* Card Top Decorative Header */}
              <div className="flex items-center justify-between border-b border-[#d4af37]/30 pb-4">
                <div className="flex items-center gap-3">
                  <img src={logoImg} alt="Emblem" className="w-12 h-12 rounded-full border-2 border-[#d4af37] object-cover shadow-lg" />
                  <div>
                    <span className="block text-xs font-black text-[#d4af37] tracking-widest uppercase">DIGITAL CREDENTIAL CARD</span>
                    <span className="text-[10px] text-[#faf6ed]/70 font-mono">OPC OMAN CHAPTER</span>
                  </div>
                </div>
                <ShieldCheck size={28} className="text-[#d4af37]" />
              </div>

              {/* Sample Membership Card Artwork */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0e2e25] via-[#1b4d3e] to-[#0e2e25] p-5 border border-[#d4af37]/40 shadow-inner space-y-4">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#d4af37]/20 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest font-bold text-[#d4af37]">VERIFIED LIFETIME MEMBER</span>
                    <h3 className="text-lg font-serif font-bold text-white mt-0.5">Jan Mohammad Khan</h3>
                    <p className="text-[11px] text-[#faf6ed]/80 font-mono">CNIC: 17301-8291039-1</p>
                  </div>
                  <div className="px-2.5 py-1 rounded-md bg-emerald-950 border border-emerald-400/50 text-[10px] font-extrabold text-emerald-300">
                    STATUS: APPROVED
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-[#faf6ed]/80 pt-2 border-t border-[#d4af37]/20">
                  <div>
                    <span className="block text-[#d4af37] font-bold">MEMBERSHIP NO:</span>
                    <span>OPC-OMN-88421</span>
                  </div>
                  <div>
                    <span className="block text-[#d4af37] font-bold">CHAPTER REGION:</span>
                    <span>Muscat, Oman</span>
                  </div>
                </div>
              </div>

              {/* Emergency Hotline Banner */}
              <div className="p-3.5 rounded-xl bg-[#0e2e25] border border-amber-500/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <PhoneCall size={16} className="animate-pulse" />
                  <span>24/7 Embassy Helpline: +968 99111870</span>
                </div>
                <button 
                  onClick={() => window.open('https://wa.me/96899111870', '_blank')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] transition"
                >
                  WhatsApp
                </button>
              </div>

            </div>
          </motion.div>

        </motion.div>
      </div>

    </section>
  );
}
