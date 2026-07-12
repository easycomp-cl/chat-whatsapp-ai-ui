import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsContentSkeleton } from "@/components/layout/page-skeletons";
import { SettingsPageContent } from "@/features/settings/components/settings-page-content";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        description="Ajustes del bot y del negocio"
      />
      <Suspense fallback={<SettingsContentSkeleton />}>
        <SettingsPageContent />
      </Suspense>
    </div>
  );
}
