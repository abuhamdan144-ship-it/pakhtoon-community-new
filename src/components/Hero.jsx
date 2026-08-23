import React from 'react';
import { motion } from 'framer-motion';
import Particles from './Particles';
import { Link } from 'react-router-dom';
import { ShieldCheck, Flag } from 'lucide-react';

export default function Hero() {
  const headingWords = ["PAKHTOON", "COMMUNITY"];

  return (
    <section className="relative min-h-screen flex items-center pt-20 bg-gradient-to-b from-[#061a14] via-[#0a2318] to-forest overflow-hidden">
      <Particles count={40} />
      
      {/* Islamic Pattern Overlay */}
      <motion.div 
        className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: 'radial-gradient(circle at center, #d4af37 1px, transparent 2px)', backgroundSize: '40px 40px' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
      />
      
      <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10">
        
        {/* Left Content */}
        <div className="flex flex-col items-start gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex items-center gap-2 bg-white/5 border border-gold/30 rounded-full px-4 py-1.5 text-sm font-medium text-gold"
          >
            <Flag size={16} className="text-white" />
            <span>Official Portal Oman</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold font-serif leading-tight">
            {headingWords.map((word, i) => (
              <motion.span
                key={i}
                className={`block ${i === 1 ? 'gold-gradient-text' : 'text-white'}`}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 + i * 0.2, type: 'spring' }}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p 
            className="text-lg md:text-xl text-cream/80 max-w-lg leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
          >
            Uniting Pakhtoon families across the Sultanate of Oman through brotherhood, welfare, and cultural preservation.
          </motion.p>

          <motion.div 
            className="flex flex-wrap gap-4 mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2, type: 'spring' }}
          >
            <Link to="/membership" className="bg-gold text-forest-dark px-8 py-3 rounded-md font-semibold hover:bg-gold-light transition-all shadow-[0_0_15px_rgba(212,175,55,0.4)] flex items-center gap-2">
              <ShieldCheck size={20} />
              Join Free — Get Card
            </Link>
            <button className="border-2 border-gold/50 text-gold px-8 py-3 rounded-md font-semibold hover:bg-gold/10 transition-all">
              Report Incident
            </button>
          </motion.div>
        </div>

        {/* Right Content - 3D Cards */}
        <div className="relative h-[400px] w-full flex items-center justify-center lg:justify-end hidden md:flex perspective-1000">
          {[1, 2, 3].map((card, i) => (
            <motion.div
              key={card}
              className={`absolute w-64 h-80 rounded-xl overflow-hidden border-2 border-gold/40 shadow-2xl ${i === 2 ? 'z-30' : i === 1 ? 'z-20' : 'z-10'}`}
              initial={{ opacity: 0, x: 100, rotateY: -30 }}
              animate={{ 
                opacity: 1, 
                x: i === 2 ? 0 : i === 1 ? -40 : -80,
                y: i === 2 ? 0 : i === 1 ? 20 : 40,
                rotateZ: i === 2 ? 0 : i === 1 ? -5 : -10,
                rotateY: 0
              }}
              transition={{ duration: 0.8, delay: 1.5 + i * 0.2 }}
              whileHover={{ scale: 1.05, rotateZ: 0, zIndex: 40, boxShadow: "0 0 20px rgba(212,175,55,0.6)" }}
            >
              <img 
                src={`https://images.unsplash.com/photo-1542104576-963a75fccaf5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80`} 
                alt="Community" 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                style={{ filter: i === 2 ? 'none' : 'grayscale(100%) brightness(50%)' }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
