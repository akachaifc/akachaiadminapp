
// User Roles
export enum UserRole {
  L1_ADMIN = 'L1_ADMIN', // Full Access
  L2_ADMIN = 'L2_ADMIN', // Finances + Dashboard
  L3_ADMIN = 'L3_ADMIN', // Social Media + Dashboard (Announcements)
  L4_ADMIN = 'L4_ADMIN', // Dashboard Only (Default)
}

export interface User {
  uid: string;
  email: string;
  username: string;
  role: UserRole;
  photoURL?: string;
  fullName?: string;
  phoneNumber?: string;
}

// Finance Types
export type TransactionType = 'INFLOW' | 'OUTFLOW';

export interface Transaction {
  id: string;
  amount: number;
  date: string; // ISO String
  category: string;
  description: string;
  type: TransactionType;
  createdBy: string;
}

// Jersey Types
export interface JerseyOrder {
  id: string;
  size: string;
  nameOnJersey: string;
  number: string;
  deliveryLocation: string;
  contactInfo: string;
  status: 'PENDING' | 'CONFIRMED';
  receiptNumber?: string;
  orderedBy: string;
  orderDate: string;
  amountCharged?: number; // Total cost
  balanceDue?: number;    // Remaining to pay
}

// Receipt Type
export interface Receipt {
  id: string;
  number: string;
  date: string;
  amount: number;
  description: string; // Purpose/Reason
  
  // Payer Details
  payerName: string; 
  payerEmail: string;
  payerPhone: string;
  payerRole: string;
  
  // Receiver Details
  receiverName: string;
  receiverRole: string;
  receiverPhone: string;
  receiverEmail: string;
  
  modeOfPayment: string;
  type: 'MANUAL' | 'JERSEY';
  generatedBy: string;
}

// Content Types
export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  isImportant: boolean;
  mediaUrl?: string;
  duration?: string; // e.g. "2 Hours"
}

export interface SocialStats {
  platform: string;
  followers: number;
  engagementRate: number;
  lastUpdated: string;
}

export interface SeasonStats {
  seasonName: string;
  startDate: string;
  played: number;
  total: number;
}
