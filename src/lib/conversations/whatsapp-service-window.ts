import { latestInboundAt } from "@/lib/conversations/pending-activity";
import { parseAppDateTime } from "@/lib/format-datetime";
import type { Message } from "@/types/database.types";

/** Ventana de servicio al cliente (Customer Service Window) según Meta Cloud API. */
export const WHATSAPP_SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

export type WhatsappServiceWindowStatus = "open" | "closing" | "closed" | "unknown";

export type WhatsappServiceWindowState = {
  status: WhatsappServiceWindowStatus;
  /** Último mensaje entrante del cliente usado para el cálculo. */
  lastCustomerMessageAt: string | null;
  /** Fin de la ventana (last inbound + 24 h). */
  expiresAt: string | null;
  /** Milisegundos restantes; 0 si cerrada o desconocida. */
  remainingMs: number;
  /** true si se puede enviar texto libre / media / interactivos de sesión. */
  canSendSessionMessage: boolean;
};

const CLOSING_THRESHOLD_MS = 60 * 60 * 1000;

export function resolveLastCustomerMessageAt(params: {
  messages: Message[];
  customerLastSeenAt?: string | null;
}): string | null {
  const fromMessages = latestInboundAt(params.messages);
  if (fromMessages) {
    return parseAppDateTime(fromMessages).toISOString();
  }

  const fromCustomer = params.customerLastSeenAt?.trim();
  if (!fromCustomer) return null;

  return parseAppDateTime(fromCustomer).toISOString();
}

export function getWhatsappServiceWindowState(params: {
  messages: Message[];
  customerLastSeenAt?: string | null;
  now?: Date;
}): WhatsappServiceWindowState {
  const now = params.now ?? new Date();
  const lastCustomerMessageAt = resolveLastCustomerMessageAt(params);

  if (!lastCustomerMessageAt) {
    return {
      status: "unknown",
      lastCustomerMessageAt: null,
      expiresAt: null,
      remainingMs: 0,
      canSendSessionMessage: false,
    };
  }

  const expiresAtDate = new Date(
    parseAppDateTime(lastCustomerMessageAt).getTime() + WHATSAPP_SERVICE_WINDOW_MS
  );
  const remainingMs = Math.max(0, expiresAtDate.getTime() - now.getTime());

  if (remainingMs <= 0) {
    return {
      status: "closed",
      lastCustomerMessageAt,
      expiresAt: expiresAtDate.toISOString(),
      remainingMs: 0,
      canSendSessionMessage: false,
    };
  }

  return {
    status: remainingMs <= CLOSING_THRESHOLD_MS ? "closing" : "open",
    lastCustomerMessageAt,
    expiresAt: expiresAtDate.toISOString(),
    remainingMs,
    canSendSessionMessage: true,
  };
}

export function formatServiceWindowCountdown(remainingMs: number): string {
  const cappedMs = Math.min(Math.max(0, remainingMs), WHATSAPP_SERVICE_WINDOW_MS);
  const totalSeconds = Math.floor(cappedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function sessionWindowClosedMessage(status?: WhatsappServiceWindowStatus) {
  if (status === "unknown") {
    return "Este cliente aún no ha escrito por WhatsApp. Usa una plantilla aprobada para iniciar la conversación.";
  }
  return "La ventana de respuesta ya se cerró: pasaron más de 24 h desde el último mensaje del cliente. Usa una plantilla UTILITY o espera a que escriba.";
}

export function formatServiceWindowRemaining(remainingMs: number): string {
  if (remainingMs <= 0) return "0 min";

  const cappedMs = Math.min(remainingMs, WHATSAPP_SERVICE_WINDOW_MS);
  const totalMinutes = Math.ceil(cappedMs / 60_000);
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

export function formatServiceWindowClosedSince(expiresAt: string, now = new Date()): string {
  const closedMs = now.getTime() - parseAppDateTime(expiresAt).getTime();
  if (closedMs <= 0) return "recién";

  const totalMinutes = Math.floor(closedMs / 60_000);
  if (totalMinutes < 60) return `hace ${totalMinutes} min`;

  const hours = Math.floor(totalMinutes / 60);
  if (hours < 24) return `hace ${hours} h`;

  const days = Math.floor(hours / 24);
  return days === 1 ? "hace 1 día" : `hace ${days} días`;
}
