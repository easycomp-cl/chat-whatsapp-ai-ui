import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { CatalogContentSkeleton } from "@/components/layout/page-skeletons";
import { TemplatesPageContent } from "@/features/whatsapp-templates/components/templates-page-content";

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis plantillas"
        description="Pack estándar de WhatsApp para avisos y para hablar con clientes fuera de la ventana de 24 horas. Meta debe aprobarlas antes de usarlas."
      />
      <Suspense fallback={<CatalogContentSkeleton />}>
        <TemplatesPageContent />
      </Suspense>
    </div>
  );
}
