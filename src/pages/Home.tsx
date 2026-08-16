import React from 'react';
import { motion } from 'motion/react';
import Hero from '../components/Hero';
import Glass3DPipeTicker from '../components/Glass3DPipeTicker';
import Stats from '../components/Stats';
import Cabinet from '../components/Cabinet';
import News from '../components/News';
import LiveTV from '../components/LiveTV';
import SponsoredBillboard from '../components/SponsoredBillboard';
import OmanDistrictMap from '../components/OmanDistrictMap';
import { 
  Member, CabinetMember, NewsAnnouncement, IncidentReport, SponsoredAd 
} from '../types';

interface HomeProps {
  onNavigate: (tab: string) => void;
  members: Member[];
  cabinet: CabinetMember[];
  news: NewsAnnouncement[];
  incidents: IncidentReport[];
  ads: SponsoredAd[];
  donationTotal: number;
}

export default function Home({
  onNavigate,
  members,
  cabinet,
  news,
  incidents,
  ads,
  donationTotal
}: HomeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="space-y-0"
    >
      {/* Hero Section */}
      <Hero 
        onNavigate={onNavigate}
        memberCount={members.length}
        incidentCount={incidents.length}
        donationTotal={donationTotal}
      />

      {/* 3D Glass Pipe Ticker */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <Glass3DPipeTicker news={news} />
      </div>

      {/* Stats Dashboard */}
      <Stats 
        memberCount={members.length}
        cabinetCount={cabinet.length}
        donationTotal={donationTotal}
        incidentCount={incidents.length}
      />

      {/* Sponsored Ads Billboard */}
      <div className="bg-[#0e2e25] py-12 px-4 sm:px-6 lg:px-8 border-b border-[#d4af37]/30">
        <div className="max-w-7xl mx-auto">
          <SponsoredBillboard ads={ads} />
        </div>
      </div>

      {/* Live TV Cinema Stream */}
      <LiveTV />

      {/* Cabinet Executive Assembly */}
      <Cabinet cabinet={cabinet} />

      {/* Oman Chapter Map */}
      <section className="py-16 bg-[#faf6ed] border-b border-[#d4af37]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <OmanDistrictMap members={members} />
        </div>
      </section>

      {/* Press & News Releases */}
      <News news={news} />

    </motion.div>
  );
}
