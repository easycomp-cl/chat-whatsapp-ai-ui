import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { UsersContentSkeleton } from "@/components/layout/page-skeletons";
import { UsersPageContent } from "@/features/users/components/users-page-content";
import { TEAM_MODULE } from "@/lib/roles/labels";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title={TEAM_MODULE.pageTitle}
        description={TEAM_MODULE.pageDescription}
      />
      <Suspense fallback={<UsersContentSkeleton />}>
        <UsersPageContent />
      </Suspense>
    </div>
  );
}
