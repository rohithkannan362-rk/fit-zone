import { supabase } from "../lib/supabaseClient";
import { type Profile } from "../lib/supabase-types";

/**
 * Gets a member profile by their Supabase Auth UUID.
 */
export async function getMemberByUid(uid: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", uid)
    .single();

  if (error && error.code === "PGRST116") return null; // Not found
  if (error) throw error;
  return data;
}

/**
 * Gets a member by their member code (e.g., FZ000001).
 */
export async function getMemberByCode(code: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("member_code", code)
    .single();

  if (error && error.code === "PGRST116") return null;
  if (error) throw error;
  return data;
}

/**
 * Updates a member profile.
 * Does NOT allow updating role, member_code, or status from this function.
 */
export async function updateMember(
  memberId: string,
  data: Partial<Pick<Profile, "full_name" | "email" | "mobile">>,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", memberId);

  if (error) throw error;
}

/**
 * Searches members by name, mobile, member code, or email.
 * Uses PostgreSQL ilike for server-side filtering.
 */
export async function searchMembers(
  searchQuery: string,
  filters?: { status?: string },
  pageSize: number = 50,
  page: number = 0,
): Promise<{ members: Profile[]; total: number }> {
  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .eq("role", "member")
    .order("created_at", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (searchQuery) {
    const pattern = `%${searchQuery}%`;
    query = query.or(
      `full_name.ilike.${pattern},mobile.ilike.${pattern},member_code.ilike.${pattern},email.ilike.${pattern}`,
    );
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { members: data || [], total: count || 0 };
}

/**
 * Gets all members (for admin dashboard counts).
 */
export async function getAllMembers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "member")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Checks if a member with the given email already exists.
 */
export async function memberExistsByEmail(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email.toLowerCase())
    .limit(1);

  if (error) throw error;
  return (data?.length || 0) > 0;
}

/**
 * Checks if a member with the given mobile already exists.
 */
export async function memberExistsByMobile(mobile: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("mobile", mobile)
    .limit(1);

  if (error) throw error;
  return (data?.length || 0) > 0;
}

/**
 * Admin: update member status.
 */
export async function updateMemberStatus(
  memberId: string,
  status: string,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ status })
    .eq("id", memberId);

  if (error) throw error;
}
