import { requireBusinessAdmin } from "@/lib/auth/session";
import { getBusinessById } from "@/lib/business/get-business";
import { createClient } from "@/lib/supabase/server";
import { botApi } from "@/lib/bot-api/client";
import { MetricCard } from "@/features/dashboard/components/metric-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MetricsSummary } from "@/types/database.types";
import { startOfMonth } from "date-fns";
import { formatDateOnly, getDateKeyInAppTimezone } from "@/lib/format-datetime";

export async function UsagePageContent() {
  const profile = await requireBusinessAdmin();
  const businessId = profile.business_id!;
  const from = startOfMonth(new Date()).toISOString();

  const [business, summaryResult, eventsResult] = await Promise.all([
    getBusinessById(businessId),
    botApi
      .getMetricsSummary(businessId, from)
      .then((data) => data as MetricsSummary)
      .catch(
        (): MetricsSummary => ({
          total_messages_received: 0,
          total_ai_responses: 0,
          total_faq_responses: 0,
          total_rag_responses: 0,
          total_human_handoffs: 0,
          estimated_hours_saved: 0,
          estimated_ai_cost: 0,
        })
      ),
    (async () => {
      const supabase = await createClient();
      return supabase
        .from("usage_events")
        .select("*")
        .eq("business_id", businessId)
        .gte("created_at", from)
        .order("created_at", { ascending: false })
        .limit(100);
    })(),
  ]);

  const planLimit =
    (business?.metadata_json as { plan_limit?: number } | null)?.plan_limit ?? 1000;
  const summary = summaryResult;
  const events = eventsResult.data;

  const dailyMap = new Map<string, { messages: number; ai: number; cost: number }>();
  for (const e of events ?? []) {
    const date = getDateKeyInAppTimezone(e.created_at);
    const entry = dailyMap.get(date) ?? { messages: 0, ai: 0, cost: 0 };
    if (e.event_type.includes("MESSAGE")) entry.messages += 1;
    if (e.event_type.includes("AI_RESPONSE")) entry.ai += 1;
    entry.cost += e.estimated_cost ?? 0;
    dailyMap.set(date, entry);
  }

  const used = summary.total_messages_received;
  const pct = planLimit > 0 ? Math.min(100, (used / planLimit) * 100) : 0;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Mensajes usados" value={used} accent="blue" />
        <MetricCard title="Respuestas IA" value={summary.total_ai_responses} accent="green" />
        <MetricCard title="Derivaciones" value={summary.total_human_handoffs} accent="yellow" />
        <MetricCard
          title="Costo IA estimado"
          value={`$${summary.estimated_ai_cost.toFixed(2)}`}
          accent="blue"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard title="Límite del plan" value={planLimit} />
        <MetricCard
          title="Porcentaje usado"
          value={`${pct.toFixed(1)}%`}
          accent={pct > 80 ? "red" : "blue"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uso diario</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Día</TableHead>
                <TableHead>Mensajes</TableHead>
                <TableHead>Respuestas IA</TableHead>
                <TableHead>Costo estimado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...dailyMap.entries()].map(([date, stats]) => (
                <TableRow key={date}>
                  <TableCell>{formatDateOnly(date)}</TableCell>
                  <TableCell>{stats.messages}</TableCell>
                  <TableCell>{stats.ai}</TableCell>
                  <TableCell>${stats.cost.toFixed(4)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
