import type { Message } from "@/types/database.types";

export type WhatsappDeliveryStatus = "pending" | "sent" | "failed";

const PENDING_GRACE_MS = 20_000;
export const WHATSAPP_MESSAGE_EDIT_WINDOW_MS = 15 * 60 * 1000;

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

export function getWhatsappEditRemainingMs(message: Message): number {
  const elapsed = Date.now() - new Date(message.created_at).getTime();
  return Math.max(0, WHATSAPP_MESSAGE_EDIT_WINDOW_MS - elapsed);
}

/**
 * Activa la UI de edición de mensajes salientes.
 * Meta Cloud API aún no soporta editar vía API (solo desde la app de WhatsApp).
 * Mantener en `false` hasta que Meta lo habilite; la lógica queda lista para reactivar.
 */
export const WHATSAPP_MESSAGE_EDIT_UI_ENABLED = false;

export function canEditWhatsappMessage(message: Message): boolean {
  if (!WHATSAPP_MESSAGE_EDIT_UI_ENABLED) return false;
  if (message.direction !== "OUTBOUND") return false;
  if (message.sender_type !== "HUMAN") return false;
  if (message.ai_generated) return false;

  const contentType = (message.content_type ?? "text").toLowerCase();
  if (contentType !== "text") return false;

  const status = resolveWhatsappDeliveryStatus(message);
  if (status !== "sent") return false;
  if (!message.external_id) return false;
  if (getWhatsappEditRemainingMs(message) <= 0) return false;

  return true;
}

export function getWhatsappEditWindowLabel(message: Message): string {
  const remainingMs = getWhatsappEditRemainingMs(message);
  if (remainingMs <= 0) {
    return "La edición ya no está disponible (límite de 15 minutos en WhatsApp)";
  }

  const totalMinutes = Math.ceil(remainingMs / 60_000);
  if (totalMinutes >= 60) {
    return "Editar mensaje en WhatsApp (disponible durante 15 minutos desde el envío)";
  }

  return `Editar mensaje en WhatsApp (quedan ${totalMinutes} min)`;
}
