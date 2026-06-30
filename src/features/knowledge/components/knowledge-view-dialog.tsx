"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getKnowledgeDocumentAction } from "@/lib/actions/app-actions";
import { formatDateTime } from "@/lib/format-datetime";
import type { KnowledgeDocument, KnowledgeDocumentDetail } from "@/lib/bot-api/types";

const STATUS_LABELS = {
  PENDING: "En cola",
  INDEXING: "Indexando…",
  INDEXED: "Listo para el bot",
  ERROR: "Error",
} as const;

export function KnowledgeViewDialog({
  document,
  open,
  onOpenChange,
}: {
  document: KnowledgeDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [detail, setDetail] = useState<KnowledgeDocumentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || !document) {
      setDetail(null);
      setError(null);
      return;
    }

    startTransition(async () => {
      try {
        const result = await getKnowledgeDocumentAction(document.id);
        setDetail(result);
        setError(null);
      } catch {
        setError("No se pudo cargar el contenido del documento.");
        setDetail(null);
      }
    });
  }, [open, document]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-0 p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="pr-8">{document?.title ?? "Documento"}</DialogTitle>
          {detail && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-normal">
              <Badge variant="outline">{detail.sourceType}</Badge>
              <Badge variant="outline">{STATUS_LABELS[detail.status]}</Badge>
              {detail.chunkCount > 0 && (
                <span className="text-muted-foreground">
                  {detail.chunkCount} fragmento{detail.chunkCount === 1 ? "" : "s"} indexados
                </span>
              )}
              {detail.indexedAt && (
                <span className="text-muted-foreground">
                  · Indexado {formatDateTime(detail.indexedAt)}
                </span>
              )}
            </div>
          )}
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {pending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Cargando contenido…
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!pending && !error && detail?.content && (
            <pre className="whitespace-pre-wrap rounded-lg bg-muted/40 p-4 font-sans text-sm leading-relaxed">
              {detail.content}
            </pre>
          )}
          {!pending && !error && detail && !detail.content && (
            <p className="text-sm text-muted-foreground">
              Aún no hay texto disponible. Si subiste un archivo, espera a que termine la
              indexación o pulsa reindexar.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
