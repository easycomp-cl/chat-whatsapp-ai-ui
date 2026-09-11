import { mergeWhatsappDeliveryStatusString } from "@/lib/conversations/delivery-status";
import { parseMessageInteractive } from "@/lib/conversations/interactive-message";
import { normalizeMessage } from "@/lib/conversations/message-display";
import type { Message } from "@/types/database.types";

function readString(row: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return null;
}

function readNumber(row: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

/** Aplica un UPDATE de Supabase Realtime sobre la fila `Message` sin recargar todo el chat. */
export function patchMessageFromRealtimeRow(
  message: Message,
  row: Record<string, unknown>
): Message {
  const incomingStatus = readString(row, "whatsappDeliveryStatus", "whatsapp_delivery_status");
  const incomingExternalId = readString(row, "externalId", "external_id");
  const incomingContent = readString(row, "contentText", "content_text");
  const incomingErrorMessage = readString(
    row,
    "whatsappDeliveryErrorMessage",
    "whatsapp_delivery_error_message"
  );
  const incomingErrorCode = readNumber(
    row,
    "whatsappDeliveryErrorCode",
    "whatsapp_delivery_error_code"
  );
  const incomingInteractive = parseMessageInteractive(
    row.interactive ?? row.rawPayloadJson ?? null
  );

  return normalizeMessage({
    ...message,
    content_text: incomingContent ?? message.content_text,
    external_id: message.external_id ?? incomingExternalId,
    whatsapp_delivery_status:
      mergeWhatsappDeliveryStatusString(
        message.whatsapp_delivery_status,
        incomingStatus
      ) ?? message.whatsapp_delivery_status,
    whatsapp_delivery_error_code:
      incomingErrorCode ?? message.whatsapp_delivery_error_code ?? null,
    whatsapp_delivery_error_message:
      incomingErrorMessage ?? message.whatsapp_delivery_error_message ?? null,
    interactive: incomingInteractive ?? message.interactive ?? null,
  });
}

export function isDeliveryStatusRealtimePatch(row: Record<string, unknown>): boolean {
  return (
    row.whatsappDeliveryStatus != null ||
    row.whatsapp_delivery_status != null ||
    row.whatsappDeliveryErrorCode != null ||
    row.whatsapp_delivery_error_code != null ||
    row.whatsappDeliveryErrorMessage != null ||
    row.whatsapp_delivery_error_message != null ||
    row.externalId != null ||
    row.external_id != null
  );
}
