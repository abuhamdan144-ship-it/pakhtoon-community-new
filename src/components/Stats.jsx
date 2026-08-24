import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCounter } from '../hooks/useCounter';
import { collections } from '../firebase/collections';
import { onSnapshot, query, where } from 'firebase/firestore';

export default function Stats() {
  const ref = useRef(null);
  const [approvedCount, setApprovedCount] = useState(1250);
  const [donations, setDonations] = useState(45000);
  
  useEffect(() => {
    // Attempt to get real member count
    const q = query(collections.members, where('status', '==', 'approved'));
    const unsub = onSnapshot(q, (snap) => {
      if(snap.size > 0) {
        setApprovedCount(snap.size);
      }
    }, (err) => console.log(err));

    return () => unsub();
  }, []);

  const statItems = [
    { label: 'APPROVED MEMBERS', value: approvedCount, prefix: '' },
    { label: 'DONATIONS RAISED', value: donations, prefix: 'OMR ' },
    { label: 'WELFARE CASES', value: 85, prefix: '' },
    { label: 'ACTIVE CHAPTERS', value: 6, prefix: '' }
  ];
  
  return (
    <section className="bg-forest-dark border-t border-b border-gold/20 py-12" ref={ref}>
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {statItems.map((stat, i) => (
            <StatItem key={i + '-' + stat.value} stat={stat} index={i} parentRef={ref} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatItem({ stat, index, parentRef }) {
  const count = useCounter(stat.value, 2.5, parentRef);
  
  return (
    <motion.div 
      className="flex flex-col items-center justify-center text-center relative"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <div className="absolute top-0 right-1/4 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-75 hidden md:block" />
      <h3 className="font-mono text-3xl md:text-5xl font-bold text-gold mb-2 drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]">
        {stat.prefix}{count.toLocaleString()}+
      </h3>
      <p className="text-xs md:text-sm font-semibold tracking-[0.2em] text-cream/70 uppercase">
        {stat.label}
      </p>
    </motion.div>
  );
}
