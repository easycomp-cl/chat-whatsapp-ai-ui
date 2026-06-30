import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/database.types";
import { redirect } from "next/navigation";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return data as Profile | null;
}

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireProfile() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (!profile.active) redirect("/login?error=inactive");
  return profile;
}

export async function requireBusinessAdmin() {
  const profile = await requireProfile();
  if (profile.role === "AGENT") redirect("/app/conversations");
  if (profile.role === "SUPER_ADMIN") redirect("/admin/businesses");
  if (!profile.business_id) redirect("/login?error=no_business");
  return profile;
}

export async function requireSuperAdmin() {
  const profile = await requireProfile();
  if (profile.role !== "SUPER_ADMIN") redirect("/app/dashboard");
  return profile;
}

export async function requireAppAccess() {
  const profile = await requireProfile();
  if (profile.role === "SUPER_ADMIN") redirect("/admin/businesses");
  if (!profile.business_id) redirect("/login?error=no_business");
  return profile;
}

export function hasRole(profile: Profile, roles: UserRole[]) {
  return roles.includes(profile.role);
}
