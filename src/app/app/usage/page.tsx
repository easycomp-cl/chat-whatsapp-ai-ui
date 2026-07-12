import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { UsageContentSkeleton } from "@/components/layout/page-skeletons";
import { UsagePageContent } from "@/features/usage/components/usage-page-content";

export default function UsagePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Uso del plan"
        description="Consumo mensual de tu plan"
      />
      <Suspense fallback={<UsageContentSkeleton />}>
        <UsagePageContent />
      </Suspense>
    </div>
  );
}
