"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileUp, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { uploadChatImportAction } from "@/lib/actions/chat-import-actions";
import {
  type DetectedSender,
  extractSendersFromFile,
  validateChatFile,
  validateWhatsAppFormat,
} from "@/lib/chat-import/utils";
import { fixMojibake } from "@/lib/text-encoding";
import { ChatImportFormatHelp } from "./chat-import-format-help";
import { useChatImportSyncOptional } from "./chat-import-sync-provider";

type QueueItem = {
  id: string;
  file: File;
  status: "ready" | "uploading" | "done" | "error";
  jobId?: string;
  error?: string;
};

export function ChatImportBatchUpload() {
  const router = useRouter();
  const sync = useChatImportSyncOptional();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [senders, setSenders] = useState<DetectedSender[]>([]);
  const [senderName, setSenderName] = useState("");
  const [manualSenderName, setManualSenderName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [uploading, startUpload] = useTransition();

  const hasZip = queue.some((item) => item.file.name.toLowerCase().endsWith(".zip"));
  const selectedSender = hasZip ? manualSenderName.trim() : senderName;
  const isUploading = queue.some((item) => item.status === "uploading");
  const analysisInProgress = sync?.watching ?? false;
  const readyCount = queue.filter((item) => item.status === "ready").length;

  async function addFiles(files: FileList | File[]) {
    const incoming = Array.from(files);
    const valid: QueueItem[] = [];

    for (const file of incoming) {
      const error = validateChatFile(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
        continue;
      }
      const formatIssue = await validateWhatsAppFormat(file);
      if (formatIssue && !file.name.toLowerCase().endsWith(".zip")) {
        toast.error(`${file.name}: ${formatIssue}`);
        continue;
      }
      valid.push({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        status: "ready",
      });
    }

    if (!valid.length) return;

    setQueue((prev) => {
      const existing = new Set(prev.map((item) => item.id));
      return [...prev, ...valid.filter((item) => !existing.has(item.id))];
    });

    const firstTxt = valid.find((item) => item.file.name.toLowerCase().endsWith(".txt"));
    if (firstTxt && senders.length === 0) {
      setScanning(true);
      try {
        const detected = await extractSendersFromFile(firstTxt.file);
        setSenders(detected);
        if (detected.length === 1) setSenderName(detected[0]!.name);
      } finally {
        setScanning(false);
      }
    }
  }

  function removeFromQueue(id: string) {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleUploadAll() {
    if (!queue.length) {
      toast.error("Agrega al menos un archivo");
      return;
    }
    if (!selectedSender) {
      toast.error("Selecciona tu nombre en el chat");
      return;
    }

    startUpload(async () => {
      const queuedJobIds: string[] = [];

      for (const item of queue) {
        if (item.status === "done") continue;

        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: "uploading" } : q))
        );

        try {
          const formData = new FormData();
          formData.append("file", item.file);
          formData.append("business_sender_name", selectedSender);
          const result = await uploadChatImportAction(formData);
          queuedJobIds.push(result.import_job_id);
          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? { ...q, status: "done", jobId: result.import_job_id }
                : q
            )
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Error al subir";
          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id ? { ...q, status: "error", error: message } : q
            )
          );
        }
      }

      if (queuedJobIds.length) {
        sync?.notifyJobsQueued(queuedJobIds);
        router.refresh();
        toast.success(
          queuedJobIds.length === 1
            ? "Chat en análisis. Espera unos segundos…"
            : `${queuedJobIds.length} chats en análisis. Espera unos segundos…`
        );
      }
    });
  }

  return (
    <Card className="border-0 bg-card/90 shadow-none">
      <CardContent className="space-y-4 p-0">
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length) void addFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          }`}
        >
          <FileUp className="mb-2 size-8 text-muted-foreground" />
          <p className="text-sm font-medium">
            Arrastra uno o varios .txt / .zip
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Un archivo por cliente · máx. 10 MB c/u
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.zip,text/plain,application/zip"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void addFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {scanning && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Detectando participantes…
          </div>
        )}

        {queue.length > 0 && (
          <div className="space-y-2 rounded-md border p-3">
            <p className="text-sm font-medium">
              Cola de importación ({queue.length})
            </p>
            <ul className="space-y-2">
              {queue.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="truncate">{fixMojibake(item.file.name)}</span>
                  <div className="flex items-center gap-2">
                    {item.status === "ready" && (
                      <Badge variant="outline">Listo</Badge>
                    )}
                    {item.status === "uploading" && (
                      <Badge variant="secondary">
                        <Loader2 className="size-3 animate-spin" />
                        Subiendo
                      </Badge>
                    )}
                    {item.status === "done" && (
                      <Badge>En análisis</Badge>
                    )}
                    {item.status === "error" && (
                      <Badge variant="destructive">Error</Badge>
                    )}
                    {item.status === "ready" && !uploading && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromQueue(item.id)}
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {senders.length > 0 && (
          <div className="space-y-2">
            <Label>Tu nombre / negocio en WhatsApp</Label>
            <Select value={senderName} onValueChange={(v) => setSenderName(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona tu nombre" />
              </SelectTrigger>
              <SelectContent>
                {senders.map((sender) => (
                  <SelectItem key={sender.name} value={sender.name}>
                    {fixMojibake(sender.name)} ({sender.messageCount.toLocaleString("es-CL")} msgs
                    en muestra)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Se usará el mismo nombre para todos los chats de la cola.
            </p>
          </div>
        )}

        {hasZip && (
          <div className="space-y-2">
            <Label htmlFor="manual-sender">Nombre del negocio en el chat</Label>
            <Input
              id="manual-sender"
              value={manualSenderName}
              onChange={(e) => setManualSenderName(e.target.value)}
              placeholder="Ej: Israel G. 😇"
            />
          </div>
        )}

        <ChatImportFormatHelp />

        <Button
          type="button"
          size="lg"
          disabled={
            uploading ||
            isUploading ||
            analysisInProgress ||
            readyCount === 0 ||
            !selectedSender
          }
          onClick={() => void handleUploadAll()}
          className="w-full text-base font-semibold shadow-md"
        >
          {uploading || isUploading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Subiendo chats…
            </>
          ) : analysisInProgress ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Analizando chat…
            </>
          ) : (
            `Analizar ${readyCount} chat${readyCount === 1 ? "" : "s"}`
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
