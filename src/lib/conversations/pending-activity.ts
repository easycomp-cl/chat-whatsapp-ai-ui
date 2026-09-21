import { getLastReadAt } from "@/lib/conversations/last-read-storage";
import { parseReactions } from "@/lib/conversations/message-display";
import { isSystemChatMessage } from "@/lib/conversations/system-event";
import type { Message, MessageReaction } from "@/types/database.types";

export function latestInboundAt(messages: Message[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].direction === "INBOUND" && !isSystemChatMessage(messages[i])) {
      return messages[i].created_at;
    }
  }
  return null;
}

export function latestCustomerReactionAt(messages: Message[]): string | null {
  let latest: string | null = null;

  for (const msg of messages) {
    for (const reaction of msg.reactions ?? []) {
      if (!isCustomerReaction(reaction)) continue;
      if (!latest || new Date(reaction.created_at) > new Date(latest)) {
        latest = reaction.created_at;
      }
    }
  }

  return latest;
}

export function latestPendingActivityAt(messages: Message[]): string | null {
  const inbound = latestInboundAt(messages);
  const reaction = latestCustomerReactionAt(messages);
  if (!inbound) return reaction;
  if (!reaction) return inbound;
  return new Date(inbound) > new Date(reaction) ? inbound : reaction;
}

export function isCustomerReaction(reaction: MessageReaction) {
  return reaction.sender_type === "CUSTOMER" && Boolean(reaction.emoji);
}

export function isUnreadActivity(activityAt: string, lastRead: string | undefined) {
  if (!lastRead) return true;
  return new Date(activityAt) > new Date(lastRead);
}

export function hasUnreadCustomerReactions(
  messages: Message[],
  conversationId: string,
  lastRead?: string
) {
  const readAt = lastRead ?? getLastReadAt(conversationId);
  if (!readAt) {
    return messages.some((m) => (m.reactions ?? []).some(isCustomerReaction));
  }
  const readTime = new Date(readAt).getTime();
  return messages.some((m) =>
    (m.reactions ?? []).some(
      (r) => isCustomerReaction(r) && new Date(r.created_at).getTime() > readTime
    )
  );
}

export function laterTimestamp(a: string, b: string): string {
  return new Date(a) >= new Date(b) ? a : b;
}

export function getLatestSeenTimestamp(messages: Message[]): string | null {
  const lastMessageAt = messages.at(-1)?.created_at;
  const reactionAt = latestCustomerReactionAt(messages);
  if (lastMessageAt && reactionAt) {
    return laterTimestamp(lastMessageAt, reactionAt);
  }
  return lastMessageAt ?? reactionAt ?? null;
}

export function hasUnreadCustomerActivity(
  messages: Message[],
  lastRead?: string
): boolean {
  return countUnreadCustomerActivity(messages, lastRead) > 0;
}

export function countUnreadCustomerActivity(
  messages: Message[],
  lastRead?: string
): number {
  if (!lastRead) {
    let count = 0;
    for (const msg of messages) {
      if (msg.direction === "INBOUND" && !isSystemChatMessage(msg)) count++;
      for (const reaction of msg.reactions ?? []) {
        if (isCustomerReaction(reaction)) count++;
      }
    }
    return count;
  }

  const readTime = new Date(lastRead).getTime();
  let count = 0;

  for (const msg of messages) {
    if (
      msg.direction === "INBOUND" &&
      !isSystemChatMessage(msg) &&
      new Date(msg.created_at).getTime() > readTime
    ) {
      count++;
    }
    for (const reaction of msg.reactions ?? []) {
      if (
        isCustomerReaction(reaction) &&
        new Date(reaction.created_at).getTime() > readTime
      ) {
        count++;
      }
    }
  }

  return count;
}

export function isUnreadInboundMessage(
  message: Message,
  conversationId: string,
  lastRead?: string
): boolean {
  if (isSystemChatMessage(message) || message.direction !== "INBOUND") return false;
  const readAt = lastRead ?? getLastReadAt(conversationId);
  if (!readAt) return true;
  return new Date(message.created_at).getTime() > new Date(readAt).getTime();
}

export function findFirstPendingActivity(
  messages: Message[],
  conversationId: string
): Message | undefined {
  const lastRead = getLastReadAt(conversationId);
  if (!lastRead) return undefined;

  const readTime = new Date(lastRead).getTime();

  return messages.find((msg) => {
    if (isSystemChatMessage(msg)) {
      return (msg.reactions ?? []).some(
        (r) => isCustomerReaction(r) && new Date(r.created_at).getTime() > readTime
      );
    }
    if (new Date(msg.created_at).getTime() > readTime) return true;
    return (msg.reactions ?? []).some(
      (r) => isCustomerReaction(r) && new Date(r.created_at).getTime() > readTime
    );
  });
}

export function mergeConversationActivity(
  activityByConversation: Map<string, string>,
  conversationId: string,
  activityAt: string
) {
  const current = activityByConversation.get(conversationId);
  if (!current || new Date(activityAt) > new Date(current)) {
    activityByConversation.set(conversationId, activityAt);
  }
}

export function collectActivityFromMessages(messages: Array<{
  conversation_id: string;
  direction?: string;
  created_at: string;
  reactions?: unknown;
  sender_type?: string | null;
  content_type?: string | null;
}>) {
  const map = new Map<string, string>();

  for (const msg of messages) {
    if (isSystemChatMessage(msg)) continue;
    if (msg.direction === "INBOUND") {
      mergeConversationActivity(map, msg.conversation_id, msg.created_at);
    }
    for (const reaction of parseReactions(msg.reactions)) {
      if (isCustomerReaction(reaction)) {
        mergeConversationActivity(map, msg.conversation_id, reaction.created_at);
      }
    }
  }

  return map;
}
