import { requireBusinessAdmin } from "@/lib/auth/session";
import { botApi } from "@/lib/bot-api/client";
import { KnowledgeIndexHelp } from "@/features/knowledge/components/knowledge-index-help";
import { KnowledgeManager } from "@/features/knowledge/components/knowledge-manager";
import type { KnowledgeDocument } from "@/lib/bot-api/types";

export default async function KnowledgePage() {
  const profile = await requireBusinessAdmin();
  let documents: KnowledgeDocument[] = [];

  try {
    documents = await botApi.listKnowledgeDocuments(profile.business_id!);
  } catch {
    documents = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Base de conocimiento</h2>
        <p className="text-muted-foreground">
          Políticas, guías y contexto largo para que el bot responda con RAG (distinto de
          FAQs y catálogo).
        </p>
      </div>
      <KnowledgeIndexHelp />
      <KnowledgeManager documents={documents} />
    </div>
  );
}
