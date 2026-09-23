import { supabase } from "../lib/supabaseClient";
import { type Payment, type PaymentStatus } from "../lib/supabase-types";

// ============================================
// RPC WRAPPERS — Manual UPI Payment Flow
// ============================================

/**
 * Checkout step 1: Creates a pending payment via the server-side RPC.
 * Returns authoritative package/payment info from the database.
 * If a pending/submitted checkout already exists for this user+package,
 * the RPC returns it instead of creating a duplicate.
 */
export interface CheckoutResult {
  payment_id: string;
  amount: number;
  package_name: string;
  paid_months: number;
  free_months: number;
  total_months: number;
  existing: boolean;
}

export async function createPendingCheckout(
  packageId: string,
): Promise<CheckoutResult> {
  const { data, error } = await supabase.rpc("create_pending_checkout", {
    p_package_id: packageId,
  });

  if (error) throw error;
  return data as CheckoutResult;
}

/**
 * Checkout step 2: Member submits UPI transaction proof.
 * Transitions payment from 'pending' → 'submitted'.
 */
export async function submitPaymentProof(
  paymentId: string,
  upiTransactionId: string,
  paymentDate: Date,
): Promise<void> {
  const { error } = await supabase.rpc("submit_payment", {
    p_payment_id: paymentId,
    p_upi_transaction_id: upiTransactionId,
    p_payment_date: paymentDate.toISOString(),
  });

  if (error) throw error;
}

/**
 * Admin: Verify a submitted payment.
 * Transitions payment from 'submitted' → 'verified' and creates membership.
 */
export async function verifyPayment(paymentId: string): Promise<void> {
  const { error } = await supabase.rpc("verify_payment", {
    p_payment_id: paymentId,
  });

  if (error) throw error;
}

/**
 * Admin: Reject a submitted payment with a reason.
 * Transitions payment from 'submitted' → 'rejected'.
 */
export async function rejectPayment(
  paymentId: string,
  reason: string,
): Promise<void> {
  const { error } = await supabase.rpc("reject_payment", {
    p_payment_id: paymentId,
    p_reason: reason,
  });

  if (error) throw error;
}

// ============================================
// LEGACY FUNCTIONS — Kept for admin manual payments
// ============================================

/**
 * Creates a manual payment record (for admin cash/offline payments).
 */
export async function createManualPayment(data: {
  memberId: string;
  amount: number;
  packageId: string;
  packageName: string;
  method: string;
  reference?: string;
  paymentDate?: Date;
  createdBy?: string;
}): Promise<string> {
  const paymentDate = data.paymentDate || new Date();

  // 1. Fetch package duration
  const { data: pkg, error: pkgError } = await supabase
    .from("packages")
    .select("duration_months, total_months")
    .eq("id", data.packageId)
    .single();

  if (pkgError) throw pkgError;

  // 2. Determine start date
  const { data: activeMembership } = await supabase
    .from("memberships")
    .select("id, end_date")
    .eq("member_id", data.memberId)
    .in("status", ["active", "paused"])
    .order("end_date", { ascending: false })
    .limit(1)
    .single();

  let startDate = new Date();
  if (activeMembership && new Date(activeMembership.end_date) > startDate) {
    startDate = new Date(activeMembership.end_date);
    startDate.setDate(startDate.getDate() + 1);
  }

  // 3. Determine end date using total_months
  const totalMonths = pkg.total_months || pkg.duration_months;
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + totalMonths);

  const nextDueDate = new Date(endDate);
  nextDueDate.setDate(nextDueDate.getDate() + 1);

  // 4. Create Membership
  const { data: membership, error: memError } = await supabase
    .from("memberships")
    .insert({
      member_id: data.memberId,
      package_id: data.packageId,
      package_name: data.packageName,
      amount: data.amount,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      next_due_date: nextDueDate.toISOString(),
      status: "active",
      reminder_status: "active",
    })
    .select("id")
    .single();

  if (memError) throw memError;

  // 5. Create Payment
  const { data: payment, error } = await supabase
    .from("payments")
    .insert({
      member_id: data.memberId,
      membership_id: membership.id,
      amount: data.amount,
      currency: "INR",
      package_id: data.packageId,
      package_name: data.packageName,
      provider: "manual",
      provider_order_id: `manual_${Date.now()}`,
      provider_payment_id: data.reference || `manual_${Date.now()}`,
      provider_reference: data.reference || null,
      status: "verified",
      method: data.method,
      payment_date: paymentDate.toISOString(),
      created_by: data.createdBy || null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return payment.id;
}

// ============================================
// READ OPERATIONS
// ============================================

/**
 * Gets a payment by its ID.
 */
export async function getPaymentById(
  paymentId: string,
): Promise<Payment | null> {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Gets payment history for a specific member.
 */
export async function getMemberPayments(memberId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Gets all payments (for admin).
 */
export async function getAllPayments(filters?: {
  status?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
}): Promise<Payment[]> {
  let query = supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.startDate) {
    query = query.gte("created_at", filters.startDate.toISOString());
  }

  if (filters?.endDate) {
    query = query.lte("created_at", filters.endDate.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Gets total revenue for verified payments.
 */
export async function getTotalRevenue(period?: {
  startDate: Date;
  endDate: Date;
}): Promise<number> {
  let query = supabase
    .from("payments")
    .select("amount")
    .eq("status", "verified");

  if (period) {
    query = query
      .gte("created_at", period.startDate.toISOString())
      .lte("created_at", period.endDate.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).reduce((sum, p) => sum + Number(p.amount), 0);
}

/**
 * Gets payments for the current month.
 */
export async function getMonthlyPayments(): Promise<Payment[]> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
  );

  return getAllPayments({
    status: "verified",
    startDate: startOfMonth,
    endDate: endOfMonth,
  });
}
