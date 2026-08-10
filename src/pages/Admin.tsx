import React from 'react';
import { motion } from 'framer-motion';
import AdminPanel from '../components/AdminPanel';
import { 
  Member, CabinetMember, Donation, IncidentReport, NewsAnnouncement, 
  EmbassySetting, FounderProfile, Election, SponsoredAd, CabinetMeeting 
} from '../types';
import { User } from 'firebase/auth';

interface AdminPageProps {
  user: User | null;
  members: Member[];
  cabinet: CabinetMember[];
  donations: Donation[];
  incidents: IncidentReport[];
  news: NewsAnnouncement[];
  embassy: EmbassySetting;
  founderProfile: FounderProfile;
  elections: Election[];
  ads: SponsoredAd[];
  meetings: CabinetMeeting[];
  onViewDocuments: (member: Member) => void;
  onOpenAdminAuth?: () => void;
}

export default function AdminPage({
  user,
  members,
  cabinet,
  donations,
  incidents,
  news,
  embassy,
  founderProfile,
  elections,
  ads,
  meetings,
  onViewDocuments,
  onOpenAdminAuth
}: AdminPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-[#0e2e25] text-white py-8 px-4"
    >
      <AdminPanel 
        user={user}
        members={members}
        cabinet={cabinet}
        donations={donations}
        incidents={incidents}
        news={news}
        embassy={embassy}
        founderProfile={founderProfile}
        elections={elections}
        ads={ads}
        meetings={meetings}
        onViewDocuments={onViewDocuments}
      />
    </motion.div>
  );
}
