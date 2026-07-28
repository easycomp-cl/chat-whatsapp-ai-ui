import type { Message } from "@/types/database.types";
import { normalizeTimestampString } from "@/lib/format-datetime";

export const CUSTOMER_REVOKED_MESSAGE_TEXT = "Mensaje eliminado por el usuario";

export function isCustomerRevokedMessage(message: Message) {
  return Boolean(message.customer_revoked_at);
}

export function isCustomerEditedMessage(message: Message) {
  return Boolean(message.customer_edited_at) && !isCustomerRevokedMessage(message);
}

export function getCustomerRevokedSnapshot(message: Message) {
  const snapshot = message.content_text_snapshot?.trim();
  if (!snapshot || snapshot === CUSTOMER_REVOKED_MESSAGE_TEXT) return null;
  return snapshot;
}

export function getCustomerEditedOriginalText(message: Message) {
  const snapshot = message.content_text_snapshot?.trim();
  if (!snapshot) return null;
  if (snapshot === message.content_text.trim()) return null;
  return snapshot;
}

/** Texto principal visible en el chat del dashboard. */
export function getMessageDisplayText(message: Message, showAudit: boolean) {
  if (showAudit && isCustomerRevokedMessage(message)) {
    return getCustomerRevokedSnapshot(message) ?? CUSTOMER_REVOKED_MESSAGE_TEXT;
  }
  return message.content_text;
}

export function formatCustomerChangeTime(value?: string | null) {
  if (!value) return null;
  return normalizeTimestampString(value);
}
