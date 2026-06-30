import { requireAppAccess } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { botApi } from "@/lib/bot-api/client";
import { BotStatusCard } from "@/features/dashboard/components/bot-status-card";
import { MetricCard } from "@/features/dashboard/components/metric-card";
import { ActivityChart } from "@/features/dashboard/components/activity-chart";
import { TopQuestionsTable } from "@/features/dashboard/components/top-questions-table";
import { canToggleBot } from "@/lib/rbac";
import type { Business, MetricsSummary, TopQuestion } from "@/types/database.types";
import { startOfMonth } from "date-fns";

async function getBusiness(businessId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single();
  return data as Business | null;
}

async function getMetricsSafe(businessId: string) {
  const supabase = await createClient();
  try {
    const from = startOfMonth(new Date()).toISOString();
    const summary = (await botApi.getMetricsSummary(businessId, from)) as MetricsSummary;
    const questionsRes = (await botApi.getMetricsQuestions(businessId, {
      from,
      limit: 10,
    })) as { top_questions: TopQuestion[] };
    const usage = (await botApi.getMetricsUsage(businessId, from)) as Array<{
      eventType: string;
      createdAt: string;
    }>;

    const dailyMap = new Map<string, { messages: number; ai_responses: number; handoffs: number }>();
    for (const event of usage) {
      const date = new Date(event.createdAt).toISOString().slice(0, 10);
      const entry = dailyMap.get(date) ?? { messages: 0, ai_responses: 0, handoffs: 0 };
      if (event.eventType.includes("MESSAGE_RECEIVED")) entry.messages += 1;
      if (event.eventType.includes("AI_RESPONSE")) entry.ai_responses += 1;
      if (event.eventType.includes("HUMAN_HANDOFF")) entry.handoffs += 1;
      dailyMap.set(date, entry);
    }
    const daily = [...dailyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({ date, ...stats }));

    const conversationsRes = await supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .gte("created_at", from);

    return {
      summary: {
        ...summary,
        conversations_count: conversationsRes.count ?? 0,
      },
      questions: (questionsRes.top_questions ?? []).map((q) => ({
        ...q,
        answered_by: "IA",
      })),
      daily,
    };
  } catch {
    return {
      summary: {
        conversations_count: 0,
        total_messages_received: 0,
        total_ai_responses: 0,
        total_faq_responses: 0,
        total_rag_responses: 0,
        total_human_handoffs: 0,
        estimated_hours_saved: 0,
        estimated_ai_cost: 0,
      },
      questions: [] as TopQuestion[],
      daily: [] as Array<{ date: string; messages: number; ai_responses: number; handoffs: number }>,
    };
  }
}

export default async function DashboardPage() {
  const profile = await requireAppAccess();
  const businessId = profile.business_id!;
  const business = await getBusiness(businessId);
  const { summary, questions, daily } = await getMetricsSafe(businessId);

  const chartData = daily.map((d) => ({
    date: new Date(d.date).toLocaleDateString("es-CL", { day: "2-digit", month: "short" }),
    messages: d.messages,
    ai_responses: d.ai_responses,
    handoffs: d.handoffs,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Resumen del bot y métricas de tu negocio
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <BotStatusCard
          enabled={business?.bot_global_enabled ?? false}
          updatedAt={business?.updated_at ?? new Date().toISOString()}
          canToggle={canToggleBot(profile.role)}
        />
        <MetricCard
          title="Conversaciones del mes"
          value={summary.conversations_count ?? 0}
          accent="blue"
        />
        <MetricCard
          title="Mensajes recibidos"
          value={summary.total_messages_received}
          accent="blue"
        />
        <MetricCard
          title="Respuestas IA"
          value={summary.total_ai_responses}
          accent="green"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Derivaciones humanas"
          value={summary.total_human_handoffs}
          accent="yellow"
        />
        <MetricCard
          title="Horas ahorradas"
          value={summary.estimated_hours_saved.toFixed(1)}
          accent="green"
        />
        <MetricCard
          title="Costo IA estimado"
          value={`$${summary.estimated_ai_cost.toFixed(2)}`}
          accent="blue"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ActivityChart data={chartData} />
      </div>

      <TopQuestionsTable questions={questions} />
    </div>
  );
}
