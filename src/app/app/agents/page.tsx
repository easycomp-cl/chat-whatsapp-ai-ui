import { requireBusinessAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AgentsManager } from "@/features/agents/components/agents-manager";
import type { BusinessAgent } from "@/types/database.types";

export default async function AgentsPage() {
  const profile = await requireBusinessAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_agents")
    .select("*")
    .eq("business_id", profile.business_id!)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Agentes</h2>
        <p className="text-muted-foreground">Personas que reciben notificaciones de derivación</p>
      </div>
      <AgentsManager agents={(data ?? []) as BusinessAgent[]} />
    </div>
  );
}
