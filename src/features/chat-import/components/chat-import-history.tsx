"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { History, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { fixMojibake } from "@/lib/text-encoding";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteChatImportAction } from "@/lib/actions/chat-import-actions";
import type { ImportJob, PaginatedImportJobs } from "@/lib/bot-api/types";
import { MAX_IMPORT_HISTORY } from "@/lib/chat-import/constants";
import {
  estimateImportProgress,
  ImportProgressBar,
} from "./import-progress-bar";

const STATUS_LABELS: Record<string, string> = {
  pending: "En cola",
  processing: "Analizando",
  completed: "Listo",
  failed: "Error",
};

export function ChatImportHistory({
  initialData,
}: {
  initialData: PaginatedImportJobs;
}) {
  if (initialData.items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-lg border border-dashed bg-background/60 px-6 py-10 text-center">
        <History className="mb-3 size-8 text-amber-500/70" aria-hidden />
        <p className="font-medium">Sin importaciones todavía</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Sube tu primer chat arriba. Aquí verás el progreso y los resultados
          (máx. {MAX_IMPORT_HISTORY} guardadas).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
        {initialData.total}/{MAX_IMPORT_HISTORY} importaciones guardadas
      </p>
      <div className="overflow-hidden rounded-lg border bg-card/90 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Archivo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Mensajes</TableHead>
              <TableHead>FAQs</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.items.map((job) => (
              <HistoryRow key={job.id} job={job} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function HistoryRow({ job }: { job: ImportJob }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const variant =
    job.status === "completed"
      ? "default"
      : job.status === "failed"
        ? "destructive"
        : "secondary";
  const isActive = job.status === "pending" || job.status === "processing";
  const progress = estimateImportProgress(job);
  const canDelete = job.status !== "processing";

  function handleDelete() {
    if (!canDelete) return;
    const label =
      job.status === "completed"
        ? "Se eliminarán también las sugerencias de FAQ y tono asociadas a esta importación."
        : "Esta importación se quitará del historial.";
    if (!window.confirm(`¿Eliminar "${fixMojibake(job.original_filename)}"?\n\n${label}`)) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteChatImportAction(job.id);
        toast.success("Importación eliminada");
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "No se pudo eliminar"
        );
      }
    });
  }

  return (
    <TableRow>
      <TableCell className="max-w-xs">
        <p className="truncate font-medium">{fixMojibake(job.original_filename)}</p>
        {isActive && (
          <ImportProgressBar
            percent={progress.percent}
            step={job.progress_step ?? progress.step}
            className="mt-2 max-w-xs"
          />
        )}
      </TableCell>
      <TableCell>
        <Badge variant={variant}>{STATUS_LABELS[job.status] ?? job.status}</Badge>
      </TableCell>
      <TableCell>{job.total_messages || "—"}</TableCell>
      <TableCell>{job.detected_faq_count || "—"}</TableCell>
      <TableCell className="text-muted-foreground">
        {format(new Date(job.created_at), "dd MMM yyyy HH:mm", { locale: es })}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Link
            href={`/app/importar-chat/${job.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {job.status === "completed" ? "Revisar" : "Ver"}
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!canDelete || pending}
            onClick={handleDelete}
            title={
              canDelete
                ? "Eliminar importación"
                : "No se puede eliminar mientras se analiza"
            }
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
