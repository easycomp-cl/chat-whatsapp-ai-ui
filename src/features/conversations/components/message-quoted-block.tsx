import { cn } from "@/lib/utils";

const SENDER_LABELS: Record<string, string> = {
  CUSTOMER: "Cliente",
  HUMAN: "Asesor",
  BOT: "Bot",
  SYSTEM: "Sistema",
};

type MessageQuotedBlockProps = {
  quotedText: string;
  quotedSenderType?: string | null;
  inbound: boolean;
  unavailable?: boolean;
};

export function MessageQuotedBlock({
  quotedText,
  quotedSenderType,
  inbound,
  unavailable = false,
}: MessageQuotedBlockProps) {
  const senderLabel =
    (quotedSenderType && SENDER_LABELS[quotedSenderType]) ?? "Mensaje citado";

  return (
    <div
      className={cn(
        "mb-1.5 rounded-md border-l-[3px] px-2 py-1",
        unavailable
          ? "border-[#8696a0] bg-[#f0f2f5]/80"
          : inbound
            ? "border-[#00a884] bg-[#f0f2f5]"
            : "border-[#53bdeb] bg-black/5"
      )}
    >
      {!unavailable && (
        <p
          className={cn(
            "text-[11px] font-semibold",
            inbound ? "text-[#00a884]" : "text-[#027eb5]"
          )}
        >
          {senderLabel}
        </p>
      )}
      <p
        className={cn(
          "line-clamp-3 text-xs leading-snug",
          unavailable ? "italic text-[#8696a0]" : "text-[#667781]"
        )}
      >
        {quotedText}
      </p>
    </div>
  );
}
