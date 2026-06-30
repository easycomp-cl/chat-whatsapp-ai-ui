import { normalizeMessage, normalizeMessages } from "@/lib/conversations/message-display";
import type { Message } from "@/types/database.types";

function sortByCreatedAt(messages: Message[]) {
  return [...messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export function isOptimisticMessage(message: Message) {
  return message.id.startsWith("optimistic-");
}

export function mergeServerWithLocal(server: Message[], local: Message[]): Message[] {
  const normalizedServer = normalizeMessages(server);
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
  const localConfirmed = local.filter(
    (m) => !isOptimisticMessage(m) && !serverIds.has(m.id)
  );

  return sortByCreatedAt(
    normalizeMessages([...normalizedServer, ...localConfirmed, ...pendingOptimistic])
  );
}

export function mapApiMessageToMessage(
  raw: Record<string, unknown>,
  fallback: { conversationId: string; businessId: string }
): Message {
  return normalizeMessage({
    id: String(raw.id ?? `api-${Date.now()}`),
    conversation_id: String(raw.conversation_id ?? raw.conversationId ?? fallback.conversationId),
    business_id: String(raw.business_id ?? raw.tenantId ?? fallback.businessId),
    direction: String(raw.direction ?? "OUTBOUND"),
    sender_type: String(raw.sender_type ?? raw.senderType ?? "HUMAN"),
    content_text: String(raw.content_text ?? raw.contentText ?? ""),
    content_type: (raw.content_type ?? raw.contentType ?? "TEXT") as string,
    external_id: (raw.external_id ?? raw.externalId ?? null) as string | null,
    ai_generated: Boolean(raw.ai_generated ?? raw.aiGenerated ?? false),
    created_at: String(raw.created_at ?? raw.createdAt ?? new Date().toISOString()),
    reply_to_message_id: (raw.reply_to_message_id ?? raw.replyToMessageId ?? null) as
      | string
      | null,
    quoted_text: (raw.quoted_text ?? raw.quotedText ?? null) as string | null,
    quoted_sender_type: (raw.quoted_sender_type ?? raw.quotedSenderType ?? null) as
      | string
      | null,
    reactions: [],
  });
}
