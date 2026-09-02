import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import Loader from './components/Loader';

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      <AnimatePresence>
        {loading && <Loader key="loader" />}
      </AnimatePresence>
      
      {!loading && (
        <div className="min-h-screen w-full">
          <Routes>
            <Route path="/" element={<HTMLDesignPreview />} />
            <Route path="/portal" element={<Navigate to="/" replace />} />
            <Route path="/membership" element={<Membership />} />
            <Route path="/card" element={<MemberCard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      )}
    </Router>
  );
}

export default App;

