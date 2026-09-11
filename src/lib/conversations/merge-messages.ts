import { normalizeMessage, normalizeMessages } from "@/lib/conversations/message-display";
import { parseMessageInteractive, resolveMessageInteractive } from "@/lib/conversations/interactive-message";
import { parseMessageMedia, enrichMessageMedia, pickBestMessageMedia } from "@/lib/conversations/message-media";
import { mergeWhatsappDeliveryStatusString } from "@/lib/conversations/delivery-status";
import type { Message } from "@/types/database.types";

function sortByCreatedAt(messages: Message[]) {
  return [...messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export function isOptimisticMessage(message: Message) {
  return message.id.startsWith("optimistic-");
}

export function mergeOutboundMessage(local: Message, server: Message): Message {
  return normalizeMessage({
    ...local,
    ...server,
    whatsapp_delivery_status:
      mergeWhatsappDeliveryStatusString(
        local.whatsapp_delivery_status,
        server.whatsapp_delivery_status
      ) ?? server.whatsapp_delivery_status,
    external_id: server.external_id ?? local.external_id,
    media: pickBestMessageMedia(server, local),
    _local_preview_url: local._local_preview_url,
    sender_user_id: server.sender_user_id ?? local.sender_user_id ?? null,
    sender_display_name: server.sender_display_name ?? local.sender_display_name ?? null,
    whatsapp_delivery_error_code:
      server.whatsapp_delivery_error_code ?? local.whatsapp_delivery_error_code ?? null,
    whatsapp_delivery_error_message:
      server.whatsapp_delivery_error_message ?? local.whatsapp_delivery_error_message ?? null,
    interactive:
      parseMessageInteractive(server.interactive) ??
      resolveMessageInteractive(server) ??
      local.interactive ??
      null,
  });
}

export function mergeServerMessageWithLocal(server: Message, prev?: Message): Message {
  if (!prev) return enrichMessageMedia(server);
  return normalizeMessage({
    ...server,
    media: pickBestMessageMedia(server, prev),
    _local_preview_url: prev._local_preview_url,
    sender_user_id: server.sender_user_id ?? prev.sender_user_id ?? null,
    sender_display_name: server.sender_display_name ?? prev.sender_display_name ?? null,
    interactive:
      parseMessageInteractive(server.interactive) ??
      resolveMessageInteractive(server) ??
      prev.interactive ??
      null,
  });
}

export function mergeServerWithLocal(
  server: Message[],
  local: Message[],
  options?: { authoritative?: boolean }
): Message[] {
  const localById = new Map(local.map((m) => [m.id, m]));
  const normalizedServer = normalizeMessages(server).map((serverMsg) => {
    const prev = localById.get(serverMsg.id);
    return prev ? mergeServerMessageWithLocal(serverMsg, prev) : enrichMessageMedia(serverMsg);
  });
  const serverOutboundTexts = new Set(
    normalizedServer
      .filter((m) => m.direction === "OUTBOUND")
      .map((m) => m.content_text.trim())
  );

  const pendingOptimistic = local.filter(
    (m) =>
      isOptimisticMessage(m) &&
      !serverOutboundTexts.has(m.content_text.trim())
  );

  const serverIds = new Set(normalizedServer.map((m) => m.id));
  const localConfirmed = options?.authoritative
    ? []
    : local.filter((m) => !isOptimisticMessage(m) && !serverIds.has(m.id));

  return sortByCreatedAt(
    normalizeMessages([...normalizedServer, ...localConfirmed, ...pendingOptimistic])
  );
}

export function mapApiMessageToMessage(
  raw: Record<string, unknown>,
  fallback: { conversationId: string; businessId: string }
): Message {
  const content_text = String(raw.content_text ?? raw.contentText ?? "");
  const content_type = (raw.content_type ?? raw.contentType ?? "TEXT") as string;
  const parsedInteractive = parseMessageInteractive(
    raw.interactive ??
      (raw.raw_payload_json as Record<string, unknown> | undefined)?.interactive ??
      (raw.rawPayloadJson as Record<string, unknown> | undefined)?.interactive ??
      (raw.raw_payload_json as Record<string, unknown> | undefined)?.outbound ??
      (raw.rawPayloadJson as Record<string, unknown> | undefined)?.outbound
  );

  return normalizeMessage({
    id: String(raw.id ?? `api-${Date.now()}`),
    conversation_id: String(raw.conversation_id ?? raw.conversationId ?? fallback.conversationId),
    business_id: String(raw.business_id ?? raw.tenantId ?? fallback.businessId),
    direction: String(raw.direction ?? "OUTBOUND"),
    sender_type: String(raw.sender_type ?? raw.senderType ?? "HUMAN"),
    content_text,
    content_type,
    external_id: (raw.external_id ?? raw.externalId ?? null) as string | null,
    whatsapp_delivery_status: (raw.whatsapp_delivery_status ??
      raw.whatsappDeliveryStatus ??
      null) as string | null,
    whatsapp_delivery_error_code: (raw.whatsapp_delivery_error_code ??
      raw.whatsappDeliveryErrorCode ??
      null) as number | null,
    whatsapp_delivery_error_message: (raw.whatsapp_delivery_error_message ??
      raw.whatsappDeliveryErrorMessage ??
      null) as string | null,
    ai_generated: Boolean(raw.ai_generated ?? raw.aiGenerated ?? false),
    created_at: String(raw.created_at ?? raw.createdAt ?? new Date().toISOString()),
    reply_to_message_id: (raw.reply_to_message_id ?? raw.replyToMessageId ?? null) as
      | string
      | null,
    quoted_text: (raw.quoted_text ?? raw.quotedText ?? null) as string | null,
    quoted_sender_type: (raw.quoted_sender_type ?? raw.quotedSenderType ?? null) as
      | string
      | null,
    content_text_snapshot: (raw.content_text_snapshot ?? raw.contentTextSnapshot ?? null) as
      | string
      | null,
    customer_edited_at: (raw.customer_edited_at ?? raw.customerEditedAt ?? null) as string | null,
    customer_revoked_at: (raw.customer_revoked_at ?? raw.customerRevokedAt ?? null) as string | null,
    audio_transcript: (raw.audio_transcript ?? raw.audioTranscript ?? null) as string | null,
    interactive:
      parsedInteractive ??
      resolveMessageInteractive({ content_text, content_type, interactive: parsedInteractive }) ??
      null,
    sender_user_id: (raw.sender_user_id ?? raw.senderUserId ?? raw.sent_by_user_id ?? raw.sentByUserId ?? null) as
      | string
      | null,
    sender_display_name: (raw.sender_display_name ??
      raw.senderDisplayName ??
      raw.sent_by_name ??
      raw.sentByName ??
      null) as string | null,
    media: parseMessageMedia(raw.media),
    reactions: [],
  });
}
