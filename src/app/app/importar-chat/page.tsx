import { Suspense } from "react";
import { ChatImportBatchUpload } from "@/features/chat-import/components/chat-import-batch-upload";
import { ChatImportFlowStepper } from "@/features/chat-import/components/chat-import-flow-stepper";
import { ChatImportPageHeader } from "@/features/chat-import/components/chat-import-page-header";
import { ChatImportSection } from "@/features/chat-import/components/chat-import-section";
import { ImportarChatSectionsContent } from "@/features/chat-import/components/importar-chat-sections-content";
import { ImportarChatPanelsSkeleton } from "@/components/layout/page-skeletons";
import { Upload } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ImportarChatPage() {
  return (
    <div className="space-y-10">
      <ChatImportPageHeader />
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

      <Suspense fallback={<ImportarChatPanelsSkeleton />}>
        <ImportarChatSectionsContent />
      </Suspense>
    </div>
  );
}
