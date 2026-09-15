import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DespachosContentSkeleton } from "@/components/layout/page-skeletons";
import { DespachosPageContent } from "@/features/despachos/components/despachos-page-content";

export default function DeliveriesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Despachos"
        description="Tarifas, couriers y cobertura por región y comuna para el bot de WhatsApp"
      />
      <Suspense fallback={<DespachosContentSkeleton />}>
        <DespachosPageContent />
      </Suspense>
    </div>
  );
}
