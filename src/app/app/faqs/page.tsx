import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { FaqsContentSkeleton } from "@/components/layout/page-skeletons";
import { FaqsPageContent } from "@/features/faqs/components/faqs-page-content";

export default function FaqsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Preguntas frecuentes"
        description="Administra respuestas automáticas con keywords y frases alternativas"
      />
      <Suspense fallback={<FaqsContentSkeleton />}>
        <FaqsPageContent />
      </Suspense>
    </div>
  );
}
