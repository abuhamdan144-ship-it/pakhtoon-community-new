import React from 'react';
import { motion } from 'motion/react';
import { Landmark, PhoneCall, Mail, MapPin, Globe, Shield, Heart, ExternalLink } from 'lucide-react';
import logoImg from '../assets/images/pukhtoon_community_logo_1785867933974.jpg';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-[#0e2e25] text-[#faf6ed] border-t-2 border-[#d4af37]/40 relative overflow-hidden">
      
      {/* Top Gold Accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#d4af37] via-amber-200 to-[#1b4d3e]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          
          {/* Brand Info */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="OPC Logo" className="w-12 h-12 rounded-full border-2 border-[#d4af37] object-cover" />
              <div>
                <span className="font-serif text-lg font-black text-[#d4af37] block">PAKHTOON COMMUNITY</span>
                <span className="text-[10px] font-mono tracking-widest text-[#faf6ed]/70 uppercase">Assembly Sultanate of Oman</span>
              </div>
            </div>

            <p className="text-xs text-[#faf6ed]/80 leading-relaxed font-sans max-w-md">
              Official community welfare and executive diaspora council representing the Pakhtoon population across Muscat, Salalah, Sohar, Nizwa, and all governorates in Oman.
            </p>

            <div className="p-3 rounded-xl bg-[#1b4d3e]/60 border border-[#d4af37]/30 text-xs flex items-center justify-between">
              <span className="text-[#d4af37] font-bold">Consular Emergency Hotline:</span>
              <a href="tel:+96899111870" className="font-mono font-bold text-white hover:underline">+968 99111870</a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#d4af37]">Quick Portal Navigation</h4>
            <ul className="space-y-2 text-xs text-[#faf6ed]/80 font-semibold">
              <li><button onClick={() => onNavigate('home')} className="hover:text-[#d4af37] transition">Home Overview</button></li>
              <li><button onClick={() => onNavigate('register')} className="hover:text-[#d4af37] transition">Apply Digital Membership Card</button></li>
              <li><button onClick={() => onNavigate('cabinet')} className="hover:text-[#d4af37] transition">Cabinet Officials Directory</button></li>
              <li><button onClick={() => onNavigate('elections')} className="hover:text-[#d4af37] transition">Live Democracy Elections</button></li>
              <li><button onClick={() => onNavigate('incidents')} className="hover:text-[#d4af37] transition">File Welfare Claim</button></li>
              <li><button onClick={() => onNavigate('livetv')} className="hover:text-[#d4af37] transition">Live TV Stream</button></li>
            </ul>
          </div>

          {/* Embassy & Chapter Info */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#d4af37]">Oman Executive Secretariat</h4>
            <div className="space-y-2 text-xs text-[#faf6ed]/80 font-sans">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-[#d4af37] shrink-0 mt-0.5" />
                <span>Pakhtoon Community Secretariat, Way 3321, Building 412, Muscat, Sultanate of Oman</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-[#d4af37] shrink-0" />
                <span>info@pakhtoonoman.org</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-[#d4af37] shrink-0" />
                <span>www.pakhtoonoman.org</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-10 mt-10 border-t border-[#d4af37]/20 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#faf6ed]/60 gap-4">
          <p>© 2026 Pakhtoon Community Assembly Sultanate of Oman. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-[#d4af37] font-mono">Firebase: opc-new-48a8d</span>
            <button onClick={() => onNavigate('admin')} className="text-slate-400 hover:text-white underline">Executive Login</button>
          </div>
        </div>

      </div>
    </footer>
  );
}
