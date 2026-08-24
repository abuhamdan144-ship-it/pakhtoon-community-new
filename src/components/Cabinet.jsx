import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail } from 'lucide-react';
import { collections } from '../firebase/collections';
import { onSnapshot, query } from 'firebase/firestore';

const fallbackCabinet = [
  { name: 'Shaukat Khan', role: 'Founder & President', image: 'https://i.pravatar.cc/300?img=11' },
  { name: 'Ahmad Shah', role: 'General Secretary', image: 'https://i.pravatar.cc/300?img=12' },
  { name: 'Tariq Khan', role: 'Finance Secretary', image: 'https://i.pravatar.cc/300?img=13' },
  { name: 'Usman Ali', role: 'Welfare Secretary', image: 'https://i.pravatar.cc/300?img=14' },
];

export default function Cabinet() {
  const [cabinet, setCabinet] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(query(collections.cabinet), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCabinet(data.length > 0 ? data : fallbackCabinet);
    });
    return () => unsub();
  }, []);

  return (
    <section className="py-24 bg-forest-dark relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-[100px]" />
      
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2 
            className="text-4xl font-serif font-bold text-cream mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Executive Cabinet
          </motion.h2>
          <div className="w-24 h-1 bg-gold mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {cabinet.map((member, i) => (
            <motion.div
              key={member.id || i}
              className="relative group perspective-1000 h-80"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <div className="w-full h-full transition-all duration-700 transform-style-3d group-hover:rotate-y-180 absolute inset-0">
                
                {/* Front */}
                <div className="absolute inset-0 backface-hidden dark-glass rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                  <div className="relative w-32 h-32 mb-4">
                    <div className="absolute inset-0 rounded-full border-2 border-gold/50 animate-[spin_10s_linear_infinite]" />
                    <img src={member.image || 'https://i.pravatar.cc/300'} alt={member.name} className="w-full h-full rounded-full object-cover p-1" />
                  </div>
                  <h3 className="text-xl font-bold text-gold">{member.name}</h3>
                  <span className="text-sm font-medium text-cream/80 px-3 py-1 bg-white/5 rounded-full mt-2">
                    {member.role}
                  </span>
                </div>

                {/* Back */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gold rounded-2xl p-6 flex flex-col items-center justify-center text-forest-dark shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                  <h3 className="text-xl font-bold mb-4">{member.name}</h3>
                  <div className="flex flex-col gap-3 w-full">
                    <button className="flex items-center justify-center gap-2 bg-forest-dark text-cream py-2 rounded-md hover:bg-forest transition-colors">
                      <Phone size={16} /> {member.phone || 'Contact'}
                    </button>
                    <button className="flex items-center justify-center gap-2 border border-forest-dark text-forest-dark py-2 rounded-md hover:bg-forest-dark/10 transition-colors">
                      <Mail size={16} /> {member.email || 'Email'}
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
