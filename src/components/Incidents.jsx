import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

const mockIncidents = [
  { type: 'Death', name: 'Rahimullah', desc: 'Passed away in Sohar hospital. Support needed for body repatriation.', date: '2026-08-21' },
  { type: 'Injury', name: 'Abdullah Khan', desc: 'Workplace accident in Muscat. Needs medical funds.', date: '2026-08-15' },
];

export default function Incidents() {
  return (
    <section className="py-24 bg-[#0a1f18] text-white">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold text-cream mb-4">Welfare & Support</h2>
          <div className="w-24 h-1 bg-gold mx-auto rounded-full" />
        </div>

        <div className="relative border-l-2 border-gold/30 ml-4 md:ml-1/2">
          {mockIncidents.map((incident, i) => (
            <motion.div 
              key={i}
              className={`relative pl-8 pb-12 ${i % 2 === 0 ? 'md:pl-0 md:pr-8 md:-ml-[50%] md:text-right' : 'md:ml-0'}`}
              initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2, type: 'spring' }}
            >
              <div className={`absolute top-0 w-4 h-4 rounded-full border-4 border-[#0a1f18] -left-[9px] ${i % 2 === 0 ? 'md:left-auto md:-right-[9px]' : ''} ${
                incident.type === 'Death' ? 'bg-red' : incident.type === 'Injury' ? 'bg-orange-500' : 'bg-blue-500'
              }`} />
              
              <div className="bg-white/5 border border-white/10 p-6 rounded-xl backdrop-blur-sm hover:border-gold/30 transition-colors">
                <div className={`text-xs font-bold px-2 py-1 rounded inline-block mb-3 ${
                  incident.type === 'Death' ? 'bg-red/20 text-red-200' : 'bg-orange-500/20 text-orange-200'
                }`}>
                  {incident.type}
                </div>
                <h3 className="text-xl font-bold text-gold mb-2">{incident.name}</h3>
                <p className="text-gray-300 text-sm mb-4">{incident.desc}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-gray-500 font-mono">{incident.date}</span>
                  <button className="flex items-center gap-2 text-sm bg-gold/10 text-gold px-4 py-2 rounded hover:bg-gold hover:text-forest-dark transition-colors">
                    <Heart size={14} /> Support Case
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
