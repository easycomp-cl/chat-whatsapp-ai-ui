import type { Message, MessageReaction } from "@/types/database.types";
import { normalizeTimestampString } from "@/lib/format-datetime";
import { stripWhatsAppFormatting } from "@/lib/conversations/whatsapp-formatting";

export const QUOTED_UNAVAILABLE = "[Mensaje no disponible]";

export function isSystemMessage(msg: Message) {
  return msg.sender_type === "SYSTEM";
}

export function isInbound(msg: Message) {
  return msg.direction === "INBOUND";
}

export function isReactionOnlyMessage(msg: Message) {
  return msg.content_type?.toLowerCase() === "reaction";
}

export function isQuotedUnavailable(text: string) {
  return text.trim() === QUOTED_UNAVAILABLE;
}

export function resolveQuotedText(
  message: Message,
  messageById: Map<string, Message>
): { text: string; senderType?: string | null; unavailable?: boolean } | null {
  if (message.quoted_text?.trim()) {
    const text = message.quoted_text.trim();
    return {
      text,
      senderType: message.quoted_sender_type,
      unavailable: isQuotedUnavailable(text),
    };
  }

  if (!message.reply_to_message_id) return null;

  const parent = messageById.get(message.reply_to_message_id);
  if (!parent?.content_text?.trim()) {
    return { text: QUOTED_UNAVAILABLE, senderType: null, unavailable: true };
  }

  return {
    text: parent.content_text.trim(),
    senderType: parent.sender_type,
  };
}

export function buildMessageMap(messages: Message[]): Map<string, Message> {
  return new Map(messages.map((m) => [m.id, m]));
}

export function parseReactions(raw: unknown): MessageReaction[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as MessageReaction[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as MessageReaction[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function normalizeMessage(raw: Message): Message {
  return {
    ...raw,
    created_at: normalizeTimestampString(raw.created_at),
    customer_edited_at: raw.customer_edited_at
      ? normalizeTimestampString(raw.customer_edited_at)
      : raw.customer_edited_at,
    customer_revoked_at: raw.customer_revoked_at
      ? normalizeTimestampString(raw.customer_revoked_at)
      : raw.customer_revoked_at,
    reactions: parseReactions(raw.reactions).map((reaction) => ({
      ...reaction,
      created_at: normalizeTimestampString(reaction.created_at),
    })),
  };
}

export function normalizeMessages(raw: Message[]): Message[] {
  return raw
    .map(normalizeMessage)
    .filter((m) => !isReactionOnlyMessage(m));
}

export function getReplyPreviewText(message: Message): string {
  const text = stripWhatsAppFormatting(message.content_text?.trim() ?? "");
  if (!text) return "Mensaje sin texto";
  return text.length > 120 ? `${text.slice(0, 120)}…` : text;
}
