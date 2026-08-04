import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Sparkles, Calendar, Heart, Shield, Award, Share2, Check, Star, PartyPopper } from 'lucide-react';

// Color Palette for Pakistan National Day
export const PAKISTAN_GREEN = '#01411C';
export const PAKISTAN_GREEN_LIGHT = '#02682c';
export const ACCENT_GOLD = '#fbbf24';

let confettiInstance: ((options?: confetti.Options) => Promise<null> | null) | null = null;

function getSafeConfetti() {
  if (typeof window === 'undefined') return null;
  if (confettiInstance) return confettiInstance;

  try {
    let canvas = document.getElementById('national-day-confetti-canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'national-day-confetti-canvas';
      canvas.style.position = 'fixed';
      canvas.style.top = '0px';
      canvas.style.left = '0px';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '99999';
      document.body.appendChild(canvas);
    }

    if (canvas && typeof canvas.getBoundingClientRect === 'function') {
      const myConfetti = confetti.create(canvas, {
        resize: true,
        useWorker: false
      });
      confettiInstance = (opts?: confetti.Options) => {
        try {
          return myConfetti(opts);
        } catch (err) {
          console.warn('Confetti execution suppressed:', err);
          return null;
        }
      };
      return confettiInstance;
    }
  } catch (err) {
    console.warn('Confetti canvas creation suppressed:', err);
  }

  // Fallback direct invocation wrapped safely
  return (opts?: confetti.Options) => {
    try {
      return confetti(opts);
    } catch (err) {
      console.warn('Confetti fallback suppressed:', err);
      return null;
    }
  };
}

export function fireNationalConfetti() {
  try {
    const launcher = getSafeConfetti();
    if (!launcher) return;

    const count = 180;
    const defaults = {
      origin: { y: 0.6 }
    };

    const fire = (particleRatio: number, opts: confetti.Options) => {
      launcher({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    };

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ['#01411C', '#02682c', '#ffffff', '#fbbf24']
    });
    fire(0.2, {
      spread: 60,
      colors: ['#ffffff', '#01411C', '#10b981']
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
      colors: ['#01411C', '#ffffff', '#fbbf24', '#047857']
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      colors: ['#ffffff', '#fbbf24', '#01411C']
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
      colors: ['#01411C', '#10b981', '#ffffff']
    });
  } catch (err) {
    console.warn('fireNationalConfetti suppressed error:', err);
  }
}

// Crescent & Star SVG Component
export function CrescentStarIcon({ className = "w-6 h-6", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill={color} aria-hidden="true">
      {/* Crescent Moon */}
      <path d="M55,10 A40,40 0 1,0 95,50 A32,32 0 1,1 55,10 Z" />
      {/* 5-Pointed Tilted Star */}
      <polygon points="68,26 71,36 81,36 73,42 76,52 68,46 60,52 63,42 55,36 65,36" />
    </svg>
  );
}

// Waving Pakistani Flag Vector Graphic
export function PakistaniFlagVector({ className = "w-12 h-8" }: { className?: string }) {
  return (
    <div className={`relative inline-block overflow-hidden rounded-sm shadow-md border border-white/20 select-none ${className}`}>
      <svg viewBox="0 0 900 600" className="w-full h-full object-cover">
        {/* White vertical stripe on left (1/4 width) */}
        <rect width="225" height="600" fill="#ffffff" />
        {/* Dark Green field on right (3/4 width) */}
        <rect x="225" width="675" height="600" fill="#01411C" />
        {/* White Crescent */}
        <path d="M600,120 A210,210 0 1,0 810,330 A168,168 0 1,1 600,120 Z" fill="#ffffff" />
        {/* White Star tilted 45 degrees towards peak */}
        <polygon points="665,210 681,262 735,262 691,294 708,346 665,314 622,346 639,294 595,262 649,262" fill="#ffffff" />
      </svg>
    </div>
  );
}

// Top Announcement Bar Component
export function NationalDayAnnouncementBar({ 
  isThemeActive, 
  onToggleTheme 
}: { 
  isThemeActive: boolean; 
  onToggleTheme: () => void; 
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fire festive burst on load if theme active
    if (isThemeActive) {
      const timer = setTimeout(() => {
        fireNationalConfetti();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isThemeActive]);

  return (
    <div className="bg-[#01411C] text-white border-b-2 border-amber-400/80 shadow-md relative z-40 overflow-hidden font-sans">
      {/* Sparkle background decoration */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
      
      <div className="container mx-auto px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs relative z-10">
        
        {/* Left Side: Festive Badge & Scrolling Announcement */}
        <div className="flex items-center gap-2 text-center sm:text-left">
          <span className="bg-amber-400 text-[#01411C] font-extrabold text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1 shrink-0 animate-pulse">
            <CrescentStarIcon className="w-3 h-3" color="#01411C" />
            14 August Theme
          </span>
          <div className="flex items-center gap-1.5 font-semibold text-amber-100 leading-snug">
            <span className="text-sm">🇵🇰</span>
            <span className="font-bold text-white">Happy Independence Day, Pakistan!</span>
            <span className="hidden md:inline text-amber-300 font-serif italic">&bull; Pakistan Zindabad!</span>
          </div>
        </div>

        {/* Right Side: Interactive Quick Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => fireNationalConfetti()}
            className="bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-amber-300 border border-emerald-500/50 font-bold px-2.5 py-1 rounded text-[11px] flex items-center gap-1 transition shadow-xs cursor-pointer"
            title="Launch Celebration Confetti"
          >
            <PartyPopper size={13} className="text-amber-400 animate-bounce" />
            <span>Celebrate 🎉</span>
          </button>

          <button
            onClick={onToggleTheme}
            className={`px-2.5 py-1 rounded text-[11px] font-bold border transition flex items-center gap-1 cursor-pointer ${
              isThemeActive
                ? 'bg-amber-400 text-[#01411C] border-amber-300 hover:bg-amber-300'
                : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
            }`}
            title="Toggle Patriotic 14 August Festive Layout"
          >
            <Sparkles size={12} />
            <span>{isThemeActive ? 'Theme Active' : 'Enable 14 Aug Theme'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// 14 August Independence Day Countdown & Freedom Clock Component
export function FreedomCountdownClock() {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isAug14: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isAug14: false });

  useEffect(() => {
    const calcTime = () => {
      const now = new Date();
      let targetYear = now.getFullYear();
      let aug14 = new Date(targetYear, 7, 14, 0, 0, 0); // Month 7 is August (0-indexed)

      // If Aug 14 has passed this year, set for next year
      if (now.getTime() > aug14.getTime() + 86400000) {
        targetYear += 1;
        aug14 = new Date(targetYear, 7, 14, 0, 0, 0);
      }

      // Check if today is August 14th
      const isAug14 = now.getMonth() === 7 && now.getDate() === 14;

      const diff = aug14.getTime() - now.getTime();

      if (diff <= 0 || isAug14) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isAug14: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isAug14: false });
    };

    calcTime();
    const interval = setInterval(calcTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (timeLeft.isAug14) {
    return (
      <div className="bg-[#01411C] text-white p-4 rounded-xl border-2 border-amber-400 text-center shadow-lg space-y-1">
        <div className="flex items-center justify-center gap-2 text-amber-300 font-serif font-extrabold text-lg sm:text-xl">
          <CrescentStarIcon className="w-6 h-6 animate-pulse" color="#fbbf24" />
          <span>Today We Celebrate Freedom!</span>
          <CrescentStarIcon className="w-6 h-6 animate-pulse" color="#fbbf24" />
        </div>
        <p className="text-xs text-amber-100 font-sans">Happy 14 August Independence Day to all Pakhtoons & Pakistanis worldwide 🇵🇰</p>
      </div>
    );
  }

  return (
    <div className="bg-emerald-950/80 backdrop-blur-md border border-amber-400/40 p-3.5 sm:p-4 rounded-xl text-white space-y-2 shadow-lg text-center">
      <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-widest">
        <Calendar size={14} className="text-amber-400" />
        <span>Countdown to 14 August Independence Day</span>
      </div>

      <div className="grid grid-cols-4 gap-2 font-mono text-center max-w-xs mx-auto pt-1">
        <div className="bg-[#01411C] p-2 rounded-lg border border-amber-500/30">
          <span className="text-lg sm:text-2xl font-black text-amber-300 block">{timeLeft.days}</span>
          <span className="text-[9px] text-emerald-200 uppercase font-sans font-bold block">Days</span>
        </div>
        <div className="bg-[#01411C] p-2 rounded-lg border border-amber-500/30">
          <span className="text-lg sm:text-2xl font-black text-white block">{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className="text-[9px] text-emerald-200 uppercase font-sans font-bold block">Hours</span>
        </div>
        <div className="bg-[#01411C] p-2 rounded-lg border border-amber-500/30">
          <span className="text-lg sm:text-2xl font-black text-white block">{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className="text-[9px] text-emerald-200 uppercase font-sans font-bold block">Mins</span>
        </div>
        <div className="bg-[#01411C] p-2 rounded-lg border border-amber-500/30">
          <span className="text-lg sm:text-2xl font-black text-amber-400 block animate-pulse">{String(timeLeft.seconds).padStart(2, '0')}</span>
          <span className="text-[9px] text-emerald-200 uppercase font-sans font-bold block">Secs</span>
        </div>
      </div>
    </div>
  );
}

// "Pakistan Zindabad" Feature Showcase Card Component
export function PakistanZindabadSection() {
  const [copiedQuote, setCopiedQuote] = useState(false);

  const shareGreeting = () => {
    const greetingText = `🇵🇰 Happy 14 August Independence Day! 🇵🇰\nPakhtoon Community salutes the nation on this glorious occasion of freedom and unity. Pakistan Zindabad! ☪️`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(greetingText);
      setCopiedQuote(true);
      setTimeout(() => setCopiedQuote(false), 2500);
    }
  };

  return (
    <section className="bg-gradient-to-br from-[#01411C] via-[#025624] to-[#013516] text-white rounded-2xl p-6 sm:p-8 md:p-10 shadow-xl relative overflow-hidden border-2 border-amber-400/40 my-6">
      
      {/* Background Flag Watermark Effect */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10 pointer-events-none">
        <CrescentStarIcon className="w-96 h-96" color="#ffffff" />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      <div className="relative z-10 space-y-6">
        
        {/* Header Badge & Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-amber-400/20 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-[#01411C] font-extrabold text-[11px] tracking-widest uppercase px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                <CrescentStarIcon className="w-3.5 h-3.5" color="#01411C" />
                14 August Special
              </span>
              <PakistaniFlagVector className="w-9 h-6" />
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black text-white tracking-tight leading-tight pt-1">
              🇵🇰 Pakistan Zindabad! <span className="text-amber-400 font-serif italic">🇵🇰</span>
            </h2>
            <p className="text-amber-100/90 text-sm sm:text-base font-sans max-w-2xl font-medium">
              Celebrating 14 August – Independence Day with pride, honor, and enduring unity across the Pakhtoon diaspora.
            </p>
          </div>

          <button
            onClick={() => fireNationalConfetti()}
            className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#01411C] font-extrabold px-5 py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 transition active:scale-95 cursor-pointer shrink-0"
          >
            <PartyPopper size={18} className="text-[#01411C]" />
            <span>Launch Freedom Confetti 🇵🇰</span>
          </button>
        </div>

        {/* Grid: Significance & Countdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          
          {/* Historical Significance Message */}
          <div className="md:col-span-2 bg-white/10 backdrop-blur-xs p-5 sm:p-6 rounded-xl border border-white/15 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-base">
                <Shield size={18} className="text-amber-400" />
                <span>Significance of 14 August</span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed font-sans">
                On <strong>14 August 1947 (27 Ramadan 1366 AH)</strong>, our nation achieved sovereign statehood under the foundational pillars of <em>Unity, Faith, and Discipline</em>. 
                The Pakhtoon Community honors the tireless sacrifices of our ancestors who fought valiantly for self-determination and dignity.
              </p>
              <p className="text-xs text-amber-200/90 leading-relaxed font-sans italic pt-1">
                "With faith, discipline and selfless devotion to duty, there is nothing worthwhile that you cannot achieve." — Quaid-e-Azam Muhammad Ali Jinnah
              </p>
            </div>

            {/* Interactive Share Action */}
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-emerald-200 font-semibold flex items-center gap-1">
                <Award size={14} className="text-amber-400" />
                Pakhtoon Community National Tribute
              </span>

              <button
                onClick={shareGreeting}
                className="bg-white/15 hover:bg-white/25 text-amber-200 border border-amber-300/30 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedQuote ? <Check size={14} className="text-green-300" /> : <Share2 size={14} />}
                <span>{copiedQuote ? 'Greeting Copied!' : 'Share 14 Aug Greeting'}</span>
              </button>
            </div>
          </div>

          {/* Countdown Clock Widget */}
          <div className="md:col-span-1 flex flex-col justify-center">
            <FreedomCountdownClock />
          </div>
        </div>

      </div>
    </section>
  );
}
