export interface Member {
  id?: string;
  name: string;
  father: string;
  cnic: string;
  district: string;
  phone: string;
  whatsapp?: string;
  address: string;
  occupation?: string;
  emergency?: string;
  photo?: string; // base64 URL
  status: 'pending' | 'approved' | 'rejected';
  membershipId?: string;
  createdAt: any; // Firestore Timestamp
  approvedAt?: any; // Firestore Timestamp
}

export interface Donation {
  id?: string;
  donor: string;
  amount: number;
  date: string;
  method: 'Bank Transfer' | 'Cash' | 'Mobile Wallet';
  note?: string;
  createdAt: any;
}

export interface CabinetMember {
  id?: string;
  name: string;
  position: string;
  phone?: string;
  photo?: string;
}

export interface NewsAnnouncement {
  id?: string;
  title: string;
  content: string;
  image?: string;
  createdAt: any;
}

export interface IncidentReport {
  id?: string;
  type: 'death' | 'injury' | 'loss';
  name: string;
  description: string;
  date: string;
  contact: string;
  status: 'pending' | 'published' | 'closed';
  createdAt: any;
}

export interface EmbassySetting {
  address?: string;
  phone?: string;
  emergency?: string;
  email?: string;
  hours?: string;
  website?: string;
}

export interface Candidate {
  id: string;
  name: string;
  votes: number;
}

export interface Election {
  id?: string;
  title: string;
  status: 'open' | 'closed';
  candidates: Candidate[];
  createdAt: any;
}

export interface SponsoredAd {
  id?: string;
  name: string;
  phone?: string;
  caption?: string;
  link: string;
  amount: number;
  method: string;
  start: string;
  end: string;
  image: string; // base64 URL
  createdAt: any;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
