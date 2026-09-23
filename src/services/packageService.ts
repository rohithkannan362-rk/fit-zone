import { supabase } from "../lib/supabaseClient";
import { type Package } from "../lib/supabase-types";

/**
 * Gets all active packages, sorted by price ascending.
 */
export async function getActivePackages(): Promise<Package[]> {
  const { data, error } = await supabase
    .from("packages")
    .select("*")
    .eq("active", true)
    .order("price", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Gets all packages (including inactive), for admin management.
 */
export async function getAllPackages(): Promise<Package[]> {
  const { data, error } = await supabase
    .from("packages")
    .select("*")
    .order("price", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Gets a single package by ID.
 */
export async function getPackageById(
  packageId: string,
): Promise<Package | null> {
  const { data, error } = await supabase
    .from("packages")
    .select("*")
    .eq("id", packageId)
    .single();

  if (error && error.code === "PGRST116") return null;
  if (error) throw error;
  return data;
}

/**
 * Creates a new package.
 */
export async function createPackage(data: {
  name: string;
  duration_months: number;
  free_months: number;
  total_months: number;
  price: number;
  features: string[];
  popular?: boolean;
  offer?: string | null;
}): Promise<string> {
  const { data: pkg, error } = await supabase
    .from("packages")
    .insert({
      name: data.name,
      duration_months: data.duration_months,
      free_months: data.free_months,
      total_months: data.total_months,
      price: data.price,
      features: data.features,
      popular: data.popular || false,
      offer: data.offer || null,
      active: true,
    })
    .select("id")
    .single();

  if (error) throw error;
  return pkg.id;
}

/**
 * Updates a package.
 */
export async function updatePackage(
  packageId: string,
  data: Partial<Omit<Package, "id" | "created_at" | "updated_at">>,
): Promise<void> {
  const { error } = await supabase
    .from("packages")
    .update(data)
    .eq("id", packageId);

  if (error) throw error;
}

/**
 * Deactivates a package (soft delete).
 */
export async function deactivatePackage(packageId: string): Promise<void> {
  const { error } = await supabase
    .from("packages")
    .update({ active: false })
    .eq("id", packageId);

  if (error) throw error;
}

/**
 * Seeds default packages if none exist.
 */
export async function seedDefaultPackages(): Promise<void> {
  const { data: existing, error: checkError } = await supabase
    .from("packages")
    .select("id")
    .limit(1);

  if (checkError) throw checkError;
  if (existing && existing.length > 0) return;

  const defaults = [
    {
      name: "1 Month",
      duration_months: 1,
      free_months: 0,
      total_months: 1,
      price: 1000,
      features: [
        "1 Month Membership",
        "Access to all facilities",
        "Guidance from trainers",
      ],
      popular: false,
      offer: null,
      active: true,
    },
    {
      name: "3 Months",
      duration_months: 3,
      free_months: 1,
      total_months: 4,
      price: 3000,
      features: [
        "4 Months Total Access",
        "Access to all facilities",
        "Priority trainer support",
      ],
      popular: false,
      offer: "Save ₹300",
      active: true,
    },
    {
      name: "6 Months",
      duration_months: 6,
      free_months: 4,
      total_months: 10,
      price: 7000,
      features: [
        "10 Months Total Access",
        "Access to all facilities",
        "Best value for results",
      ],
      popular: true,
      offer: "Save ₹1,000",
      active: true,
    },
    {
      name: "12 Months",
      duration_months: 12,
      free_months: 6,
      total_months: 18,
      price: 10000,
      features: [
        "18 Months Total Access",
        "Access to all facilities",
        "Maximum savings",
        "Long-term transformation",
      ],
      popular: false,
      offer: "Save ₹3,000",
      active: true,
    },
  ];

  const { error } = await supabase.from("packages").insert(defaults);
  if (error) throw error;
}
