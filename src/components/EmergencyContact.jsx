import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, Clock3, ExternalLink, Mail, MapPin, PhoneCall, ShieldCheck } from 'lucide-react';

const emergencyPhone = '+96899859757';
const embassyPhone = '+96824684600';

export default function EmergencyContact() {
  return (
    <main className="min-h-screen bg-[#faf6ed] px-4 py-10 pb-28 text-[#0e2e25] sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#1b4d3e] underline underline-offset-4">
          <ArrowLeft size={16} /> Home
        </Link>
        <div className="mt-7 rounded-3xl bg-[#0e2e25] p-6 text-[#faf6ed] shadow-xl sm:p-9">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d4af37] text-[#0e2e25]"><ShieldCheck size={25} /></div>
          <p className="mt-5 text-xs font-black uppercase tracking-[.2em] text-[#d4af37]">Pakhtoon Community Oman</p>
          <h1 className="mt-2 font-serif text-3xl font-black">Emergency Contacts</h1>
          <p className="mt-3 text-sm leading-6 text-[#faf6ed]/75">Tap a phone number to call. For immediate danger, contact the local emergency services first.</p>

          <a href={`tel:${emergencyPhone}`} className="mt-7 flex items-center gap-4 rounded-2xl border border-red-300/40 bg-red-700 px-5 py-5 text-white shadow-lg">
            <PhoneCall size={25} />
            <span><span className="block text-xs font-bold uppercase tracking-wider text-white/80">OPC Emergency Hotline</span><strong className="mt-1 block text-xl">+968 9985 9757</strong><span className="mt-1 block text-xs text-white/80">Tap to call now</span></span>
          </a>

          <section className="mt-5 rounded-2xl border border-[#d4af37]/30 bg-white p-5 text-[#0e2e25]">
            <h2 className="flex items-center gap-2 text-lg font-black"><Building2 size={20} className="text-[#1b4d3e]" /> Embassy of Pakistan, Muscat</h2>
            <p className="mt-3 flex items-start gap-2 text-sm text-slate-700"><MapPin size={17} className="mt-0.5 shrink-0" /> Al Khuwair, Muscat, Sultanate of Oman</p>
            <a href={`tel:${embassyPhone}`} className="mt-3 flex items-center gap-2 text-sm font-bold text-[#1b4d3e] underline underline-offset-4"><PhoneCall size={16} /> +968 2468 4600</a>
            <a href="mailto:parepmuscat@mofa.gov.pk" className="mt-3 flex items-center gap-2 break-all text-sm font-bold text-[#1b4d3e] underline underline-offset-4"><Mail size={16} /> parepmuscat@mofa.gov.pk</a>
            <p className="mt-3 flex items-center gap-2 text-sm text-slate-700"><Clock3 size={16} /> Sunday–Thursday, 8:00 AM–4:00 PM</p>
            <a href="https://mofa.gov.pk/muscat" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#1b4d3e] underline underline-offset-4">Official embassy website <ExternalLink size={15} /></a>
          </section>

          <Link to="/membership?tab=report" className="mt-5 flex w-full items-center justify-center rounded-xl bg-[#d4af37] px-5 py-3.5 text-sm font-black text-[#0e2e25]">Submit an incident report</Link>
          <p className="mt-3 text-center text-xs text-[#faf6ed]/65">Incident reports require member sign-in.</p>
        </div>
      </div>
    </main>
  );
}
