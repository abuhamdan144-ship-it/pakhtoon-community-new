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
  feeAmount?: number;
  paymentMethod?: string;
  paymentReference?: string;
  receiptNumber?: string;
  isDispatched?: boolean;
  dispatchedAt?: any; // Firestore Timestamp
  driveAttachments?: { id: string; name: string; url: string; mimeType?: string; }[];
  email?: string;
  cardColor?: string;
}

export interface Donation {
  id?: string;
  donor: string;
  phone: string;
  amount: number;
  date: string;
  method: 'Bank Transfer' | 'Cash' | 'Mobile Wallet';
  note?: string;
  status: 'pending' | 'approved' | 'rejected';
  receiptNumber?: string;
  createdAt: any;
  approvedAt?: any;
  approvedBy?: any;
}

export interface CabinetMember {
  id?: string;
  name: string;
  position: string;
  phone?: string;
  email?: string;
  photo?: string;
}

export interface CabinetMeeting {
  id?: string;
  agenda: string;
  description: string;
  status: 'scheduled' | 'active' | 'completed';
  votes?: { [email: string]: 'Approve' | 'Reject' | 'Abstain' };
  createdAt: any;
  completedAt?: any;
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
  driveAttachments?: { id: string; name: string; url: string; mimeType?: string; }[];
}

export interface EmbassySetting {
  address?: string;
  phone?: string;
  emergency?: string;
  email?: string;
  hours?: string;
  website?: string;
}

export interface FounderProfile {
  name?: string;
  position?: string;
  phone?: string;
  email?: string;
  address?: string;
  est?: string;
  photo?: string; // base64 URL or custom uploaded photo
  quote?: string;
  bio1?: string;
  bio2?: string;
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
  endDate?: string;
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
  video?: string; // base64 video URL or video file string
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

export interface AdminLog {
  id?: string;
  adminEmail: string;
  action: string;
  details: string;
  createdAt: any; // Firestore Timestamp or Date
}

