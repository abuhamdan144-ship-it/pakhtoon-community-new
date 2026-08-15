import React from 'react';
import { Radio, Sparkles } from 'lucide-react';
import { NewsAnnouncement } from '../types';

interface Glass3DPipeTickerProps {
  news?: NewsAnnouncement[];
}

export default function Glass3DPipeTicker({ news }: Glass3DPipeTickerProps) {
  const bulletinItems = news && news.length > 0 
    ? news.map(n => `📢 ${n.title}: ${n.content.slice(0, 150)}${n.content.length > 150 ? '...' : ''}`)
    : ["No active announcements at the moment."];

  return (
    <div className="relative w-full my-4 font-sans select-none">
      
      {/* 3D Glass Tube External Glow Ambient Backlight */}
      <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-emerald-500/25 to-amber-500/20 rounded-full blur-lg opacity-75 animate-pulse pointer-events-none" />

      {/* 3D GLASS PIPE CONTAINER */}
      <div className="relative w-full h-12 sm:h-14 rounded-full bg-slate-950 border-2 border-amber-400/80 shadow-[0_10px_30px_rgba(0,0,0,0.8),inset_0_4px_10px_rgba(255,255,255,0.3),inset_0_-5px_15px_rgba(0,0,0,0.95),0_0_20px_rgba(251,191,36,0.4)] overflow-hidden flex items-center">
        
        {/* Top Specular High-Gloss Glass Curved Highlight */}
        <div className="absolute top-0 inset-x-0 h-2 sm:h-2.5 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-full pointer-events-none z-30" />
        
        {/* Bottom Glass Refraction Cylinder Shadow */}
        <div className="absolute bottom-0 inset-x-0 h-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent rounded-b-full pointer-events-none z-30" />

        {/* Horizontal Glass Cylinder Lens Reflection Strip */}
        <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 h-4 bg-gradient-to-b from-white/10 via-transparent to-black/20 pointer-events-none z-20" />

        {/* Moving Glass Sheen Reflection Glint */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/20 to-transparent animate-pipe-glint pointer-events-none z-25" />

        {/* LEFT 3D METALLIC CHROME / GOLD END CAP BADGE */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-400 to-amber-500 text-emerald-950 font-black px-4 sm:px-5 h-full flex items-center gap-2 text-[11px] sm:text-xs uppercase tracking-wider rounded-l-full border-r-2 border-amber-300 z-40 shadow-2xl shrink-0 relative overflow-hidden">
          {/* Metallic Sheen Angle */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-black/20 pointer-events-none" />
          
          {/* Blinking Red Light Indicator on Cap */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-950 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-900 border border-amber-300"></span>
          </span>

          <Radio className="animate-pulse text-emerald-950 shrink-0" size={15} />
          <span className="drop-shadow-xs whitespace-nowrap hidden xs:inline">OPC BULLETIN TICKER</span>
          <span className="drop-shadow-xs whitespace-nowrap xs:hidden">OPC NEWS</span>
        </div>

        {/* 3D INNER GLASS PIPE CHAMBER WITH MOVING NEON LIGHTS */}
        <div className="flex-1 overflow-hidden relative h-full flex items-center bg-gradient-to-r from-slate-950 via-emerald-950/90 to-slate-950 px-2">
          
          {/* Subtle LED Grid Dots Pattern inside the tube */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.15)_1px,transparent_1px)] bg-[size:12px_12px] opacity-40 pointer-events-none" />

          {/* Endless Scrolling Text Track */}
          <div className="animate-marquee animate-marquee-paused-on-hover flex items-center gap-16 pr-16 z-10">
            <>
              {bulletinItems.map((text, idx) => (
                <div 
                  key={`pipe-orig-${idx}`} 
                  className="flex items-center gap-3 whitespace-nowrap font-sans font-bold text-xs sm:text-sm tracking-wide text-amber-200 drop-shadow-[0_0_10px_rgba(251,191,36,0.9)] animate-light-blink"
                  style={{ animationDelay: `${idx * 0.4}s` }}
                >
                  {/* Blinking Neon Light Bulb / Diamond Icon */}
                  <span className="relative flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-amber-400 opacity-80"></span>
                    <Sparkles className="text-amber-300 animate-spin" size={14} />
                  </span>
                  
                  {/* Neon Flashing Text */}
                  <span className="bg-gradient-to-r from-amber-200 via-amber-100 to-yellow-300 bg-clip-text text-transparent font-extrabold drop-shadow-[0_0_12px_rgba(251,191,36,1)]">
                    {text}
                  </span>
                </div>
              ))}

              {/* Duplicate loop for endless seamless scrolling */}
              {bulletinItems.map((text, idx) => (
                <div 
                  key={`pipe-dup-${idx}`} 
                  className="flex items-center gap-3 whitespace-nowrap font-sans font-bold text-xs sm:text-sm tracking-wide text-amber-200 drop-shadow-[0_0_10px_rgba(251,191,36,0.9)] animate-light-blink"
                  style={{ animationDelay: `${(idx + bulletinItems.length) * 0.4}s` }}
                >
                  <span className="relative flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-amber-400 opacity-80"></span>
                    <Sparkles className="text-amber-300 animate-spin" size={14} />
                  </span>

                  <span className="bg-gradient-to-r from-amber-200 via-amber-100 to-yellow-300 bg-clip-text text-transparent font-extrabold drop-shadow-[0_0_12px_rgba(251,191,36,1)]">
                    {text}
                  </span>
                </div>
              ))}
            </>
          </div>
        </div>

        {/* RIGHT 3D GOLDEN END PLUG CAP */}
        <div className="w-4 sm:w-6 h-full bg-gradient-to-l from-amber-600 via-amber-400 to-amber-700 border-l-2 border-amber-300 rounded-r-full z-40 shrink-0 shadow-2xl relative overflow-hidden flex items-center justify-center">
          <div className="w-1.5 h-6 bg-amber-300/40 rounded-full blur-[1px]" />
        </div>

      </div>
    </div>
  );
}
