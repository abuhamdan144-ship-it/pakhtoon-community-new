import { motion, AnimatePresence } from 'motion/react';
import { X, Award, Phone, Mail, MapPin, ShieldCheck, Heart, Users, Star, Calendar } from 'lucide-react';
import { FounderProfile } from '../types';

interface FounderProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: FounderProfile;
}

const DEFAULT_PHOTO = 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400&h=400';

export default function FounderProfileModal({ isOpen, onClose, profile }: FounderProfileModalProps) {
  const name = profile?.name || 'Al-Haj Muhammad Amin';
  const position = profile?.position || 'President, Pakhtoon Community';
  const phone = profile?.phone || '+968 99111870';
  const email = profile?.email || 'president@pakhtooncommunity.org';
  const address = profile?.address || 'Central Headquarters';
  const est = profile?.est || 'Welfare Board Established in 2018';
  const photo = profile?.photo || DEFAULT_PHOTO;
  const quote = profile?.quote || 'By remaining disciplined, cooperative, and united, we not only protect our families but construct a legacy that our next generation will represent with utmost pride.';
  const bio1 = profile?.bio1 || 'Al-Haj Muhammad Amin is a respected community builder, philanthropist, and civic coordinator. Animated by a profound love for his people and culture, he founded the Pakhtoon Community registry and welfare program as an anchor point for thousands of Pakhtoon community members who have dedicated their efforts to brotherhood and welfare support.';
  const bio2 = profile?.bio2 || 'Under his direct personal guidance, the organization has shifted from an informal network into a fully structured, law-abiding diaspora association that handles essential legal support, medical assistance, repatriation files, and cultural integrations with exceptional meticulousness.';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col md:flex-row z-10 max-h-[90vh] md:max-h-[85vh] overflow-y-auto"
            id="founder-profile-modal-root"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition active:scale-95 cursor-pointer shadow-xs"
              aria-label="Close modal"
              id="founder-modal-close-btn"
            >
              <X size={18} />
            </button>

            {/* Visual Column / Sidebar (Left/Top) */}
            <div className="w-full md:w-2/5 bg-gradient-to-b from-emerald-950 to-emerald-900 text-white p-8 flex flex-col justify-between shrink-0 relative overflow-hidden">
              {/* Abstract decorative elements */}
              <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-x-32 -translate-y-32" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-700/20 rounded-full blur-3xl translate-x-32 translate-y-32" />

              <div className="space-y-6 relative z-10">
                {/* Image frame */}
                <div className="relative mx-auto w-40 h-40 sm:w-48 sm:h-48 rounded-full border-4 border-amber-400 p-1.5 shadow-xl bg-emerald-990/50 flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src={photo}
                    alt={name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full rounded-full object-cover shadow-inner"
                  />
                  <div className="absolute bottom-2 right-2 bg-amber-500 text-emerald-950 p-1.5 rounded-full shadow-md border border-amber-400">
                    <Star size={14} className="fill-emerald-950 stroke-emerald-950" />
                  </div>
                </div>

                {/* Name & Quick Metadata */}
                <div className="text-center space-y-1">
                  <p className="text-[10px] sm:text-xs font-bold font-sans text-amber-400 tracking-widest uppercase">
                    OPC Chief Patron & Founder
                  </p>
                  <h3 className="text-xl sm:text-2xl font-serif font-extrabold tracking-tight">
                    {name}
                  </h3>
                  <p className="text-xs text-slate-300 font-sans italic animate-pulse">
                    {position}
                  </p>
                </div>
              </div>

              {/* Quick Contact & Info Grid */}
              <div className="mt-8 pt-6 border-t border-white/10 space-y-3 text-xs text-slate-200 font-sans relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-amber-400">
                    <MapPin size={14} />
                  </div>
                  <span>{address}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-amber-400">
                    <Phone size={14} />
                  </div>
                  <span className="font-mono">{phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-amber-400">
                    <Mail size={14} />
                  </div>
                  <span>{email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-amber-400">
                    <Calendar size={14} />
                  </div>
                  <span>{est}</span>
                </div>
              </div>
            </div>

            {/* Narrative Column (Right/Bottom) */}
            <div className="w-full md:w-3/5 p-8 sm:p-10 flex flex-col justify-between font-sans space-y-8 bg-slate-50/50">
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-extrabold text-amber-700 tracking-wider uppercase bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full inline-block">
                    Inspirational Profile & Vision
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif font-extrabold text-emerald-950 tracking-tight mt-2.5 max-w-md">
                    Bridging Diaspora, Anchoring Welfare
                  </h2>
                </div>

                {/* Biography Paragraphs */}
                <div className="text-slate-700 text-xs sm:text-sm leading-relaxed space-y-4">
                  <p>
                    <strong>{name}</strong> is a respected community builder, philanthropist, and civic coordinator. Animated by a profound love for his people and culture, he founded the <strong>Pakhtoon Community</strong> registry and welfare program as an anchor point for thousands of Pakhtoon community members.
                  </p>
                  <p>
                    {bio1}
                  </p>
                  {bio2 && <p>{bio2}</p>}
                </div>

                {/* Core Contributions List */}
                <div className="space-y-3.5">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Award size={14} className="text-amber-600" /> Milestone Contributions
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-start gap-2 text-xs text-slate-650 bg-white p-3 rounded-xl border">
                      <ShieldCheck size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-emerald-950 block">Emergency Repatriation</strong>
                        Oversaw the return and support of hundreds of workers in extreme medical distress.
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-650 bg-white p-3 rounded-xl border">
                      <Heart size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-emerald-950 block">Social Welfare Support</strong>
                        Spearheaded welfare coordination programs for general aid and support claims.
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-650 bg-white p-3 rounded-xl border">
                      <Users size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-emerald-950 block">Consular Bridges</strong>
                        Maintained direct open communications with community representatives and diplomats.
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-650 bg-white p-3 rounded-xl border">
                      <Star size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-emerald-950 block">Diaspora Identity</strong>
                        Organized verified registrations to catalog, legalise, and honor historic service.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Founder quote */}
              <div className="pt-6 border-t border-slate-200">
                <blockquote className="border-l-4 border-amber-500 pl-4 py-1 italic text-slate-600 text-[13px] leading-relaxed">
                  "{quote}"
                </blockquote>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
