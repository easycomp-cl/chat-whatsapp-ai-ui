"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, Loader2, Plus, RefreshCw, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  createKnowledgeAction,
  deleteKnowledgeAction,
  indexKnowledgeAction,
  uploadKnowledgeAction,
} from "@/lib/actions/app-actions";
import type { KnowledgeDocument, KnowledgeDocumentStatus } from "@/lib/bot-api/types";
import { formatDateTime } from "@/lib/format-datetime";
import { KnowledgeViewDialog } from "./knowledge-view-dialog";

const statusLabels: Record<KnowledgeDocumentStatus, string> = {
  PENDING: "En cola",
  INDEXING: "Indexando…",
  INDEXED: "Listo",
  ERROR: "Error",
};

const statusColors: Record<KnowledgeDocumentStatus, string> = {
  PENDING: "border-slate-200 bg-slate-50 text-slate-600",
  INDEXING: "border-amber-200 bg-amber-50 text-amber-700",
  INDEXED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ERROR: "border-red-200 bg-red-50 text-red-700",
};

const ACCEPTED_TYPES = ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";
const MAX_FILE_SIZE = 15 * 1024 * 1024;

function formatFileSize(bytes: number | null) {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function KnowledgeManager({ documents }: { documents: KnowledgeDocument[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<KnowledgeDocument | null>(null);
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasIndexing = documents.some(
    (d) => d.status === "PENDING" || d.status === "INDEXING"
  );

  useEffect(() => {
    if (hasIndexing) {
      pollRef.current = setInterval(() => router.refresh(), 2500);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [hasIndexing, router]);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createKnowledgeAction({
          title,
          raw_text: rawText,
          source_type: "MANUAL",
          auto_index: true,
        });
        toast.success("Documento en cola de indexación");
        setOpen(false);
        setTitle("");
        setRawText("");
        router.refresh();
      } catch {
        toast.error("Error al crear documento");
      }
    });
  }

  function handleUpload(file: File) {
    if (file.size > MAX_FILE_SIZE) {
      toast.error("El archivo supera el límite de 15 MB");
      return;
    }
    startTransition(async () => {
      try {
        const form = new FormData();
        form.append("file", file);
        form.append("title", file.name);
        await uploadKnowledgeAction(form);
        toast.success("Archivo subido — indexación en curso");
        router.refresh();
      } catch {
        toast.error("Error al subir archivo");
      }
    });
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }

  function handleIndex(id: string) {
    startTransition(async () => {
      try {
        await indexKnowledgeAction(id);
        toast.success("Reindexación iniciada");
        router.refresh();
      } catch {
        toast.error("Error al indexar");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteKnowledgeAction(id);
        toast.success("Documento eliminado");
        router.refresh();
      } catch {
        toast.error("Error al eliminar");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Texto manual
        </Button>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={pending}>
          <Upload className="size-4" />
          Subir archivo
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        }`}
      >
        <Upload className="mx-auto mb-2 size-8 text-muted-foreground" />
        <p className="text-sm font-medium">Arrastra PDF, DOCX o TXT aquí</p>
        <p className="mt-1 text-xs text-muted-foreground">Máximo 15 MB</p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo documento de texto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Contenido</Label>
              <Textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={8}
                required
              />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Crear y indexar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {documents.length === 0 ? (
        <div className="rounded-md border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Sube tu primer documento para que el bot pueda responder con información de tu negocio.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Tamaño</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Última indexación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{doc.title}</p>
                      {doc.status === "ERROR" && doc.indexError && (
                        <p className="mt-0.5 text-xs text-red-600">{doc.indexError}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{doc.sourceType}</TableCell>
                  <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[doc.status]}>
                      {(doc.status === "PENDING" || doc.status === "INDEXING") && (
                        <Loader2 className="mr-1 size-3 animate-spin" />
                      )}
                      {statusLabels[doc.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {doc.indexedAt ? formatDateTime(doc.indexedAt) : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Ver contenido"
                        onClick={() => setViewDoc(doc)}
                        disabled={pending}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Reindexar: volver a procesar para el bot"
                        onClick={() => handleIndex(doc.id)}
                        disabled={pending}
                      >
                        <RefreshCw className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Eliminar"
                        onClick={() => handleDelete(doc.id)}
                        disabled={pending}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <KnowledgeViewDialog
        document={viewDoc}
        open={viewDoc !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setViewDoc(null);
        }}
      />
    </div>
  );
}
