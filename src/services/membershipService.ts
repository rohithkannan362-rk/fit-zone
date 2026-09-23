import { supabase } from "../lib/supabaseClient";
import { type Membership, type MembershipStatus } from "../lib/supabase-types";
import { calculateEndDate, calculateNextDueDate } from "../utils/dateUtils";

/**
 * Creates a new membership for a member (one billing cycle).
 */
export async function createMembership(data: {
  memberId: string;
  packageId: string;
  packageName: string;
  amount: number;
  startDate?: Date;
  durationMonths: number;
  createdBy?: string;
}): Promise<string> {
  const start = data.startDate || new Date();
  const endDate = calculateEndDate(start, data.durationMonths);
  const nextDueDate = calculateNextDueDate(endDate);

  const { data: membership, error } = await supabase
    .from("memberships")
    .insert({
      member_id: data.memberId,
      package_id: data.packageId,
      package_name: data.packageName,
      amount: data.amount,
      start_date: start.toISOString(),
      end_date: endDate.toISOString(),
      next_due_date: nextDueDate.toISOString(),
      status: "active",
      reminder_status: "active",
      created_by: data.createdBy || null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return membership.id;
}

/**
 * Gets the currently effective membership for a member.
 * Returns the membership whose start_date <= now AND end_date >= now.
 * Returns null if no membership is currently in effect.
 * Does NOT return upcoming (future) memberships.
 */
export async function getCurrentMembership(
  memberId: string,
): Promise<Membership | null> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .eq("member_id", memberId)
    .lte("start_date", now)
    .gte("end_date", now)
    .in("status", ["active", "due_soon", "due_today", "overdue"])
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Gets an upcoming (future) membership if one exists.
 * Returns a membership whose start_date is after now.
 * Returns null if no upcoming membership exists.
 */
export async function getUpcomingMembership(
  memberId: string,
): Promise<Membership | null> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .eq("member_id", memberId)
    .gt("start_date", now)
    .eq("status", "active")
    .order("start_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Gets all memberships for a member, ordered by creation date.
 */
export async function getMembershipHistory(
  memberId: string,
): Promise<Membership[]> {
  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Updates a membership.
 */
export async function updateMembership(
  membershipId: string,
  updates: Partial<Omit<Membership, "id" | "created_at">>,
): Promise<void> {
  const { error } = await supabase
    .from("memberships")
    .update(updates)
    .eq("id", membershipId);

  if (error) throw error;
}

/**
 * Activates a membership after successful payment.
 */
export async function activateMembership(membershipId: string): Promise<void> {
  await updateMembership(membershipId, {
    status: "active",
    reminder_status: "active",
  });
}

/**
 * Renews a membership: creates a new billing cycle.
 */
export async function renewMembership(data: {
  memberId: string;
  packageId: string;
  packageName: string;
  amount: number;
  durationMonths: number;
  previousMembershipId?: string;
  createdBy?: string;
}): Promise<string> {
  // Close the previous membership if provided
  if (data.previousMembershipId) {
    await updateMembership(data.previousMembershipId, { status: "expired" });
  }

  // Determine start date
  let startDate = new Date();
  if (data.previousMembershipId) {
    const prev = await getMembershipById(data.previousMembershipId);
    if (prev) {
      const prevEnd = new Date(prev.end_date);
      const today = new Date();
      if (prevEnd > today) {
        startDate = new Date(prevEnd);
        startDate.setDate(startDate.getDate() + 1);
      }
    }
  }

  return createMembership({
    memberId: data.memberId,
    packageId: data.packageId,
    packageName: data.packageName,
    amount: data.amount,
    startDate,
    durationMonths: data.durationMonths,
    createdBy: data.createdBy,
  });
}

/**
 * Gets a membership by its ID.
 */
export async function getMembershipById(
  membershipId: string,
): Promise<Membership | null> {
  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .eq("id", membershipId)
    .single();

  if (error && error.code === "PGRST116") return null;
  if (error) throw error;
  return data;
}

/**
 * Pauses reminders for a membership.
 */
export async function pauseReminders(
  membershipId: string,
  pauseUntil: Date,
  reason?: string,
): Promise<void> {
  await updateMembership(membershipId, {
    reminder_status: "paused",
    reminder_paused_until: pauseUntil.toISOString(),
    reminder_pause_reason: reason || "Admin paused",
  });
}

/**
 * Resumes reminders for a membership.
 */
export async function resumeReminders(membershipId: string): Promise<void> {
  await updateMembership(membershipId, {
    reminder_status: "active",
    reminder_paused_until: null,
    reminder_pause_reason: null,
  });
}

/**
 * Gets all active memberships (for admin dashboard).
 */
export async function getAllActiveMemberships(): Promise<Membership[]> {
  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .in("status", ["active", "due_soon", "due_today", "overdue"])
    .order("next_due_date", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Gets all memberships (for admin reports).
 */
export async function getAllMemberships(): Promise<Membership[]> {
  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Gets memberships by status filter.
 */
export async function getMembershipsByStatus(
  status: MembershipStatus,
): Promise<Membership[]> {
  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .eq("status", status)
    .order("next_due_date", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Gets memberships with paused reminders.
 */
export async function getPausedMemberships(): Promise<Membership[]> {
  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .eq("reminder_status", "paused")
    .order("reminder_paused_until", { ascending: true });

  if (error) throw error;
  return data || [];
}
