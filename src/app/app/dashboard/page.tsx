import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardContentSkeleton } from "@/components/layout/page-skeletons";
import { DashboardPageContent } from "@/features/dashboard/components/dashboard-page-content";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Resumen del bot y métricas de tu negocio"
      />
      <Suspense fallback={<DashboardContentSkeleton />}>
        <DashboardPageContent />
      </Suspense>
    </div>
  );
}
