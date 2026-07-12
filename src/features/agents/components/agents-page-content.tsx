import { requireBusinessAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AgentsManager } from "@/features/agents/components/agents-manager";
import type { BusinessAgent } from "@/types/database.types";

export async function AgentsPageContent() {
  const profile = await requireBusinessAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_agents")
    .select("*")
    .eq("business_id", profile.business_id!)
    .order("created_at", { ascending: false });

  return <AgentsManager agents={(data ?? []) as BusinessAgent[]} />;
}
