"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getChatImportFaqSuggestionsAction,
  getChatImportJobAction,
  getChatImportToneAction,
} from "@/lib/actions/chat-import-actions";
import { isParseError, JOB_STATUS_MESSAGES } from "@/lib/chat-import/utils";
import { fixMojibake } from "@/lib/text-encoding";
import { ChatImportFormatHelp } from "./chat-import-format-help";
import type {
  FaqSuggestion,
  ImportJob,
  ToneAnalysis,
} from "@/lib/bot-api/types";
import { ToneAnalysisPanel } from "./tone-analysis-panel";
import { FaqSuggestionsPanel } from "./faq-suggestions-panel";
import { MessagesPreviewPanel } from "./messages-preview-panel";
import {
  estimateImportProgress,
  ImportProgressBar,
} from "./import-progress-bar";

const POLL_INTERVAL_MS = 3000;
const PENDING_WARNING_MS = 2 * 60 * 1000;

export function ChatImportJobView({
  importJobId,
  initialJob,
  initialTone,
  initialSuggestions,
}: {
  importJobId: string;
  initialJob: ImportJob;
  initialTone: ToneAnalysis | null;
  initialSuggestions: FaqSuggestion[];
}) {
  const [job, setJob] = useState(initialJob);
  const [tone, setTone] = useState(initialTone);
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [showPendingWarning, setShowPendingWarning] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedAt = useRef(Date.now());

  const isTerminal = job.status === "completed" || job.status === "failed";
  const isProcessing = !isTerminal;

  useEffect(() => {
    if (!isProcessing) return;

    async function poll() {
      try {
        const updated = await getChatImportJobAction(importJobId);
        setJob(updated);

        if (updated.status === "completed") {
          const [toneResult, faqResult] = await Promise.all([
            getChatImportToneAction(importJobId),
            getChatImportFaqSuggestionsAction(importJobId),
          ]);
          setTone(toneResult);
          setSuggestions(faqResult);
        }
      } catch {
        // reintentar en el siguiente ciclo
      }
    }

    pollRef.current = setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [importJobId, isProcessing]);

  useEffect(() => {
    if (job.status !== "pending") return;
    const elapsed = Date.now() - mountedAt.current;
    const remaining = PENDING_WARNING_MS - elapsed;
    const timer = setTimeout(
      () => setShowPendingWarning(true),
      Math.max(0, remaining)
    );
    return () => clearTimeout(timer);
  }, [job.status]);

  if (isProcessing) {
    const progress = estimateImportProgress(job);
    const step = job.progress_step ?? progress.step;

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href="/app/importar-chat"
          className={cn(buttonVariants({ variant: "ghost" }))}
        >
          <ArrowLeft className="size-4" />
          Nueva importación
        </Link>

        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <Loader2 className="size-10 animate-spin text-primary" />
            <div className="w-full max-w-md space-y-4">
              <div>
                <p className="text-lg font-medium">
                  {JOB_STATUS_MESSAGES[job.status]}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {fixMojibake(job.original_filename)}
                </p>
              </div>
              <ImportProgressBar
                percent={progress.percent}
                step={step}
              />
            </div>

            {(job.total_messages > 0 ||
              job.customer_messages_count > 0 ||
              job.business_messages_count > 0) && (
              <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                <span>{job.total_messages} mensajes</span>
                <span>{job.customer_messages_count} del cliente</span>
                <span>{job.business_messages_count} del negocio</span>
              </div>
            )}

            {showPendingWarning && job.status === "pending" && (
              <p className="max-w-md rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                El análisis está tardando más de lo habitual. Si persiste,
                contacta a soporte — el worker podría no estar en ejecución.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (job.status === "failed") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href="/app/importar-chat"
          className={cn(buttonVariants({ variant: "ghost" }))}
        >
          <ArrowLeft className="size-4" />
          Reintentar subida
        </Link>

        <Card className="border-red-200">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <AlertCircle className="size-10 text-red-600" />
            <div>
              <p className="text-lg font-medium">Error en el análisis</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {job.error_message ?? "Ocurrió un error desconocido."}
              </p>
            </div>
            {isParseError(job.error_message) && (
              <div className="w-full max-w-lg text-left">
                <ChatImportFormatHelp />
              </div>
            )}
            <Link
              href="/app/importar-chat"
              className={cn(buttonVariants())}
            >
              Subir otro archivo
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/app/importar-chat"
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            <ArrowLeft className="size-4" />
            Nueva importación
          </Link>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            Revisión del análisis
          </h2>
          <p className="text-muted-foreground">{fixMojibake(job.original_filename)}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span>{job.total_messages} mensajes</span>
          <span>{job.detected_faq_count} FAQs detectadas</span>
          {job.detected_tone_summary && (
            <span className="max-w-xs truncate">{job.detected_tone_summary}</span>
          )}
        </div>
      </div>

      <Tabs defaultValue="tone">
        <TabsList>
          <TabsTrigger value="tone">Tono</TabsTrigger>
          <TabsTrigger value="faqs">
            FAQs ({suggestions.length})
          </TabsTrigger>
          <TabsTrigger value="preview">Muestra del negocio</TabsTrigger>
        </TabsList>

        <TabsContent value="tone" className="mt-4">
          {tone ? (
            <ToneAnalysisPanel
              tone={tone}
              importJobId={importJobId}
              onApproved={setTone}
            />
          ) : (
            <p className="text-muted-foreground">
              No se generó análisis de tono para esta importación.
            </p>
          )}
        </TabsContent>

        <TabsContent value="faqs" className="mt-4">
          <FaqSuggestionsPanel
            suggestions={suggestions}
            importJobId={importJobId}
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <MessagesPreviewPanel importJobId={importJobId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
