import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Menu, X, Landmark, FileText, Vote, AlertTriangle, Tv, 
  UserCheck, Globe, ChevronDown, Lock, Home as HomeIcon 
} from 'lucide-react';
import logoImg from '../assets/images/pukhtoon_community_logo_1785867933974.jpg';
import { Language, languageNames } from '../translations';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  isAdmin: boolean;
  onOpenAdminAuth: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  isAdmin,
  onOpenAdminAuth
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'register', label: 'Membership', icon: UserCheck },
    { id: 'cabinet', label: 'Cabinet Assembly', icon: Landmark },
    { id: 'news', label: 'News & Media', icon: FileText },
    { id: 'elections', label: 'Live Elections', icon: Vote, badge: 'LIVE' },
    { id: 'incidents', label: 'Welfare Claims', icon: AlertTriangle },
    { id: 'livetv', label: 'Live TV & Streams', icon: Tv, badge: 'HD' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#0e2e25]/90 border-b border-[#d4af37]/30 shadow-2xl transition-all">
      {/* Top Gold Accent Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#d4af37] via-amber-200 via-amber-500 to-[#1b4d3e]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand Name */}
          <motion.div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('home')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative">
              <img 
                src={logoImg} 
                alt="Pakhtoon Community Logo" 
                className="w-12 h-12 rounded-full border-2 border-[#d4af37] shadow-lg object-cover group-hover:border-amber-300 transition-all duration-300"
              />
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-[#0e2e25]"></span>
              </span>
            </div>
            
            <div className="flex flex-col">
              <span className="font-serif text-lg sm:text-xl font-black text-[#d4af37] tracking-wider leading-tight group-hover:text-amber-200 transition">
                PAKHTOON COMMUNITY
              </span>
              <span className="text-[10px] sm:text-xs font-mono tracking-widest text-[#faf6ed]/80 uppercase">
                Oman Diaspora Portal
              </span>
            </div>
          </motion.div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative px-3 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive 
                      ? 'text-[#d4af37] font-bold bg-[#1b4d3e]/80 border border-[#d4af37]/40 shadow-inner' 
                      : 'text-[#faf6ed]/80 hover:text-white hover:bg-[#1b4d3e]/40'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-[#d4af37]' : 'opacity-70'} />
                  <span>{item.label}</span>

                  {item.badge && (
                    <span className="ml-0.5 px-1.5 py-0.2 text-[9px] font-black uppercase rounded-full bg-amber-500 text-[#0e2e25] animate-pulse">
                      {item.badge}
                    </span>
                  )}

                  {isActive && (
                    <motion.div 
                      layoutId="activeNavIndicator"
                      className="absolute inset-0 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/50 pointer-events-none"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Utility Buttons (Language + Admin) */}
          <div className="hidden lg:flex items-center gap-3">
            
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1b4d3e]/60 hover:bg-[#1b4d3e] border border-[#d4af37]/30 text-xs font-bold text-[#faf6ed] transition"
              >
                <Globe size={14} className="text-[#d4af37]" />
                <span>{languageNames[lang]}</span>
                <ChevronDown size={12} className={`transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {langDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-36 rounded-xl bg-[#0e2e25] border border-[#d4af37]/40 shadow-2xl py-1 z-50 backdrop-blur-2xl"
                  >
                    {(['en', 'ur', 'ps'] as Language[]).map((l) => (
                      <button
                        key={l}
                        onClick={() => {
                          setLang(l);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between hover:bg-[#1b4d3e] transition ${
                          lang === l ? 'text-[#d4af37] font-bold bg-[#1b4d3e]/50' : 'text-[#faf6ed]/80'
                        }`}
                      >
                        {languageNames[l]}
                        {lang === l && <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Admin Portal Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenAdminAuth}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-lg border transition ${
                isAdmin 
                  ? 'bg-gradient-to-r from-emerald-600 to-[#1b4d3e] text-white border-emerald-400' 
                  : 'bg-gradient-to-r from-[#d4af37] to-amber-500 text-[#0e2e25] border-amber-300 hover:from-amber-400 hover:to-[#d4af37]'
              }`}
            >
              {isAdmin ? <Shield size={14} /> : <Lock size={14} />}
              <span>{isAdmin ? 'Admin Console' : 'Executive Login'}</span>
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-[#1b4d3e]/80 border border-[#d4af37]/40 text-[#faf6ed] hover:text-[#d4af37] transition"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Animated Dropdown Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-t border-[#d4af37]/20 bg-[#0e2e25] overflow-hidden"
          >
            <div className="px-4 py-6 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-between transition ${
                      isActive 
                        ? 'bg-[#1b4d3e] text-[#d4af37] border border-[#d4af37]/50 shadow-lg' 
                        : 'text-[#faf6ed]/80 hover:bg-[#1b4d3e]/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} className={isActive ? 'text-[#d4af37]' : 'opacity-70'} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-500 text-[#0e2e25]">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="pt-4 border-t border-[#d4af37]/20 flex items-center justify-between gap-3">
                {/* Language Picker in Mobile */}
                <div className="flex gap-1 bg-[#1b4d3e]/80 p-1 rounded-xl border border-[#d4af37]/30">
                  {(['en', 'ur', 'ps'] as Language[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                        lang === l ? 'bg-[#d4af37] text-[#0e2e25]' : 'text-[#faf6ed]/70 hover:text-white'
                      }`}
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Admin Button in Mobile */}
                <button
                  onClick={() => {
                    onOpenAdminAuth();
                    setMobileMenuOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-[#d4af37] to-amber-500 text-[#0e2e25] border border-amber-300 shadow-md flex items-center gap-1.5"
                >
                  <Lock size={14} />
                  <span>{isAdmin ? 'Console' : 'Admin'}</span>
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
