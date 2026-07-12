import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { AgentsContentSkeleton } from "@/components/layout/page-skeletons";
import { AgentsPageContent } from "@/features/agents/components/agents-page-content";

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Agentes"
        description="Personas que reciben notificaciones de derivación"
      />
      <Suspense fallback={<AgentsContentSkeleton />}>
        <AgentsPageContent />
      </Suspense>
    </div>
  );
}
