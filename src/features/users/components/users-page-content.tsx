import { requireBusinessAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { UsersManager } from "@/features/users/components/users-manager";
import type { BusinessAgent } from "@/types/database.types";

export async function UsersPageContent() {
  const profile = await requireBusinessAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_agents")
    .select("*")
    .eq("business_id", profile.business_id!)
    .order("created_at", { ascending: false });

  return <UsersManager users={(data ?? []) as BusinessAgent[]} />;
}
