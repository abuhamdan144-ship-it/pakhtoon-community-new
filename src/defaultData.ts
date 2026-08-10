import { Member, CabinetMember, NewsAnnouncement, Election, EmbassySetting, FounderProfile, Donation, IncidentReport } from './types';

export const DEFAULT_MEMBERS: Member[] = [
  {
    id: 'mem-101',
    name: 'Shahid Khan Pukhtoon',
    father: 'Sher Ali Khan',
    cnic: '17301-1234567-1',
    district: 'Peshawar',
    phone: '+968 9123 4567',
    whatsapp: '+968 9123 4567',
    address: 'Building 14, Al Khuwair, Muscat',
    occupation: 'Civil Engineer',
    emergency: '+92 300 1234567',
    status: 'approved',
    membershipId: 'OPC-1001',
    createdAt: new Date().toISOString(),
    feeAmount: 5,
    paymentMethod: 'Bank Transfer',
    email: 'shahid.khan@example.com',
    cardColor: 'emerald'
  },
  {
    id: 'mem-102',
    name: 'Muhammad Usman Swati',
    father: 'Jan Mohammad',
    cnic: '15402-7654321-3',
    district: 'Swat',
    phone: '+968 9876 5432',
    whatsapp: '+968 9876 5432',
    address: 'Shop 5, Central Souq, Ruwi, Muscat',
    occupation: 'Businessman',
    emergency: '+92 312 9876543',
    status: 'approved',
    membershipId: 'OPC-1002',
    createdAt: new Date().toISOString(),
    feeAmount: 5,
    paymentMethod: 'Cash',
    email: 'usman.swat@example.com',
    cardColor: 'blue'
  },
  {
    id: 'mem-103',
    name: 'Ahmad Khan Khattak',
    father: 'Zahid Khan',
    cnic: '14201-9812345-5',
    district: 'Karak',
    phone: '+968 9555 4321',
    whatsapp: '+968 9555 4321',
    address: 'Way 2104, Qurum, Muscat',
    occupation: 'IT Specialist',
    emergency: '+92 333 5554321',
    status: 'approved',
    membershipId: 'OPC-1003',
    createdAt: new Date().toISOString(),
    feeAmount: 5,
    paymentMethod: 'Bank Transfer',
    email: 'ahmad.khattak@example.com',
    cardColor: 'maroon'
  }
];

export const DEFAULT_CABINET: CabinetMember[] = [
  {
    id: 'cab-1',
    name: 'Engr. Gul Zada Pukhtoon',
    position: 'Chairman',
    phone: '+968 9911 1870',
    email: 'chairman@opcoman.org',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'cab-2',
    name: 'Sahibzada Khan',
    position: 'Chairman Executive Council',
    phone: '+968 99111870',
    email: 'chairman.council@opcoman.org',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'cab-3',
    name: 'Haji Fazal Mohammad',
    position: 'President',
    phone: '+968 9922 3344',
    email: 'president@opcoman.org',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'cab-4',
    name: 'Mohammad Ali Shinwari',
    position: 'President Muscat Chapter',
    phone: '+968 98223344',
    email: 'president.muscat@opcoman.org',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'cab-5',
    name: 'Khan Mohammad Swati',
    position: 'General Secretary',
    phone: '+968 9933 4455',
    email: 'gensec@opcoman.org',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'cab-6',
    name: 'Gul Zada Yousafzai',
    position: 'General Secretary',
    phone: '+968 97334455',
    email: 'gensec.yousafzai@opcoman.org',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'cab-7',
    name: 'Noor Rahman Khattak',
    position: 'Finance Secretary',
    phone: '+968 9944 5566',
    email: 'finance@opcoman.org',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'cab-8',
    name: 'Hazrat Shah Mohmand',
    position: 'Finance & Treasury',
    phone: '+968 94667788',
    email: 'treasury@opcoman.org',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'cab-9',
    name: 'Said Umar Khan',
    position: 'Information Secretary',
    phone: '+968 9955 6677',
    email: 'info@opcoman.org',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'cab-10',
    name: 'Engineer Bilal Afridi',
    position: 'Chief Organizer Salalah',
    phone: '+968 95556677',
    email: 'salalah@opcoman.org',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'cab-11',
    name: 'Dr. Tariq Khattak',
    position: 'Welfare Secretary',
    phone: '+968 9644 5566',
    email: 'welfare@opcoman.org',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80'
  }
];

export const DEFAULT_NEWS: NewsAnnouncement[] = [
  {
    id: 'news-1',
    title: 'Oman Pukhtoon Community Annual Welfare & Medical Drive',
    content: 'OPC executive cabinet announces a free health screening and legal assistance camp for all Pashtun diaspora members residing in the Sultanate of Oman.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'news-2',
    title: 'Pashto Cultural Day & Community Gathering in Muscat',
    content: 'Join us for a grand cultural evening celebrating Pashtun heritage, traditional music, and poetry at the Community Hall in Ruwi.',
    createdAt: new Date().toISOString()
  }
];

export const DEFAULT_ELECTIONS: Election[] = [
  {
    id: 'elec-2026',
    title: 'OPC Executive Cabinet Elections 2026',
    status: 'open',
    candidates: [
      { id: 'cand-1', name: 'Engr. Gul Zada Pukhtoon', votes: 48 },
      { id: 'cand-2', name: 'Khan Mohammad Swati', votes: 41 },
      { id: 'cand-3', name: 'Noor Rahman Khattak', votes: 35 }
    ],
    createdAt: new Date().toISOString(),
    endDate: '2026-12-31'
  }
];

export const DEFAULT_EMBASSY: EmbassySetting = {
  address: 'Diplomatic Area, Al Khuwair, P.O. Box 101, Muscat, Sultanate of Oman',
  phone: '+968 2460 5511',
  emergency: '+968 9911 1870',
  email: 'info@pakembassyoman.org',
  hours: 'Sun - Thu: 08:00 AM - 03:00 PM',
  website: 'https://pakembassyoman.org'
};

export const DEFAULT_FOUNDER: FounderProfile = {
  name: 'Haji Fazal Mohammad Pukhtoon',
  position: 'Founder & Patron-in-Chief',
  phone: '+968 9911 1870',
  email: 'founder@opcoman.org',
  address: 'Ruwi, Muscat, Sultanate of Oman',
  est: '2012',
  quote: 'Uniting our community, supporting brothers in need, and serving with honor across Oman.',
  bio1: 'Haji Fazal Mohammad founded the Oman Pukhtoon Community (OPC) to provide welfare, emergency assistance, and cultural unity for Pashtun expatriates across the Sultanate of Oman.',
  bio2: 'Under his leadership, OPC has helped thousands of overseas workers with legal aid, medical support, emergency repatriation, and cultural preservation.'
};

export const DEFAULT_DONATIONS: Donation[] = [
  {
    id: 'don-1',
    donor: 'Anonymous Brother',
    phone: '+968 91234567',
    amount: 100,
    date: new Date().toISOString().slice(0, 10),
    method: 'Bank Transfer',
    note: 'Community Welfare Fund',
    status: 'approved',
    createdAt: new Date().toISOString()
  }
];

export const DEFAULT_INCIDENTS: IncidentReport[] = [
  {
    id: 'inc-1',
    type: 'loss',
    name: 'Document Assistance Request',
    description: 'Passport renewal and labor card support guidance required for community member.',
    date: new Date().toISOString().slice(0, 10),
    contact: '+968 99111870',
    status: 'published',
    createdAt: new Date().toISOString()
  }
];
