import { requireBusinessAdmin } from "@/lib/auth/session";
import { botApi } from "@/lib/bot-api/client";
import { KnowledgeIndexHelp } from "@/features/knowledge/components/knowledge-index-help";
import { KnowledgeManager } from "@/features/knowledge/components/knowledge-manager";
import type { KnowledgeDocument } from "@/lib/bot-api/types";

export async function KnowledgePageContent() {
  const profile = await requireBusinessAdmin();
  let documents: KnowledgeDocument[] = [];

  try {
    documents = await botApi.listKnowledgeDocuments(profile.business_id!);
  } catch {
    documents = [];
  }

  return (
    <>
      <KnowledgeIndexHelp />
      <KnowledgeManager documents={documents} />
    </>
  );
}
