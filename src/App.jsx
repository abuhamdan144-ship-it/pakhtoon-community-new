import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Billboard3D from './components/Billboard3D';
import Stats from './components/Stats';
import Cabinet from './components/Cabinet';
import News from './components/News';
import Incidents from './components/Incidents';
import Elections from './components/Elections';
import Membership from './components/Membership';
import Admin from './components/Admin';
import ScrollProgress from './components/ScrollProgress';
import CursorTrail from './components/CursorTrail';
import WhatsAppFloat from './components/WhatsAppFloat';
import Loader from './components/Loader';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading sequence
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      <AnimatePresence>
        {loading && <Loader key="loader" />}
      </AnimatePresence>
      
      {!loading && (
        <div className="min-h-screen flex flex-col relative w-full overflow-hidden">
          <CursorTrail />
          <ScrollProgress />
          <Navbar />
          
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Hero />
                  <Billboard3D />
                  <Stats />
                  <Cabinet />
                  <News />
                  <Incidents />
                  <Elections />
                </motion.div>
              } />
              <Route path="/membership" element={<Membership />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>
          
          <WhatsAppFloat />
          <Toaster position="top-right" />
        </div>
      )}
    </Router>
  );
}

export default App;
