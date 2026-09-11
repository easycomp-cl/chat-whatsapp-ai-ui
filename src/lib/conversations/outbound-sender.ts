import { formatProfileDisplayName } from "@/lib/profile/display-name";
import type { Message } from "@/types/database.types";

export type OutboundSenderContext = {
  userId: string;
  displayName: string;
  senderNameByUserId: Record<string, string>;
};

export function resolveHumanSenderLabel(
  message: Message,
  senderNameByUserId: Record<string, string>,
  fallback = "Usuario"
): string {
  const explicit = message.sender_display_name?.trim();
  if (explicit) return explicit;

  const userId = message.sender_user_id?.trim();
  if (userId) {
    const fromMap = senderNameByUserId[userId]?.trim();
    if (fromMap) return fromMap;
  }

  return fallback;
}

export function resolveAiAgentSenderLabel(botName?: string | null): string {
  const name = botName?.trim();
  if (!name) return "Agente IA";
  return `${name} (Agente IA)`;
}

export function resolveAiAgentAvatarInitial(botName?: string | null): string {
  const name = botName?.trim();
  return name ? name.charAt(0).toUpperCase() : "A";
}

export function stampOutboundSender(
  message: Message,
  sender?: OutboundSenderContext | null
): Message {
  if (!sender || message.direction !== "OUTBOUND" || message.sender_type !== "HUMAN") {
    return message;
  }
  if (message.sender_display_name?.trim() && message.sender_user_id?.trim()) {
    return message;
  }
  return {
    ...message,
    sender_user_id: message.sender_user_id ?? sender.userId,
    sender_display_name: message.sender_display_name ?? sender.displayName,
  };
}

export function outboundSenderFromProfile(
  profile: {
    user_id: string;
    first_name?: string | null;
    last_name?: string | null;
    full_name?: string | null;
  },
  teamProfiles: Array<{
    user_id: string;
    first_name?: string | null;
    last_name?: string | null;
    full_name?: string | null;
  }>
): OutboundSenderContext {
  const senderNameByUserId: Record<string, string> = {};
  for (const member of teamProfiles) {
    senderNameByUserId[member.user_id] = formatProfileDisplayName(member);
  }

  return {
    userId: profile.user_id,
    displayName: formatProfileDisplayName(profile),
    senderNameByUserId,
  };
}
