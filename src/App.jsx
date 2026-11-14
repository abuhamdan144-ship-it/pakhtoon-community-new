import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

import HTMLDesignPreview from './components/HTMLDesignPreview';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Billboard3D from './components/Billboard3D';
import Stats from './components/Stats';
import Cabinet from './components/Cabinet';
import News from './components/News';
import Incidents from './components/Incidents';
import Elections from './components/Elections';
import Membership from './components/Membership';
import MemberCard from './components/MemberCard';
import Admin from './components/Admin';
import ScrollProgress from './components/ScrollProgress';
import CursorTrail from './components/CursorTrail';
import WhatsAppFloat from './components/WhatsAppFloat';
import PrivacyPolicy from './components/PrivacyPolicy';
import ChildSafetyStandards from './components/ChildSafetyStandards';
import Loader from './components/Loader';
import ErrorBoundary from './components/ErrorBoundary';
import MemberPortal from './components/MemberPortal';
import { Capacitor } from '@capacitor/core';
import EmergencyContact from './components/EmergencyContact';
import { CalendarDays, ClipboardList, CreditCard, Home, PhoneCall, Vote } from 'lucide-react';

function NativeFeatureTabs() {
  const { pathname, search, hash } = useLocation();
  if (!Capacitor.isNativePlatform() || pathname === '/admin') return null;

  const portalTab = new URLSearchParams(search).get('tab');
  const items = [
    { to: '/', label: 'Home', key: 'home', Icon: Home },
    { to: '/membership?tab=dashboard', label: 'Card', key: 'card', Icon: CreditCard },
    { to: '/membership?tab=vote', label: 'Vote', key: 'vote', Icon: Vote },
    { to: '/#news', label: 'Events', key: 'events', Icon: CalendarDays },
    { to: '/emergency', label: 'Emergency', key: 'emergency', Icon: PhoneCall },
    { to: '/membership?tab=report', label: 'Report', key: 'report', Icon: ClipboardList },
  ];

  const isActive = (key) => {
    if (key === 'home') return pathname === '/' && !hash;
    if (key === 'events') return pathname === '/' && hash === '#news';
    if (key === 'card') return pathname === '/membership' && (!portalTab || portalTab === 'dashboard');
    if (key === 'emergency') return pathname === '/emergency';
    if (key === 'vote' || key === 'report') return pathname === '/membership' && portalTab === key;
    return false;
  };

  return (
    <nav aria-label="App features" className="fixed inset-x-0 bottom-0 z-[100] flex border-t border-[#d4af37]/40 bg-[#0e2e25] text-[#faf6ed] shadow-[0_-8px_24px_rgba(0,0,0,.2)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {items.map(({ to, label, key, Icon }) => (
        <Link key={key} to={to} aria-label={label} aria-current={isActive(key) ? 'page' : undefined} className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[9px] font-bold ${isActive(key) ? 'text-[#d4af37]' : 'text-[#faf6ed]/80'}`}>
          <Icon size={17} strokeWidth={2.2} />
          <span className="truncate">{label}</span>
        </Link>
      ))}
    </nav>
  );
}

function FullPortalView() {
  return (
    <div className="min-h-screen flex flex-col relative w-full overflow-hidden bg-cream text-text font-inter">
      <CursorTrail />
      <ScrollProgress />
      <Navbar />
      
      <main className="flex-grow">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Hero />
          <Billboard3D />
          <Stats />
          <Cabinet />
          <News />
          <Incidents />
          <Elections />
        </motion.div>
      </main>
      
      <WhatsAppFloat />
    </div>
  );
}

function App() {
  const [loading, setLoading] = useState(true);
  const isAdminRoute = window.location.pathname === '/admin';
  const isNativeApp = Capacitor.isNativePlatform();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, isNativeApp ? 1800 : 250);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      <AnimatePresence>
        {loading && <Loader key="loader" />}
      </AnimatePresence>
      
      {(!loading || isAdminRoute) && (
        <div className="min-h-screen w-full" style={isNativeApp ? { paddingBottom: 'calc(4.75rem + env(safe-area-inset-bottom))' } : undefined}>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<HTMLDesignPreview />} />
              <Route path="/portal" element={<Navigate to="/" replace />} />
              <Route path="/membership" element={<MemberPortal />} />
              <Route path="/card" element={<MemberCard />} />
              <Route path="/emergency" element={<EmergencyContact />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/child-safety-standards" element={<ChildSafetyStandards />} />
            </Routes>
          </ErrorBoundary>
          <Toaster position="top-right" />
          <NativeFeatureTabs />
        </div>
      )}
    </Router>
  );
}

export default App;
