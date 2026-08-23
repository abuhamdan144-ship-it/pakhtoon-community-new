import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock ads data since Firebase isn't seeded yet
const mockAds = [
  { id: 1, name: "Al Madina Logistics", image: "https://images.unsplash.com/photo-1586528116311-ad8ed7c50800?w=800&q=80", caption: "Trusted Logistics Partner" },
  { id: 2, name: "Oman Travels", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80", caption: "Fly home safely" }
];

export default function Billboard3D() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % mockAds.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-24 bg-cream overflow-hidden">
      <div className="container mx-auto px-6 flex flex-col items-center">
        
        <div className="text-center mb-16">
          <motion.h2 
            className="text-4xl font-serif font-bold text-forest-dark mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Community Sponsors
          </motion.h2>
          <div className="w-24 h-1 bg-gold mx-auto rounded-full" />
        </div>

        {/* 3D Billboard Container */}
        <div className="relative w-full max-w-4xl h-[400px] perspective-1000 flex flex-col items-center">
          
          {/* The Board */}
          <div className="relative w-full h-full transform-style-3d isometric-card rounded-xl border-4 border-[#2a2a2a] bg-black shadow-2xl overflow-hidden">
            
            {/* Neon Accent */}
            <div className="absolute inset-0 border border-gold/50 shadow-[inset_0_0_20px_rgba(212,175,55,0.4)] pointer-events-none z-20" />
            
            {/* Sponsored Badge */}
            <div className="absolute top-4 left-4 z-30 bg-red text-white text-xs font-bold px-3 py-1 rounded shadow-[0_0_10px_rgba(200,16,46,0.8)] animate-pulse">
              SPONSORED
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                className="absolute inset-0"
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: -90, opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              >
                <img 
                  src={mockAds[currentIndex].image} 
                  alt={mockAds[currentIndex].name}
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
                  <h3 className="text-2xl font-bold text-gold">{mockAds[currentIndex].name}</h3>
                  <p className="text-white">{mockAds[currentIndex].caption}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Stand Pole */}
          <div className="w-8 h-32 bg-gradient-to-r from-gray-700 via-gray-400 to-gray-800 border-x border-gray-900 shadow-2xl relative -mt-4 z-0" />
          <div className="w-32 h-4 bg-gray-800 rounded-full blur-[2px] opacity-50" />
        </div>
        
      </div>
    </section>
  );
}
