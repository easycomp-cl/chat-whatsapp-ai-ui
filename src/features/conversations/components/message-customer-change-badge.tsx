"use client";

import { cn } from "@/lib/utils";
import { formatFullTime } from "@/lib/conversations/utils";
import {
  formatCustomerChangeTime,
  getCustomerEditedOriginalText,
  isCustomerEditedMessage,
  isCustomerRevokedMessage,
} from "@/lib/conversations/customer-message-change";
import type { Message } from "@/types/database.types";

type MessageCustomerChangeBadgeProps = {
  message: Message;
  showAudit: boolean;
};

export function MessageCustomerChangeBadge({
  message,
  showAudit,
}: MessageCustomerChangeBadgeProps) {
  if (!showAudit) return null;

  const revoked = isCustomerRevokedMessage(message);
  const edited = isCustomerEditedMessage(message);
  const originalText = getCustomerEditedOriginalText(message);

  if (!revoked && !edited) return null;

  return (
    <div className="mt-1.5 space-y-1 border-t border-[#d1d7db]/60 pt-1.5">
      {revoked && (
        <p className="text-[10px] font-medium text-[#ea0038]">
          Eliminado por el cliente en WhatsApp
          {formatCustomerChangeTime(message.customer_revoked_at)
            ? ` · ${formatFullTime(message.customer_revoked_at!)}`
            : ""}
        </p>
      )}
      {edited && (
        <p className="text-[10px] font-medium text-[#027eb5]">
          Editado por el cliente en WhatsApp
          {formatCustomerChangeTime(message.customer_edited_at)
            ? ` · ${formatFullTime(message.customer_edited_at!)}`
            : ""}
        </p>
      )}
      {edited && originalText && (
        <details className="text-[10px] text-[#667781]">
          <summary className="cursor-pointer select-none hover:text-[#54656f]">
            Ver texto original (solo admin)
          </summary>
          <p
            className={cn(
              "mt-1 rounded bg-[#f0f2f5] px-2 py-1 whitespace-pre-wrap",
              revoked && "line-through opacity-80"
            )}
          >
            {originalText}
          </p>
        </details>
      )}
    </div>
  );
}
