import { requireSuperAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { MetricCard } from "@/features/dashboard/components/metric-card";

export default async function AdminUsagePage() {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { count: businessCount } = await supabase
    .from("businesses")
    .select("*", { count: "exact", head: true });

  const { count: eventCount } = await supabase
    .from("usage_events")
    .select("*", { count: "exact", head: true });

  const { data: costData } = await supabase
    .from("usage_events")
    .select("estimated_cost");

  const totalCost = (costData ?? []).reduce(
    (sum, e) => sum + (e.estimated_cost ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Uso global</h2>
        <p className="text-muted-foreground">Métricas agregadas de todos los negocios</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Negocios" value={businessCount ?? 0} accent="blue" />
        <MetricCard title="Eventos de uso" value={eventCount ?? 0} accent="green" />
        <MetricCard title="Costo IA total" value={`$${totalCost.toFixed(2)}`} accent="blue" />
      </div>
    </div>
  );
}
