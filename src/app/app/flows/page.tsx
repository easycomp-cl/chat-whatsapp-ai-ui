import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { FlowsPageContent } from "@/features/flows/components/flows-page-content";

export default function FlowsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Flujos"
        description="Automatiza respuestas y acciones del bot según condiciones y eventos"
      />
      <Suspense fallback={<p className="text-muted-foreground">Cargando flujos...</p>}>
        <FlowsPageContent />
      </Suspense>
    </div>
  );
}
