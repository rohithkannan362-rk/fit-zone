import { Timestamp } from 'firebase/firestore';

// ============================================
// MEMBER
// ============================================
export interface Member {
  id?: string;
  uid: string;
  memberCode: string;
  name: string;
  email: string;
  mobile: string;
  role: 'member' | 'admin';
  status: 'active' | 'inactive' | 'expired';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// PACKAGE
// ============================================
export interface Package {
  id?: string;
  name: string;
  durationMonths: number;
  price: number;
  active: boolean;
  features: string[];
  popular?: boolean;
  offer?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// MEMBERSHIP
// ============================================
export type MembershipStatus = 'active' | 'due_soon' | 'due_today' | 'overdue' | 'expired' | 'inactive';
export type ReminderStatus = 'active' | 'paused';

export interface Membership {
  id?: string;
  memberId: string;
  packageId: string;
  packageName: string;
  amount: number;
  startDate: Timestamp;
  endDate: Timestamp;
  nextDueDate: Timestamp;
  status: MembershipStatus;
  reminderStatus: ReminderStatus;
  reminderPausedUntil?: Timestamp | null;
  reminderPauseReason?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;
  updatedBy?: string;
}

// ============================================
// PAYMENT
// ============================================
export type PaymentStatus = 'created' | 'pending' | 'success' | 'failed' | 'refunded';
export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet' | 'cash' | 'other';

export interface Payment {
  id?: string;
  memberId: string;
  membershipId: string;
  amount: number;
  currency: string;
  packageId: string;
  packageName: string;
  provider: string;
  providerOrderId: string;
  providerPaymentId: string;
  providerReference?: string;
  status: PaymentStatus;
  method: PaymentMethod;
  paymentDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;
  updatedBy?: string;
}

// ============================================
// REMINDER
// ============================================
export type ReminderType = '2_days_before' | '1_day_before' | 'due_today' | '1_day_overdue' | '2_days_overdue' | '5_days_overdue' | '7_days_overdue';
export type ReminderChannel = 'email' | 'sms' | 'whatsapp';
export type ReminderDeliveryStatus = 'pending' | 'sent' | 'failed' | 'skipped';

export interface Reminder {
  id?: string;
  memberId: string;
  membershipId: string;
  type: ReminderType;
  channel: ReminderChannel;
  scheduledFor: Timestamp;
  sentAt?: Timestamp | null;
  status: ReminderDeliveryStatus;
  providerMessageId?: string;
  errorMessage?: string;
  createdAt: Timestamp;
}

// ============================================
// SETTINGS
// ============================================
export interface AppSettings {
  gymName: string;
  gymAddress: string;
  gymPhone: string;
  adminEmail: string;
  paymentGateway: 'razorpay' | 'cashfree';
  reminderSchedule: ReminderType[];
  currency: string;
}

// ============================================
// COUNTER (for member code auto-increment)
// ============================================
export interface Counter {
  currentValue: number;
}

// ============================================
// COLLECTION NAMES
// ============================================
export const COLLECTIONS = {
  MEMBERS: 'members',
  PACKAGES: 'packages',
  MEMBERSHIPS: 'memberships',
  PAYMENTS: 'payments',
  REMINDERS: 'reminders',
  SETTINGS: 'settings',
  COUNTERS: 'counters',
} as const;
