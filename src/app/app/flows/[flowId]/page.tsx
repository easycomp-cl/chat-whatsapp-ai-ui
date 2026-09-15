import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { requireBusinessAdmin } from "@/lib/auth/session";
import { botApi } from "@/lib/bot-api/client";
import { FlowDetailPageContent } from "@/features/flows/components/flow-detail-page-content";
import { Button } from "@/components/ui/button";

export default async function FlowDetailPage({
  params,
}: {
  params: Promise<{ flowId: string }>;
}) {
  const { flowId } = await params;
  const profile = await requireBusinessAdmin();
  const businessId = profile.business_id!;

  try {
    const [flow, versions, webhookIntegration, deliveries] = await Promise.all([
      botApi.getFlow(businessId, flowId),
      botApi.listFlowVersions(businessId, flowId),
      botApi.getFlowWebhookIntegration(businessId),
      botApi.listFlowWebhookDeliveries(businessId, { limit: 50 }),
    ]);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" render={<Link href="/app/flows" />}>
            <ArrowLeft className="size-4" />
            Volver
          </Button>
        </div>
        <PageHeader title={flow.name} description="Versiones, simulador y webhooks" />
        <FlowDetailPageContent
          flow={flow}
          versions={versions}
          webhookIntegration={webhookIntegration}
          deliveries={deliveries}
        />
      </div>
    );
  } catch {
    notFound();
  }
}
