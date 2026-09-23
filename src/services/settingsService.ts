import { supabase } from "../lib/supabaseClient";
import { type AppSettings } from "../lib/supabase-types";

/**
 * Loads the application settings.
 * Returns defaults if no settings row exists.
 */
export async function getSettings(): Promise<AppSettings> {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .limit(1)
    .single();

  if (error && error.code === "PGRST116") {
    // No settings row exists — return sensible defaults
    return {
      id: "",
      gym_name: "FIT ZONE",
      gym_address: "FIT ZONE GYM & FITNESS",
      gym_phone: "",
      admin_email: "",
      currency: "INR",
      payment_gateway: "manual_upi",
      reminder_schedule: [
        "2_days_before",
        "1_day_before",
        "due_today",
        "1_day_overdue",
        "2_days_overdue",
        "5_days_overdue",
        "7_days_overdue",
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  if (error) throw error;
  return data;
}

/**
 * Saves application settings.
 * Creates if no row exists, otherwise updates the existing row.
 */
export async function saveSettings(
  settings: Partial<Omit<AppSettings, "id" | "created_at" | "updated_at">>,
): Promise<void> {
  // Check if settings row exists
  const { data: existing, error: checkError } = await supabase
    .from("settings")
    .select("id")
    .limit(1)
    .single();

  if (checkError && checkError.code !== "PGRST116") throw checkError;

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from("settings")
      .update(settings)
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    // Insert new
    const { error } = await supabase.from("settings").insert({
      gym_name: settings.gym_name || "FIT ZONE",
      gym_address: settings.gym_address || null,
      gym_phone: settings.gym_phone || null,
      admin_email: settings.admin_email || null,
      currency: settings.currency || "INR",
      payment_gateway: settings.payment_gateway || "manual_upi",
      reminder_schedule: settings.reminder_schedule || [],
    });
    if (error) throw error;
  }
}
