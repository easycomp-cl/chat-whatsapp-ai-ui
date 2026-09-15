import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonTable } from "@/components/layout/page-skeletons";
import { CustomersPageContent } from "@/features/customers/components/customers-page-content";
import { CLIENTS_MODULE } from "@/lib/roles/labels";

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title={CLIENTS_MODULE.pageTitle}
        description={CLIENTS_MODULE.pageDescription}
      />
      <Suspense fallback={<SkeletonTable rows={6} />}>
        <CustomersPageContent />
      </Suspense>
    </div>
  );
}
