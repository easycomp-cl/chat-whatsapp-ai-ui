import { requireBusinessAdmin } from "@/lib/auth/session";
import { botApi } from "@/lib/bot-api/client";
import {
  getConsolidatedToneAction,
  listPendingFaqSuggestionsAction,
} from "@/lib/actions/chat-import-actions";
import { ChatImportBatchUpload } from "@/features/chat-import/components/chat-import-batch-upload";
import { ChatImportFlowStepper } from "@/features/chat-import/components/chat-import-flow-stepper";
import { ChatImportHistory } from "@/features/chat-import/components/chat-import-history";
import { ChatImportPageHeader } from "@/features/chat-import/components/chat-import-page-header";
import { ChatImportSection } from "@/features/chat-import/components/chat-import-section";
import { MAX_IMPORT_HISTORY } from "@/lib/chat-import/constants";
import { ConsolidatedTonePanel } from "@/features/chat-import/components/consolidated-tone-panel";
import { PendingFaqsPanel } from "@/features/chat-import/components/pending-faqs-panel";
import { ChatImportResetButton } from "@/features/chat-import/components/chat-import-reset-button";
import { ChatImportSyncProvider } from "@/features/chat-import/components/chat-import-sync-provider";
import { HelpCircle, History, Sparkles, Upload } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ImportarChatPage() {
  const profile = await requireBusinessAdmin();
  const businessId = profile.business_id!;

  const [history, consolidatedTone, pendingFaqs] = await Promise.all([
    botApi.listChatImports(businessId, {
      page: 1,
      limit: MAX_IMPORT_HISTORY,
    }),
    getConsolidatedToneAction(true).catch(() => null),
    listPendingFaqSuggestionsAction().catch(() => []),
  ]);

  const hasActiveJobs = history.items.some(
    (job) => job.status === "pending" || job.status === "processing"
  );

  const hasImportData =
    history.total > 0 ||
    consolidatedTone !== null ||
    pendingFaqs.length > 0;

  return (
    <ChatImportSyncProvider hasActiveJobs={hasActiveJobs}>
      <div className="space-y-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <ChatImportPageHeader />
          <ChatImportResetButton hasImportData={hasImportData} />
        </div>
        <ChatImportFlowStepper />

        <ChatImportSection
          step={1}
          title="Sube y analiza"
          description="Arrastra el export de WhatsApp, elige tu nombre en el chat y pulsa analizar. La IA extraerá tono y preguntas frecuentes."
          icon={Upload}
          accent="upload"
          className="max-w-4xl"
        >
          <ChatImportBatchUpload />
        </ChatImportSection>

        <ChatImportSection
          step={2}
          title="Tono de tu bot"
          description="Revisa cómo detectamos que hablas con clientes. Edita frases, ajusta reglas y aplícalo al bot cuando esté listo."
          icon={Sparkles}
          accent="tone"
        >
          <ConsolidatedTonePanel tone={consolidatedTone} />
        </ChatImportSection>

        <ChatImportSection
          step={3}
          title="Historial de importaciones"
          description="Sigue el progreso de cada archivo, cuántos mensajes se leyeron y cuántas FAQs se detectaron. Máximo 10 guardadas."
          icon={History}
          accent="history"
        >
          <ChatImportHistory initialData={history} />
        </ChatImportSection>

        <ChatImportSection
          step={4}
          title="Preguntas frecuentes sugeridas"
          description="Aprueba, edita o descarta las FAQs detectadas en tus chats. Las que apruebes pasan a alimentar las respuestas del bot."
          icon={HelpCircle}
          accent="faqs"
        >
          <PendingFaqsPanel suggestions={pendingFaqs} />
        </ChatImportSection>
      </div>
    </ChatImportSyncProvider>
  );
}
