import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tv, Radio, Play, Volume2, ShieldCheck, Globe, Maximize2, Sparkles, MessageSquare } from 'lucide-react';

export default function LiveTV() {
  const [activeChannel, setActiveChannel] = useState(0);

  const channels = [
    {
      id: 'ch-1',
      title: 'OPC Oman Diaspora Broadcast',
      subtitle: 'Muscat Executive Assembly & Cultural Stream',
      streamUrl: 'https://www.youtube.com/embed/live_stream?channel=UC_x5XG1OV2P6uZZ5FSM9Ttw', // placeholder YouTube stream embed
      badge: 'LIVE HD'
    },
    {
      id: 'ch-2',
      title: 'Salalah Regional Community Council Stream',
      subtitle: 'Dhofar Chapter Assembly & Welfare Reports',
      streamUrl: 'https://www.youtube.com/embed/live_stream?channel=UC_x5XG1OV2P6uZZ5FSM9Ttw',
      badge: 'RECORDED HD'
    }
  ];

  const currentCh = channels[activeChannel];

  return (
    <section className="py-20 bg-[#0e2e25] text-white relative border-b border-[#d4af37]/30">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1b4d3e] border border-[#d4af37]/50 text-[#d4af37] text-xs font-black uppercase tracking-widest">
            <Radio size={14} className="animate-pulse text-[#d4af37]" />
            <span>COMMUNITY BROADCASTING & MEDIA HUB</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-serif font-black text-white">
            Live TV & Cultural Channel
          </h2>
          <p className="text-sm sm:text-base text-[#faf6ed]/80">
            Watch live cabinet proceedings, cultural programs, and community announcements.
          </p>
        </div>

        {/* Cinema Dark Player Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Video Cinema Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="lg:col-span-8 rounded-3xl bg-slate-950 border-2 border-[#d4af37]/60 overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]"
          >
            {/* Top Bar */}
            <div className="bg-[#1b4d3e]/90 px-4 py-3 border-b border-[#d4af37]/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
                <span className="text-xs font-black text-[#d4af37] uppercase tracking-wider">{currentCh.badge}</span>
                <span className="text-xs font-bold text-white pl-2 border-l border-[#d4af37]/30">{currentCh.title}</span>
              </div>
              <Tv size={18} className="text-[#d4af37]" />
            </div>

            {/* Embed Player Canvas */}
            <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden group">
              <iframe
                src="https://www.youtube-nocookie.com/embed/jfKfPfyJRdk?autoplay=0&mute=1&controls=1"
                title={currentCh.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Bottom Info Bar */}
            <div className="p-4 sm:p-6 bg-[#0e2e25] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-[#d4af37]/30">
              <div>
                <h3 className="font-serif text-lg font-bold text-white">{currentCh.title}</h3>
                <p className="text-xs text-[#faf6ed]/70">{currentCh.subtitle}</p>
              </div>

              <a
                href="https://wa.me/96899111870"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-[#d4af37] hover:bg-amber-400 text-[#0e2e25] font-black text-xs flex items-center gap-2 transition"
              >
                <MessageSquare size={14} />
                <span>Send Live Feedback</span>
              </a>
            </div>

          </motion.div>

          {/* Right Channel Switcher Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#d4af37]">
              Select Channel Stream
            </h4>

            <div className="space-y-3">
              {channels.map((ch, idx) => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannel(idx)}
                  className={`w-full p-4 rounded-2xl text-left border transition flex items-start gap-3 ${
                    activeChannel === idx 
                      ? 'bg-[#1b4d3e] border-[#d4af37] text-white shadow-xl' 
                      : 'bg-[#0e2e25] border-[#d4af37]/30 text-[#faf6ed]/80 hover:bg-[#1b4d3e]/50'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${activeChannel === idx ? 'bg-[#d4af37] text-[#0e2e25]' : 'bg-[#1b4d3e] text-[#d4af37]'}`}>
                    <Play size={16} />
                  </div>
                  <div>
                    <span className="block text-xs font-extrabold text-white">{ch.title}</span>
                    <span className="block text-[10px] text-[#faf6ed]/60 mt-1">{ch.subtitle}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-[#1b4d3e]/50 border border-[#d4af37]/30 space-y-2">
              <span className="text-xs font-bold text-[#d4af37] block">📡 Broadcast Studio Guidelines</span>
              <p className="text-[11px] text-[#faf6ed]/80 leading-relaxed">
                Live executive cabinet assemblies are streamed every Friday at 17:00 GST. For media rights and live coverage requests, contact the Information Secretary.
              </p>
            </div>

          </div>

        </div>

      </div>

    </section>
  );
}
