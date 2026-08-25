import { useState, useEffect } from 'react';
import { SponsoredAd } from '../types';
import { 
  PhoneCall, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Pause, 
  Play, 
  X, 
  Sparkles, 
  ExternalLink,
  Layers,
  ZoomIn
} from 'lucide-react';

interface SponsoredBillboardProps {
  ads: SponsoredAd[];
}

export default function SponsoredBillboard({ ads }: SponsoredBillboardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [fitMode, setFitMode] = useState<'contain' | 'cover' | 'fill'>('contain');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Filter only active ads
  const isActive = (ad: SponsoredAd) => {
    const today = new Date().toISOString().slice(0, 10);
    if (ad.start && today < ad.start) return false;
    if (ad.end && today > ad.end) return false;
    return true;
  };

  const activeAds = ads.filter(ad => isActive(ad) && (ad.image || ad.video));

  useEffect(() => {
    if (activeAds.length <= 1 || !isPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeAds.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeAds.length, isPlaying]);

  if (activeAds.length === 0) {
    return (
      <div className="relative my-6 max-w-5xl mx-auto">
        {/* 3D Spotlights top */}
        <div className="flex justify-around items-end px-12 -mb-2 relative z-20 pointer-events-none">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-2.5 h-4 bg-gradient-to-b from-slate-800 to-slate-900 rounded-t-sm shadow-md" />
              <div className="w-6 h-3 bg-gradient-to-tr from-slate-900 via-slate-700 to-slate-800 rounded-full border border-amber-500/40 shadow-lg" />
            </div>
          ))}
        </div>

        {/* 3D Frame Empty State */}
        <div className="bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-950 text-amber-100 rounded-2xl p-10 text-center border-4 border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.1),transparent_70%)] pointer-events-none" />
          <div className="relative z-10 max-w-md mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Sparkles size={14} className="animate-spin text-amber-400" /> 3D Digital Highway Billboard
            </div>
            <h3 className="text-xl font-serif font-bold text-white">No Active Billboard Promotions</h3>
            <p className="text-xs text-amber-200/70 leading-relaxed">
              Target thousands of Omani diaspora members daily with high-impact 3D digital banner placements.
            </p>
            <a 
              href="https://wa.me/96899111870" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-2 mt-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 font-extrabold px-5 py-2.5 rounded-xl text-xs transition-all shadow-lg active:scale-95"
            >
              <PhoneCall size={15} /> Book Highway Billboard (+968 99111870)
            </a>
          </div>
        </div>

        {/* 3D Pillars bottom */}
        <div className="flex justify-between items-start px-20 -mt-1 relative z-0 pointer-events-none opacity-80">
          <div className="w-8 sm:w-12 h-8 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-950 border-x border-slate-950 shadow-2xl" />
          <div className="w-8 sm:w-12 h-8 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-950 border-x border-slate-950 shadow-2xl" />
        </div>
      </div>
    );
  }

  const currentAd = activeAds[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? activeAds.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeAds.length);
  };

  return (
    <div className="relative my-4 sm:my-8 max-w-5xl mx-auto font-sans select-none">
      
      {/* 1. TOP 3D SPOTLIGHT FIXTURES */}
      <div className="flex justify-around items-end px-8 sm:px-20 -mb-2 relative z-20 pointer-events-none">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center">
            {/* Mounting bracket */}
            <div className="w-2 sm:w-3 h-3 sm:h-5 bg-gradient-to-b from-slate-900 via-slate-700 to-slate-950 shadow-md border-x border-slate-800" />
            {/* Lamp Head */}
            <div className="w-7 sm:w-10 h-3.5 sm:h-5 bg-gradient-to-tr from-slate-950 via-slate-800 to-slate-700 rounded-full border-2 border-amber-500/50 shadow-xl flex items-center justify-center relative overflow-hidden">
              <div className="w-full h-full bg-amber-300/30 blur-[2px] animate-pulse" />
            </div>
            {/* Spotlight Beam Cone */}
            <div className="w-16 sm:w-32 h-16 sm:h-24 bg-gradient-to-b from-amber-300/25 via-amber-200/5 to-transparent blur-md -mt-1 pointer-events-none" />
          </div>
        ))}
      </div>

      {/* 2. MAIN 3D BILLBOARD FRAME STRUCTURE */}
      <div className="bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 border-2 sm:border-4 border-slate-700/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative group transition-transform duration-500">
        
        {/* Corner Rivet Bolts for 3D realism */}
        <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-gradient-to-tr from-slate-700 to-slate-300 shadow-inner border border-slate-950 z-30" />
        <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-gradient-to-tr from-slate-700 to-slate-300 shadow-inner border border-slate-950 z-30" />
        <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-gradient-to-tr from-slate-700 to-slate-300 shadow-inner border border-slate-950 z-30" />
        <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-gradient-to-tr from-slate-700 to-slate-300 shadow-inner border border-slate-950 z-30" />

        {/* Top 3D Digital Header Strip */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-amber-500/30 px-3 py-1.5 rounded-t-xl flex items-center justify-between text-white text-[11px] font-sans font-extrabold mb-1 shadow-inner">
          <div className="flex items-center gap-2 text-amber-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span className="font-mono text-[10px] text-amber-200 uppercase tracking-wider">
              {currentAd.name || 'Sponsored Promotion'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Image Fit Mode Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-[10px]">
              <button
                onClick={() => setFitMode('contain')}
                className={`px-2 py-0.5 rounded font-bold transition ${fitMode === 'contain' ? 'bg-amber-500 text-emerald-950 shadow-xs' : 'text-slate-400 hover:text-white'}`}
                title="Fit Entire Image"
              >
                Fit Full
              </button>
              <button
                onClick={() => setFitMode('cover')}
                className={`px-2 py-0.5 rounded font-bold transition ${fitMode === 'cover' ? 'bg-amber-500 text-emerald-950 shadow-xs' : 'text-slate-400 hover:text-white'}`}
                title="Fill Frame"
              >
                Fill
              </button>
              <button
                onClick={() => setFitMode('fill')}
                className={`px-2 py-0.5 rounded font-bold transition ${fitMode === 'fill' ? 'bg-amber-500 text-emerald-950 shadow-xs' : 'text-slate-400 hover:text-white'}`}
                title="Stretch to Frame"
              >
                Stretch
              </button>
            </div>

            {/* Expand Lightbox Button */}
            <button
              onClick={() => setIsLightboxOpen(true)}
              className="bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition"
              title="Expand full high-resolution image"
            >
              <ZoomIn size={12} /> High-Res
            </button>
          </div>
        </div>

        {/* 3D SCREEN DISPLAY CANVAS - Completely clean ad view with zero text overlay */}
        <div className="relative h-[240px] sm:h-[380px] md:h-[440px] w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-[inset_0_0_35px_rgba(0,0,0,0.9)] flex items-center justify-center">
          
          {/* Subtle glass reflection sheen angle */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent z-10 pointer-events-none" />

          {/* DUAL LAYER IMAGE FIT ENGINE */}
          {currentAd.video ? (
            <video 
              src={currentAd.video || undefined} 
              className="w-full h-full object-contain bg-black z-0"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              {/* Layer 1: Ambient Blurred Backdrop to fill screen borders smoothly */}
              <img 
                src={currentAd.image || undefined} 
                alt="" 
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover blur-2xl scale-125 opacity-30 brightness-75 transition-all duration-700 pointer-events-none"
              />

              {/* Layer 2: Main Crisp High-Res Image */}
              <img 
                src={currentAd.image || undefined} 
                alt={currentAd.name} 
                className={`relative z-0 max-w-full max-h-full transition-all duration-500 drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)] cursor-pointer ${
                  fitMode === 'contain' 
                    ? 'w-full h-full object-contain p-1' 
                    : fitMode === 'cover' 
                    ? 'w-full h-full object-cover' 
                    : 'w-full h-full object-fill'
                }`}
                onClick={() => setIsLightboxOpen(true)}
              />
            </div>
          )}

          {/* Next / Prev 3D Side Chevron Buttons */}
          {activeAds.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-slate-950/80 hover:bg-amber-500 hover:text-emerald-950 text-white p-2.5 rounded-full border border-slate-700/80 shadow-2xl z-20 transition active:scale-90 group-hover:opacity-100 opacity-80"
                title="Previous Ad"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-slate-950/80 hover:bg-amber-500 hover:text-emerald-950 text-white p-2.5 rounded-full border border-slate-700/80 shadow-2xl z-20 transition active:scale-90 group-hover:opacity-100 opacity-80"
                title="Next Ad"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Auto-Slide Timer Progress Line */}
          {isPlaying && activeAds.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800 z-20">
              <div 
                key={currentIndex}
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 animate-[progress_5s_linear]" 
              />
            </div>
          )}
        </div>

        {/* 3D FOOTER CONTROL & SPONSOR INFO TOOLBAR (Below the screen canvas) */}
        <div className="mt-2 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 py-2.5 px-4 rounded-b-xl border-t border-slate-800 text-slate-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-md hover:bg-slate-800 text-amber-400 transition shrink-0"
              title={isPlaying ? "Pause auto-slide" : "Play auto-slide"}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            
            <div className="truncate">
              <span className="font-serif font-bold text-amber-300 text-sm mr-2">{currentAd.name}</span>
              {currentAd.caption && (
                <span className="text-[11px] text-slate-400 hidden md:inline truncate">{currentAd.caption}</span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
            {/* Slide Indicator Dots */}
            {activeAds.length > 1 && (
              <div className="flex items-center gap-1.5">
                {activeAds.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === currentIndex ? 'bg-amber-400 w-5' : 'bg-slate-700 hover:bg-slate-500 w-2'
                    }`}
                    title={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}

            {currentAd.link && (
              <a
                href={currentAd.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 font-bold text-[11px] flex items-center gap-1 transition"
              >
                <ExternalLink size={12} /> Visit Link
              </a>
            )}

            {/* Direct WhatsApp Contact Button */}
            <a 
              href="https://wa.me/96899111870" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-lg text-[11px] flex items-center gap-1 transition shadow-xs"
            >
              <PhoneCall size={12} /> Ads Contact
            </a>
          </div>
        </div>
      </div>

      {/* 3D DUAL SUPPORT HEAVY STEEL PILLARS AT BOTTOM */}
      <div className="flex justify-between items-start px-12 sm:px-28 -mt-1 relative z-0 pointer-events-none">
        {/* Left Heavy Pillar */}
        <div className="flex flex-col items-center">
          <div className="w-8 sm:w-14 h-12 sm:h-20 bg-gradient-to-r from-slate-950 via-slate-700 to-slate-900 border-x-2 border-slate-950 shadow-2xl relative">
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-slate-950" />
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(0,0,0,0.4)_6px,rgba(0,0,0,0.4)_12px)] opacity-60" />
          </div>
        </div>

        {/* Right Heavy Pillar */}
        <div className="flex flex-col items-center">
          <div className="w-8 sm:w-14 h-12 sm:h-20 bg-gradient-to-r from-slate-950 via-slate-700 to-slate-900 border-x-2 border-slate-950 shadow-2xl relative">
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-slate-950" />
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(0,0,0,0.4)_6px,rgba(0,0,0,0.4)_12px)] opacity-60" />
          </div>
        </div>
      </div>

      {/* Ground Pedestal Concrete Base with Ambient Drop Shadow */}
      <div className="w-64 sm:w-96 h-3.5 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 rounded-full mx-auto shadow-[0_15px_30px_rgba(0,0,0,0.9)] border-t border-slate-600/50 -mt-2 relative z-0" />


      {/* 4. EXPAND LIGHTBOX MODAL FOR FULL RESOLUTION VIEWING */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 animate-fadeIn font-sans">
          <div className="relative max-w-5xl w-full max-h-[90vh] bg-slate-900 border-2 border-amber-500/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="bg-amber-500 text-emerald-950 font-extrabold text-[10px] uppercase px-2.5 py-1 rounded">
                  Full Resolution Banner
                </span>
                <h3 className="font-serif font-bold text-amber-300 text-base sm:text-lg">
                  {currentAd.name}
                </h3>
              </div>
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-xl transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Full Image Canvas */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950 relative min-h-[300px]">
              {currentAd.video ? (
                <video src={currentAd.video || undefined} controls autoPlay className="max-w-full max-h-[70vh] rounded-lg shadow-2xl" />
              ) : (
                <img 
                  src={currentAd.image || undefined} 
                  alt={currentAd.name} 
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl border border-slate-800"
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-300">
              <div>
                <p className="font-semibold text-white">{currentAd.name}</p>
                {currentAd.caption && <p className="text-slate-400 mt-0.5">{currentAd.caption}</p>}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {currentAd.link && (
                  <a
                    href={currentAd.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition"
                  >
                    <ExternalLink size={14} /> Visit Website
                  </a>
                )}
                <a
                  href="https://wa.me/96899111870"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition border border-emerald-500"
                >
                  <PhoneCall size={14} /> Contact Sponsor
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

