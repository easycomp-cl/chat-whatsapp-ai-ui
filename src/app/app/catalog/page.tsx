import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { CatalogContentSkeleton } from "@/components/layout/page-skeletons";
import { CatalogPageContent } from "@/features/catalog/components/catalog-page-content";

export default function CatalogPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Catálogo de productos"
        description="Importa productos desde CSV o JSON"
      />
      <Suspense fallback={<CatalogContentSkeleton />}>
        <CatalogPageContent />
      </Suspense>
    </div>
  );
}
