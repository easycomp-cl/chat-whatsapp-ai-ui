"use client";

import { cn } from "@/lib/utils";
import { WhatsAppFormattedText } from "@/features/conversations/components/whatsapp-formatted-text";
import { formatFileSize } from "@/lib/conversations/message-media";

type MessageComposePreviewProps = {
  text: string;
  placeholder?: string;
  attachedFileName?: string | null;
  attachedFileSize?: number | null;
  attachedImagePreviewUrl?: string | null;
};

export function MessageComposePreview({
  text,
  placeholder = "Escribe un mensaje",
  attachedFileName,
  attachedFileSize,
  attachedImagePreviewUrl,
}: MessageComposePreviewProps) {
  const hasText = text.length > 0;
  const hasAttachment = Boolean(attachedFileName);

  return (
    <div className="min-h-[42px] min-w-0 flex-1 py-1">
      <div
        className={cn(
          "inline-block max-w-full min-w-[3rem] rounded-lg rounded-tr-none bg-[#d9fdd3] px-3 py-2 text-sm text-[#111b21] shadow-sm",
          "ring-1 ring-[#b8e8b0]/80",
          "max-h-[7.5rem] overflow-x-hidden overflow-y-auto",
          "leading-relaxed whitespace-pre-wrap",
          "[scrollbar-width:thin] [scrollbar-color:#9ccc95_#d9fdd3]",
          "[&::-webkit-scrollbar]:w-1.5",
          "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#9ccc95]",
          "[&::-webkit-scrollbar-track]:bg-transparent"
        )}
      >
        {attachedImagePreviewUrl ? (
          <img
            src={attachedImagePreviewUrl}
            alt="Vista previa del adjunto"
            className="mb-1.5 max-h-32 max-w-full rounded-md object-contain"
          />
        ) : null}
        {hasAttachment && !attachedImagePreviewUrl ? (
          <div className="mb-1.5 rounded-md bg-white/60 px-2 py-1.5 text-xs text-[#54656f]">
            <p className="truncate font-medium text-[#111b21]">{attachedFileName}</p>
            {attachedFileSize ? (
              <p className="text-[11px] text-[#667781]">{formatFileSize(attachedFileSize)}</p>
            ) : null}
          </div>
        ) : null}
        {hasText ? (
          <WhatsAppFormattedText text={text} />
        ) : !hasAttachment ? (
          <span className="text-[#667781]/80">{placeholder}</span>
        ) : null}
      </div>
    </div>
  );
}
