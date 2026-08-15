import { Member, CabinetMember, NewsAnnouncement, Election, EmbassySetting, FounderProfile, Donation, IncidentReport, SponsoredAd } from './types';

export const DEFAULT_MEMBERS: Member[] = [
  {
    id: 'mem-101',
    name: 'Jan Mohammad Khan Yousafzai',
    father: 'Sher Ali Khan',
    cnic: '17301-1234567-1',
    district: 'Peshawar',
    phone: '+968 9911 1870',
    whatsapp: '+968 9911 1870',
    address: 'Building 14, Al Khuwair, Muscat',
    occupation: 'Civil Contracting & Transport',
    emergency: '+92 300 1234567',
    status: 'approved',
    membershipId: 'OPC-OMN-88421',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    feeAmount: 10,
    paymentMethod: 'Bank Transfer',
    email: 'jan.yousafzai@opcoman.org',
    cardColor: 'emerald'
  },
  {
    id: 'mem-102',
    name: 'Muhammad Usman Swati',
    father: 'Haji Gul Mohammad',
    cnic: '15402-7654321-3',
    district: 'Swat',
    phone: '+968 9876 5432',
    whatsapp: '+968 9876 5432',
    address: 'Shop 5, Central Souq, Ruwi, Muscat',
    occupation: 'General Trading & Logistics',
    emergency: '+92 312 9876543',
    status: 'approved',
    membershipId: 'OPC-OMN-88422',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    feeAmount: 10,
    paymentMethod: 'Cash',
    email: 'usman.swat@opcoman.org',
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
    occupation: 'Senior IT Consultant',
    emergency: '+92 333 5554321',
    status: 'approved',
    membershipId: 'OPC-OMN-88423',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    feeAmount: 10,
    paymentMethod: 'Bank Transfer',
    email: 'ahmad.khattak@opcoman.org',
    cardColor: 'maroon'
  },
  {
    id: 'mem-104',
    name: 'Fazal Rabi Afridi',
    father: 'Malik Mir Zaman',
    cnic: '21201-4455667-9',
    district: 'Khyber',
    phone: '+968 9411 2233',
    whatsapp: '+968 9411 2233',
    address: 'Industrial Area, Sohar',
    occupation: 'Heavy Transport & Logistics',
    emergency: '+92 301 9988776',
    status: 'approved',
    membershipId: 'OPC-OMN-88424',
    createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
    feeAmount: 10,
    paymentMethod: 'Bank Transfer',
    email: 'fazal.afridi@opcoman.org',
    cardColor: 'emerald'
  },
  {
    id: 'mem-105',
    name: 'Zia-ur-Rahman Mohmand',
    father: 'Haji Noor Mohammad',
    cnic: '21402-8877665-1',
    district: 'Mohmand',
    phone: '+968 9322 4455',
    whatsapp: '+968 9322 4455',
    address: 'Sanaiya, Salalah, Dhofar',
    occupation: 'Automotive Specialist',
    emergency: '+92 345 1122334',
    status: 'approved',
    membershipId: 'OPC-OMN-88425',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    feeAmount: 10,
    paymentMethod: 'Cash',
    email: 'zia.mohmand@opcoman.org',
    cardColor: 'gold'
  },
  {
    id: 'mem-106',
    name: 'Habibullah Khan Achakzai',
    father: 'Sardar Abdul Baqi',
    cnic: '54401-2233445-7',
    district: 'Quetta',
    phone: '+968 9744 5566',
    whatsapp: '+968 9744 5566',
    address: 'Commercial District, Nizwa',
    occupation: 'Retail & Distribution',
    emergency: '+92 321 4455667',
    status: 'approved',
    membershipId: 'OPC-OMN-88426',
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    feeAmount: 10,
    paymentMethod: 'Bank Transfer',
    email: 'habib.achakzai@opcoman.org',
    cardColor: 'maroon'
  },
  {
    id: 'mem-107',
    name: 'Shahab Uddin Marwat',
    father: 'Mohammad Din',
    cnic: '11101-7788990-3',
    district: 'Lakki Marwat',
    phone: '+968 9655 7788',
    whatsapp: '+968 9655 7788',
    address: 'Near Fish Market, Sur',
    occupation: 'Marine Electrical Engineer',
    emergency: '+92 334 7788990',
    status: 'approved',
    membershipId: 'OPC-OMN-88427',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    feeAmount: 10,
    paymentMethod: 'Bank Transfer',
    email: 'shahab.marwat@opcoman.org',
    cardColor: 'blue'
  },
  {
    id: 'mem-108',
    name: 'Inam Ullah Khan Bangash',
    father: 'Mirza Khan',
    cnic: '14301-3344556-5',
    district: 'Kohat',
    phone: '+968 9811 4477',
    whatsapp: '+968 9811 4477',
    address: 'Barka Souq, Barka',
    occupation: 'Food & Restaurant Management',
    emergency: '+92 302 3344556',
    status: 'approved',
    membershipId: 'OPC-OMN-88428',
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    feeAmount: 10,
    paymentMethod: 'Cash',
    email: 'inam.bangash@opcoman.org',
    cardColor: 'emerald'
  }
];

export const DEFAULT_CABINET: CabinetMember[] = [
  {
    id: 'cab-1',
    name: 'Engr. Gul Zada Pukhtoon',
    position: 'Chairman',
    phone: '+968 9911 1870',
    email: 'chairman@opcoman.org',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'cab-2',
    name: 'Haji Fazal Mohammad Pukhtoon',
    position: 'Patron-in-Chief & Founder',
    phone: '+968 9911 1870',
    email: 'founder@opcoman.org',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'cab-3',
    name: 'Sahibzada Khan Yousafzai',
    position: 'Chairman Executive Council',
    phone: '+968 9922 3344',
    email: 'executive.council@opcoman.org',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'cab-4',
    name: 'Khan Mohammad Swati',
    position: 'President',
    phone: '+968 9933 4455',
    email: 'president@opcoman.org',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'cab-5',
    name: 'Mohammad Ali Shinwari',
    position: 'President Muscat Chapter',
    phone: '+968 9822 3344',
    email: 'muscat.chapter@opcoman.org',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'cab-6',
    name: 'Engineer Bilal Afridi',
    position: 'President Salalah & Dhofar Chapter',
    phone: '+968 9555 6677',
    email: 'salalah.chapter@opcoman.org',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'cab-7',
    name: 'Noor Rahman Khattak',
    position: 'General Secretary',
    phone: '+968 9944 5566',
    email: 'gensec@opcoman.org',
    photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'cab-8',
    name: 'Hazrat Shah Mohmand',
    position: 'Finance & Treasury Secretary',
    phone: '+968 9466 7788',
    email: 'finance@opcoman.org',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'cab-9',
    name: 'Dr. Tariq Khattak',
    position: 'Welfare & Medical Aid Secretary',
    phone: '+968 9644 5566',
    email: 'welfare@opcoman.org',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'cab-10',
    name: 'Said Umar Khan Buneri',
    position: 'Information & Media Secretary',
    phone: '+968 9955 6677',
    email: 'media@opcoman.org',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
  }
];

export const DEFAULT_ADS: SponsoredAd[] = [
  {
    id: 'ad-101',
    name: 'Al-Madina Express Cargo & Travel Muscat',
    phone: '+968 9911 1870',
    caption: 'Special cargo rates to Peshawar, Swat, Islamabad & all Pakistan airports with door-to-door delivery.',
    link: 'https://wa.me/96899111870',
    amount: 150,
    method: 'Bank Transfer',
    start: '2025-01-01',
    end: '2027-12-31',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString()
  },
  {
    id: 'ad-102',
    name: 'Khyber Heritage Traditional Restaurant Ruwi',
    phone: '+968 9922 3344',
    caption: 'Authentic Shinwari Karahi, Chapli Kabab, Kabuli Pulao & Family Dining in Central Ruwi, Muscat.',
    link: 'https://wa.me/96899111870',
    amount: 120,
    method: 'Cash',
    start: '2025-01-01',
    end: '2027-12-31',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString()
  },
  {
    id: 'ad-103',
    name: 'Pakhtoon Community 24/7 Welfare Emergency Helpline',
    phone: '+968 9911 1870',
    caption: 'Emergency Body Repatriation, Medical Assistance & Embassy Liaison for all brothers across the Sultanate.',
    link: 'https://wa.me/96899111870',
    amount: 200,
    method: 'Bank Transfer',
    start: '2025-01-01',
    end: '2027-12-31',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString()
  }
];

export const DEFAULT_NEWS: NewsAnnouncement[] = [
  {
    id: 'news-1',
    title: 'Oman Pakhtoon Community Annual Free Medical & Welfare Drive',
    content: 'The OPC Executive Cabinet in collaboration with leading healthcare centers in Muscat announces a comprehensive free medical screening, specialist consultation, and medicines distribution camp for community workers in Ruwi and Al Khuwair.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'news-2',
    title: 'Emergency Repatriation & Legal Assistance Desk Established',
    content: 'A dedicated 24/7 assistance team has been coordinated with the Embassy of Pakistan in Muscat to expedite documentation, passport renewals, and compassionate body repatriation support for distressed families across all regions.',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 'news-3',
    title: 'Pashto Cultural Gathering & National Day Celebrations in Muscat',
    content: 'Join thousands of diaspora members for an evening honoring cultural heritage, traditional music, Pashto poetry, and honoring community elders and social workers in the Sultanate of Oman.',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString()
  }
];

export const DEFAULT_ELECTIONS: Election[] = [
  {
    id: 'elec-2026',
    title: 'OPC Executive Cabinet Central Elections 2026',
    status: 'open',
    candidates: [
      { id: 'cand-1', name: 'Engr. Gul Zada Pukhtoon (Panel Ittihad)', votes: 1420 },
      { id: 'cand-2', name: 'Khan Mohammad Swati (Panel Khidmat)', votes: 1180 },
      { id: 'cand-3', name: 'Noor Rahman Khattak (Panel Welfare)', votes: 820 }
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
  quote: 'Uniting our diaspora brothers with dignity, supporting families in hardship, and serving our community with honor across the Sultanate of Oman.',
  bio1: 'Haji Fazal Mohammad founded the Oman Pakhtoon Community (OPC) in 2012 to establish a dedicated, transparent support network for overseas workers and families in Oman.',
  bio2: 'Over the past decade, OPC has mobilized hundreds of thousands of OMR in community relief, facilitated dignified repatriation for deceased brothers, provided legal representation, and organized cultural festivals.'
};

export const DEFAULT_DONATIONS: Donation[] = [
  {
    id: 'don-1',
    donor: 'Haji Fazal Mohammad & Partners',
    phone: '+968 9911 1870',
    amount: 15000,
    date: '2026-08-01',
    method: 'Bank Transfer',
    note: 'Annual Welfare Seed Endowment & Emergency Repatriation Fund',
    status: 'approved',
    receiptNumber: 'OPC-REC-2026-001',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString()
  },
  {
    id: 'don-2',
    donor: 'Al-Madina Logistics & Transport Group',
    phone: '+968 9876 5432',
    amount: 12500,
    date: '2026-08-05',
    method: 'Bank Transfer',
    note: 'Medical Assistance Pool for Hospitalized Workers in Nizwa & Sohar',
    status: 'approved',
    receiptNumber: 'OPC-REC-2026-002',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
  },
  {
    id: 'don-3',
    donor: 'Sohar & Barka Businessmen Delegation',
    phone: '+968 9411 2233',
    amount: 10200,
    date: '2026-08-10',
    method: 'Bank Transfer',
    note: 'Legal Relief & Labor Visa Status Regularization Fund',
    status: 'approved',
    receiptNumber: 'OPC-REC-2026-003',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'don-4',
    donor: 'Dhofar Salalah Community Chapter',
    phone: '+968 9555 6677',
    amount: 7500,
    date: '2026-08-12',
    method: 'Cash',
    note: 'Salalah Emergency Support & Family Repatriation Welfare',
    status: 'approved',
    receiptNumber: 'OPC-REC-2026-004',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  }
];

export const DEFAULT_INCIDENTS: IncidentReport[] = [
  {
    id: 'inc-1',
    type: 'death',
    name: 'Emergency Body Repatriation Assistance (Swat)',
    description: 'Deceased community member documentation, embassy clearance, and flight transport arrangements completed to Peshawar/Swat with full OPC funding.',
    date: '2026-08-02',
    contact: '+968 9911 1870',
    status: 'published',
    createdAt: new Date(Date.now() - 13 * 86400000).toISOString()
  },
  {
    id: 'inc-2',
    type: 'injury',
    name: 'Critical Medical & Surgical Relief in Khoula Hospital',
    description: 'Accident trauma patient medical bill settlement and daily family support provided in Muscat.',
    date: '2026-08-08',
    contact: '+968 9644 5566',
    status: 'published',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString()
  },
  {
    id: 'inc-3',
    type: 'loss',
    name: 'Passport & Labor Documentation Legal Camp (Sohar)',
    description: 'Embassy consular mobile unit assistance arranged for 45 community workers requiring urgent document renewal.',
    date: '2026-08-11',
    contact: '+968 9411 2233',
    status: 'published',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
  }
];

