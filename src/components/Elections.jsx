import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collections } from '../firebase/collections';
import { onSnapshot, query } from 'firebase/firestore';

const fallbackCandidates = [
  { id: 1, name: 'Dr. Ahmad Gul', votes: 450, total: 1000 },
  { id: 2, name: 'Eng. Sheraz Khan', votes: 320, total: 1000 },
];

export default function Elections() {
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(query(collections.elections), (snap) => {
      let data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCandidates(data.length > 0 ? data : fallbackCandidates);
    }, (error) => {
      console.log(error);
      setCandidates(fallbackCandidates);
    });
    return () => unsub();
  }, []);

  return (
    <section className="py-24 bg-cream">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-serif font-bold text-forest-dark">Presidential Election 2026</h2>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
              LIVE VOTING
            </span>
          </div>
          
          <div className="space-y-6">
            {candidates.map((c, i) => {
              const percent = ((c.votes || 0) / (c.total || 1000)) * 100;
              return (
                <div key={c.id || i}>
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-gray-800">{c.name}</span>
                    <span className="text-gold font-mono font-bold">{Math.round(percent)}%</span>
                  </div>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-forest to-gold"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${percent}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 font-mono">{c.votes || 0} votes</p>
                </div>
              );
            })}
          </div>
          
          <button className="w-full mt-10 bg-forest-dark text-cream py-4 rounded-lg font-bold hover:bg-forest transition-colors shadow-lg">
            CAST YOUR VOTE
          </button>
        </div>
      </div>
    </section>
  );
}
