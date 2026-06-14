import { useState, useEffect } from 'react';
import { SponsoredAd } from '../types';
import { PhoneCall } from 'lucide-react';

interface SponsoredBillboardProps {
  ads: SponsoredAd[];
}

export default function SponsoredBillboard({ ads }: SponsoredBillboardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter only active ads
  const isActive = (ad: SponsoredAd) => {
    const today = new Date().toISOString().slice(0, 10);
    if (ad.start && today < ad.start) return false;
    if (ad.end && today > ad.end) return false;
    return true;
  };

  const activeAds = ads.filter(ad => isActive(ad) && ad.image);

  useEffect(() => {
    if (activeAds.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeAds.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeAds.length]);

  if (activeAds.length === 0) {
    return (
      <div className="bg-emerald-950/95 text-amber-100 rounded-lg p-12 text-center border-2 border-amber-500/30">
        <p className="text-sm">No sponsored ads currently running.</p>
        <p className="text-xs text-amber-200/65 mt-1">Be the first to promote your business here — Contact OPC!</p>
        <a 
          href="https://wa.me/96899111870" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center gap-2 mt-4 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold px-4 py-2 rounded-md text-xs transition active:scale-95"
        >
          <PhoneCall size={14} /> WhatsApp OPC Ads (+968 99111870)
        </a>
      </div>
    );
  }

  const currentAd = activeAds[currentIndex];

  return (
    <div className="border border-amber-500/40 rounded-xl overflow-hidden bg-emerald-950 relative shadow-lg group">
      <div className="relative h-[180px] sm:h-[300px] w-full">
        <a 
          href={currentAd.link || '#'} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="block w-full h-full relative"
        >
          <span className="absolute top-3 left-3 bg-amber-600 text-emerald-950 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full z-10 shadow-sm">
            Sponsored
          </span>
          
          <img 
            src={currentAd.image} 
            alt={currentAd.name} 
            className="w-full h-full object-contain bg-emerald-950/40 transition-all"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/95 via-transparent to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white text-left">
            <h3 className="font-serif text-lg sm:text-2xl font-bold text-amber-300">
              {currentAd.name}
            </h3>
            {currentAd.caption && (
              <p className="text-xs sm:text-sm text-amber-100/90 mt-1 line-clamp-2">
                {currentAd.caption}
              </p>
            )}
          </div>
        </a>
      </div>

      {activeAds.length > 1 && (
        <div className="bg-emerald-950/90 py-2.5 flex justify-center gap-1.5 border-t border-emerald-900">
          {activeAds.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex ? 'bg-amber-500 w-4' : 'bg-amber-500/30 hover:bg-amber-500/55'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
