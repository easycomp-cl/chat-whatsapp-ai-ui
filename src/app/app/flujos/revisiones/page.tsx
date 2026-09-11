import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { requireBusinessAdmin } from "@/lib/auth/session";
import { botApi } from "@/lib/bot-api/client";
import { FlowReviewsInbox } from "@/features/flows/components/flow-reviews-inbox";
import { Button } from "@/components/ui/button";

async function ReviewsContent() {
  const profile = await requireBusinessAdmin();
  const reviews = await botApi.listFlowReviews(profile.business_id!, "PENDING");
  return <FlowReviewsInbox reviews={reviews} />;
}

export default function FlowReviewsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" render={<Link href="/app/flujos" />}>
          <ArrowLeft className="size-4" />
          Volver a flujos
        </Button>
      </div>
      <PageHeader
        title="Revisiones pendientes"
        description="Aprueba o rechaza archivos y datos enviados por clientes durante un flujo"
      />
      <Suspense fallback={<p className="text-muted-foreground">Cargando revisiones...</p>}>
        <ReviewsContent />
      </Suspense>
    </div>
  );
}
