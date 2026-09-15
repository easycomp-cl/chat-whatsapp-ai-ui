import type { Message, MessageReaction } from "@/types/database.types";
import { normalizeTimestampString } from "@/lib/format-datetime";
import { stripWhatsAppFormatting } from "@/lib/conversations/whatsapp-formatting";
import { parseMessageInteractive, summarizeInteractiveMessage, resolveMessageInteractive } from "@/lib/conversations/interactive-message";
import {
  EMPTY_MESSAGE_MEDIA,
  enrichMessageMedia,
  isAudioContentTextNoise,
  isAudioContentType,
  isDocumentContentType,
  isImageContentType,
  isInteractiveContentType,
  isTemplateContentType,
  parseMessageMedia,
} from "@/lib/conversations/message-media";

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
  return enrichMessageMedia({
    ...raw,
    created_at: normalizeTimestampString(raw.created_at),
    customer_edited_at: raw.customer_edited_at
      ? normalizeTimestampString(raw.customer_edited_at)
      : raw.customer_edited_at,
    customer_revoked_at: raw.customer_revoked_at
      ? normalizeTimestampString(raw.customer_revoked_at)
      : raw.customer_revoked_at,
    media: raw.media ? parseMessageMedia(raw.media) : EMPTY_MESSAGE_MEDIA,
    audio_transcript: (raw.audio_transcript ?? null) as string | null,
    interactive: parseMessageInteractive(raw.interactive),
    reactions: parseReactions(raw.reactions).map((reaction) => ({
      ...reaction,
      created_at: normalizeTimestampString(reaction.created_at),
    })),
  });
}

export function normalizeMessages(raw: Message[]): Message[] {
  return raw
    .map(normalizeMessage)
    .filter((m) => !isReactionOnlyMessage(m));
}

export function getReplyPreviewText(message: Message): string {
  if (isImageContentType(message.content_type)) {
    const caption = stripWhatsAppFormatting(message.content_text?.trim() ?? "");
    if (caption && caption !== "[Imagen]") {
      return caption.length > 120 ? `${caption.slice(0, 120)}…` : caption;
    }
    return "📷 Imagen";
  }

  if (isDocumentContentType(message.content_type)) {
    const name = message.media?.filename?.trim();
    if (name) return `📄 ${name}`;
    const caption = stripWhatsAppFormatting(message.content_text?.trim() ?? "");
    if (caption && caption !== "[Documento]") {
      return caption.length > 120 ? `${caption.slice(0, 120)}…` : caption;
    }
    return "📄 Documento";
  }

  if (isInteractiveContentType(message.content_type)) {
    const interactive = resolveMessageInteractive(message);
    if (interactive) {
      const summary = summarizeInteractiveMessage(interactive);
      const preview = summary.length > 120 ? `${summary.slice(0, 120)}…` : summary;
      return `📋 ${preview}`;
    }
    const text = stripWhatsAppFormatting(message.content_text?.trim() ?? "");
    return text ? `📋 ${text}` : "📋 Opciones interactivas";
  }

  if (isTemplateContentType(message.content_type)) {
    const text = stripWhatsAppFormatting(message.content_text?.trim() ?? "");
    if (text) {
      const preview = text.length > 120 ? `${text.slice(0, 120)}…` : text;
      return `📄 ${preview}`;
    }
    return "📄 Plantilla";
  }

  if (isAudioContentType(message.content_type)) {
    const transcript =
      message.audio_transcript?.trim() ||
      (() => {
        const text = message.content_text?.trim() ?? "";
        if (isAudioContentTextNoise(text, message.media?.filename)) return "";
        return text;
      })();
    if (transcript) {
      const text = stripWhatsAppFormatting(transcript);
      const preview = text.length > 120 ? `${text.slice(0, 120)}…` : text;
      return `🎤 ${preview}`;
    }
    return "🎤 Audio";
  }

  const text = stripWhatsAppFormatting(message.content_text?.trim() ?? "");
  if (!text) return "Mensaje sin texto";
  return text.length > 120 ? `${text.slice(0, 120)}…` : text;
}
