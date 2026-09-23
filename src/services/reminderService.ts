import { supabase } from "../lib/supabaseClient";
import { type Reminder } from "../lib/supabase-types";

/**
 * Gets all reminders for a specific member.
 */
export async function getMemberReminders(
  memberId: string,
): Promise<Reminder[]> {
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("member_id", memberId)
    .order("scheduled_for", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Gets all reminders for a specific membership (billing cycle).
 */
export async function getMembershipReminders(
  membershipId: string,
): Promise<Reminder[]> {
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("membership_id", membershipId)
    .order("scheduled_for", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Gets all reminders by status (for admin inspection).
 */
export async function getRemindersByStatus(
  status: string,
): Promise<Reminder[]> {
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("status", status)
    .order("scheduled_for", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Gets all reminders (admin overview).
 */
export async function getAllReminders(): Promise<Reminder[]> {
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}
