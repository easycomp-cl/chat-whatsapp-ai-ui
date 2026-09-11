"use client";

import { cn } from "@/lib/utils";
import { useMessageMediaUrl } from "@/features/conversations/hooks/use-message-media-url";
import { Loader2, Mic, VolumeX } from "lucide-react";

type ChatAudioPlayerProps = {
  messageId: string;
  hasMedia: boolean;
  localPreviewUrl?: string;
  className?: string;
};

export function ChatAudioPlayer({
  messageId,
  hasMedia,
  localPreviewUrl,
  className,
}: ChatAudioPlayerProps) {
  const { url, loading, error, retry, handleMediaError } = useMessageMediaUrl(
    messageId,
    hasMedia && !localPreviewUrl
  );
  const displayUrl = localPreviewUrl ?? url;

  if (!hasMedia && !localPreviewUrl) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-md bg-[#f0f2f5] px-3 py-2 text-xs text-[#667781]",
          className
        )}
      >
        <VolumeX className="size-4 shrink-0" />
        <span>Audio no disponible</span>
      </div>
    );
  }

  if (loading && !displayUrl) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-md bg-[#f0f2f5] px-3 py-3 text-[#667781]",
          className
        )}
      >
        <Loader2 className="size-4 animate-spin" />
        <span className="text-xs">Cargando audio…</span>
      </div>
    );
  }

  if ((error && !displayUrl) || !displayUrl) {
    return (
      <button
        type="button"
        onClick={retry}
        className={cn(
          "flex items-center gap-2 rounded-md bg-[#f0f2f5] px-3 py-2 text-xs text-[#667781] hover:bg-[#e9edef]",
          className
        )}
      >
        <Mic className="size-4 shrink-0" />
        <span>Audio no disponible · Reintentar</span>
      </button>
    );
  }

  return (
    <div className={cn("min-w-[220px] max-w-full", className)}>
      <audio
        controls
        preload="metadata"
        src={displayUrl}
        className="h-9 w-full max-w-sm"
        onError={() => {
          if (!localPreviewUrl) handleMediaError();
        }}
      />
    </div>
  );
}
