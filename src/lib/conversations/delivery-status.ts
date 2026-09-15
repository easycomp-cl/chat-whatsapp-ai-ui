import type { Message } from "@/types/database.types";

/**
 * Estados alineados con los webhooks de Meta Cloud API:
 * sent → delivered → read (ver docs de status messages).
 */
export type WhatsappDeliveryStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export const PENDING_GRACE_MS = 20_000;
export const WHATSAPP_MESSAGE_EDIT_WINDOW_MS = 15 * 60 * 1000;

const STATUS_RANK: Record<WhatsappDeliveryStatus, number> = {
  pending: 0,
  failed: -1,
  sent: 1,
  delivered: 2,
  read: 3,
};

function normalizeRawDeliveryStatus(raw: string): WhatsappDeliveryStatus | null {
  const value = raw.trim().toLowerCase();
  if (value === "pending") return "pending";
  if (value === "failed") return "failed";
  if (value === "sent") return "sent";
  if (value === "delivered") return "delivered";
  if (value === "read") return "read";
  return null;
}

/** Elige el estado más avanzado (p. ej. read > delivered > sent). */
export function maxWhatsappDeliveryStatus(
  a: WhatsappDeliveryStatus,
  b: WhatsappDeliveryStatus
): WhatsappDeliveryStatus {
  return STATUS_RANK[a] >= STATUS_RANK[b] ? a : b;
}

export function mergeWhatsappDeliveryStatusString(
  current?: string | null,
  incoming?: string | null
): string | null | undefined {
  if (!incoming?.trim()) return current ?? null;
  if (!current?.trim()) return incoming;

  const normalizedCurrent = normalizeRawDeliveryStatus(current);
  const normalizedIncoming = normalizeRawDeliveryStatus(incoming);
  if (!normalizedCurrent) return incoming;
  if (!normalizedIncoming) return current;

  return maxWhatsappDeliveryStatus(normalizedCurrent, normalizedIncoming);
}

export function resolveWhatsappDeliveryStatus(
  message: Message
): WhatsappDeliveryStatus | null {
  if (message.direction !== "OUTBOUND") {
    return null;
  }

  const raw = message.whatsapp_delivery_status;
  const fromDb = raw ? normalizeRawDeliveryStatus(raw) : null;
  const ageMs = Date.now() - new Date(message.created_at).getTime();
  const pendingIsStale = Number.isFinite(ageMs) && ageMs >= PENDING_GRACE_MS;

  if (fromDb === "pending") {
    return pendingIsStale ? "failed" : "pending";
  }

  if (fromDb) {
    return fromDb;
  }

  if (message.external_id) {
    return "sent";
  }

  if (!pendingIsStale) {
    return "pending";
  }

  return "failed";
}

export function canResendWhatsappMessage(message: Message): boolean {
  const status = resolveWhatsappDeliveryStatus(message);
  return status === "failed";
}

export function getWhatsappDeliveryStatusLabel(
  status: WhatsappDeliveryStatus,
  message?: Pick<Message, "whatsapp_delivery_error_message" | "whatsapp_delivery_error_code">
): string {
  switch (status) {
    case "pending":
      return "Enviando a WhatsApp…";
    case "sent":
      return "Enviado";
    case "delivered":
      return "Entregado";
    case "read":
      return "Visto";
    case "failed": {
      const detail = message?.whatsapp_delivery_error_message?.trim();
      if (detail) return detail;
      const code = message?.whatsapp_delivery_error_code;
      if (code != null) return `No entregado (${code})`;
      return "No entregado";
    }
  }
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
  if (status !== "sent" && status !== "delivered" && status !== "read") return false;
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
