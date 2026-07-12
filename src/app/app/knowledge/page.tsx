import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { KnowledgeContentSkeleton } from "@/components/layout/page-skeletons";
import { KnowledgePageContent } from "@/features/knowledge/components/knowledge-page-content";

export default function KnowledgePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Base de conocimiento"
        description="Políticas, guías y contexto largo para que el bot responda con RAG (distinto de FAQs y catálogo)."
      />
      <Suspense fallback={<KnowledgeContentSkeleton />}>
        <KnowledgePageContent />
      </Suspense>
    </div>
  );
}
