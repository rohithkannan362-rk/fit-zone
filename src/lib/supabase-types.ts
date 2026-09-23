// ============================================
// SUPABASE DATABASE TYPES
// ============================================
// These types map directly to the PostgreSQL schema
// defined in supabase/migrations/20260923000000_initial_schema.sql

// ============================================
// PROFILE
// ============================================
export interface Profile {
  id: string;
  member_code: string;
  full_name: string;
  email: string;
  mobile: string;
  role: "member" | "admin";
  status: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// PACKAGE
// ============================================
export interface Package {
  id: string;
  name: string;
  duration_months: number;
  free_months: number;
  total_months: number;
  price: number;
  active: boolean;
  features: string[];
  popular: boolean;
  offer: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// MEMBERSHIP
// ============================================
export type MembershipStatus =
  "pending" | "active" | "due_soon" | "due_today" | "overdue" | "expired";
export type ReminderStatus = "active" | "paused";

export interface Membership {
  id: string;
  member_id: string;
  package_id: string;
  package_name: string;
  amount: number;
  start_date: string;
  end_date: string;
  next_due_date: string;
  status: MembershipStatus;
  reminder_status: ReminderStatus;
  reminder_paused_until: string | null;
  reminder_pause_reason: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// PAYMENT
// ============================================
export type PaymentStatus =
  "pending" | "submitted" | "verified" | "rejected";
export type PaymentMethod =
  "upi" | "card" | "netbanking" | "wallet" | "cash" | "other";

export interface Payment {
  id: string;
  member_id: string;
  membership_id: string | null;
  package_id: string;
  amount: number;
  currency: string;
  package_name: string;
  provider: string;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  provider_reference: string | null;
  rejection_reason: string | null;
  status: PaymentStatus;
  method: PaymentMethod;
  payment_date: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// REMINDER
// ============================================
export type ReminderType =
  | "2_days_before"
  | "1_day_before"
  | "due_today"
  | "1_day_overdue"
  | "2_days_overdue"
  | "5_days_overdue"
  | "7_days_overdue";

export type ReminderChannel = "email" | "sms" | "whatsapp";
export type ReminderDeliveryStatus = "pending" | "sent" | "failed" | "skipped";

export interface Reminder {
  id: string;
  member_id: string;
  membership_id: string;
  reminder_type: ReminderType;
  scheduled_for: string;
  sent_at: string | null;
  status: ReminderDeliveryStatus;
  channel: ReminderChannel;
  provider_message_id: string | null;
  error_message: string | null;
  created_at: string;
}

// ============================================
// SETTINGS
// ============================================
export interface AppSettings {
  id: string;
  gym_name: string;
  gym_address: string | null;
  gym_phone: string | null;
  admin_email: string | null;
  currency: string;
  payment_gateway: string;
  reminder_schedule: string[];
  created_at: string;
  updated_at: string;
}
