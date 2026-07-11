import type { Message } from "@/types/database.types";

export type WhatsappDeliveryStatus = "pending" | "sent" | "failed";

const PENDING_GRACE_MS = 20_000;

export function resolveWhatsappDeliveryStatus(
  message: Message
): WhatsappDeliveryStatus | null {
  if (message.direction !== "OUTBOUND") {
    return null;
  }

  const raw = message.whatsapp_delivery_status?.toLowerCase();
  if (raw === "pending" || raw === "sent" || raw === "failed") {
    return raw;
  }

  if (message.external_id) {
    return "sent";
  }

  const ageMs = Date.now() - new Date(message.created_at).getTime();
  if (ageMs < PENDING_GRACE_MS) {
    return "pending";
  }

  return "failed";
}

export function canResendWhatsappMessage(message: Message): boolean {
  const status = resolveWhatsappDeliveryStatus(message);
  return status === "failed";
}
