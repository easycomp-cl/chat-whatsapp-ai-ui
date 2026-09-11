"use client";

import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/conversations/message-media";
import { useMessageMediaUrl } from "@/features/conversations/hooks/use-message-media-url";
import { FileText, ImageOff, Loader2 } from "lucide-react";

type ChatMediaImageProps = {
  messageId: string;
  hasMedia: boolean;
  localPreviewUrl?: string;
  alt?: string;
  className?: string;
};

export function ChatMediaImage({
  messageId,
  hasMedia,
  localPreviewUrl,
  alt = "Imagen",
  className,
}: ChatMediaImageProps) {
  const { url, loading, error, retry, handleMediaError } = useMessageMediaUrl(messageId, hasMedia && !localPreviewUrl);
  const displayUrl = localPreviewUrl ?? url;

  if (!hasMedia && !localPreviewUrl) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-md bg-[#f0f2f5] px-3 py-2 text-xs text-[#667781]",
          className
        )}
      >
        <ImageOff className="size-4 shrink-0" />
        <span>Imagen no disponible</span>
      </div>
    );
  }

  if (loading && !displayUrl) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md bg-[#f0f2f5] px-3 py-6 text-[#667781]",
          className
        )}
      >
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (error && !displayUrl) {
    return (
      <button
        type="button"
        onClick={retry}
        className={cn(
          "flex items-center gap-2 rounded-md bg-[#f0f2f5] px-3 py-2 text-xs text-[#667781] hover:bg-[#e9edef]",
          className
        )}
      >
        <ImageOff className="size-4 shrink-0" />
        <span>Archivo no disponible · Reintentar</span>
      </button>
    );
  }

  if (!displayUrl) {
    return null;
  }

  return (
    <a href={displayUrl} target="_blank" rel="noopener noreferrer" className={cn("block", className)}>
      <img
        key={displayUrl}
        src={displayUrl}
        alt={alt}
        className="max-h-64 max-w-full rounded-md object-contain"
        onError={() => {
          if (!localPreviewUrl) handleMediaError();
        }}
      />
    </a>
  );
}

type ChatMediaDocumentProps = {
  messageId: string;
  hasMedia: boolean;
  filename?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  className?: string;
};

export function ChatMediaDocument({
  messageId,
  hasMedia,
  filename,
  fileSize,
  mimeType,
  className,
}: ChatMediaDocumentProps) {
  const { url, loading, error, retry } = useMessageMediaUrl(messageId, hasMedia);

  if (!hasMedia) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-md bg-[#f0f2f5] px-3 py-2 text-xs text-[#667781]",
          className
        )}
      >
        <FileText className="size-4 shrink-0" />
        <span>{filename?.trim() || "Documento no disponible"}</span>
      </div>
    );
  }

  const label = filename?.trim() || "Documento";
  const sizeLabel = fileSize ? formatFileSize(fileSize) : null;
  const typeLabel = mimeType?.includes("pdf") ? "PDF" : "Documento";

  if (loading && !url) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-md bg-[#f0f2f5] px-3 py-3 text-[#667781]",
          className
        )}
      >
        <Loader2 className="size-4 animate-spin" />
        <span className="text-xs">Cargando documento…</span>
      </div>
    );
  }

  if (error || !url) {
    return (
      <button
        type="button"
        onClick={retry}
        className={cn(
          "flex w-full items-center gap-3 rounded-md bg-[#f0f2f5] px-3 py-2 text-left hover:bg-[#e9edef]",
          className
        )}
      >
        <FileText className="size-5 shrink-0 text-[#667781]" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[#111b21]">{label}</p>
          <p className="text-[11px] text-[#667781]">No disponible · Reintentar</p>
        </div>
      </button>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      download={filename ?? undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-md bg-[#f0f2f5] px-3 py-2 transition-colors hover:bg-[#e9edef]",
        className
      )}
    >
      <FileText className="size-5 shrink-0 text-[#027eb5]" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[#111b21]">{label}</p>
        <p className="text-[11px] text-[#667781]">
          {typeLabel}
          {sizeLabel ? ` · ${sizeLabel}` : ""}
        </p>
      </div>
    </a>
  );
}
