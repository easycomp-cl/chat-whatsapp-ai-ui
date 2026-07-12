import { requireBusinessAdmin } from "@/lib/auth/session";
import { botApi, getBotApiErrorMessage } from "@/lib/bot-api/client";
import {
  getConsolidatedToneAction,
  listPendingFaqSuggestionsAction,
} from "@/lib/actions/chat-import-actions";
import { ChatImportHistory } from "@/features/chat-import/components/chat-import-history";
import { ChatImportSection } from "@/features/chat-import/components/chat-import-section";
import { ConsolidatedTonePanel } from "@/features/chat-import/components/consolidated-tone-panel";
import { PendingFaqsPanel } from "@/features/chat-import/components/pending-faqs-panel";
import { ChatImportResetButton } from "@/features/chat-import/components/chat-import-reset-button";
import { ChatImportSyncProvider } from "@/features/chat-import/components/chat-import-sync-provider";
import { MAX_IMPORT_HISTORY } from "@/lib/chat-import/constants";
import type { PaginatedImportJobs } from "@/lib/bot-api/types";
import { HelpCircle, History, Sparkles } from "lucide-react";

const EMPTY_HISTORY: PaginatedImportJobs = {
  items: [],
  total: 0,
  page: 1,
  limit: MAX_IMPORT_HISTORY,
};

export async function ImportarChatSectionsContent() {
  const profile = await requireBusinessAdmin();
  const businessId = profile.business_id!;

  let history = EMPTY_HISTORY;
  let apiError: string | null = null;

  const [historyResult, consolidatedTone, pendingFaqs] = await Promise.all([
    botApi
      .listChatImports(businessId, { page: 1, limit: MAX_IMPORT_HISTORY })
      .then((data) => ({ ok: true as const, data }))
      .catch((error) => ({ ok: false as const, error: getBotApiErrorMessage(error) })),
    getConsolidatedToneAction(false).catch(() => null),
    listPendingFaqSuggestionsAction().catch(() => []),
  ]);

  if (historyResult.ok) {
    history = historyResult.data;
  } else {
    apiError = historyResult.error;
  }

  const hasActiveJobs = history.items.some(
    (job) => job.status === "pending" || job.status === "processing"
  );

  const hasImportData =
    history.total > 0 || consolidatedTone !== null || pendingFaqs.length > 0;

  return (
    <ChatImportSyncProvider hasActiveJobs={hasActiveJobs}>
      {apiError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {apiError} Sin el backend activo no se pueden importar chats ni ver el historial.
        </div>
      ) : null}

      <div className="flex justify-end">
        <ChatImportResetButton hasImportData={hasImportData} />
      </div>

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
    </ChatImportSyncProvider>
  );
}
