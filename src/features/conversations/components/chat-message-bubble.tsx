import { cn } from "@/lib/utils";
import { formatFullTime } from "@/lib/conversations/utils";
import {
  isInbound,
  isSystemMessage,
  resolveQuotedText,
} from "@/lib/conversations/message-display";
import { getLastReadAt } from "@/lib/conversations/last-read-storage";
import { isCustomerReaction, isUnreadInboundMessage } from "@/lib/conversations/pending-activity";
import { MessageQuotedBlock } from "@/features/conversations/components/message-quoted-block";
import {
  MessageReactions,
  hasCustomerReactions,
} from "@/features/conversations/components/message-reactions";
import type { Message } from "@/types/database.types";
import { Bot, CheckCheck, CornerUpLeft, User } from "lucide-react";

type ChatMessageBubbleProps = {
  message: Message;
  messageById: Map<string, Message>;
  conversationId: string;
  lastReadAt?: string;
  highlightUnread?: boolean;
  canReply?: boolean;
  onReply?: (message: Message) => void;
};

function hasUnreadReaction(
  message: Message,
  conversationId: string,
  lastReadAt?: string
) {
  const lastRead = lastReadAt ?? getLastReadAt(conversationId);
  const reactions = (message.reactions ?? []).filter(isCustomerReaction);
  if (reactions.length === 0) return false;
  if (!lastRead) return true;
  const readTime = new Date(lastRead).getTime();
  return reactions.some((r) => new Date(r.created_at).getTime() > readTime);
}

export function ChatMessageBubble({
  message,
  messageById,
  conversationId,
  lastReadAt,
  highlightUnread = false,
  canReply = false,
  onReply,
}: ChatMessageBubbleProps) {
  if (isSystemMessage(message)) {
    return (
      <div className="flex justify-center py-2">
        <div className="max-w-md rounded-lg border border-amber-200/80 bg-[#fff3cd] px-4 py-2 text-center text-xs text-[#54656f] shadow-sm">
          {message.content_text}
          <div className="mt-1 text-[10px] text-[#667781]">
            {formatFullTime(message.created_at)}
          </div>
        </div>
      </div>
    );
  }

  const inbound = isInbound(message);
  const isBot = message.sender_type === "BOT" || message.ai_generated;
  const isHuman = message.sender_type === "HUMAN";
  const quoted = resolveQuotedText(message, messageById);
  const reactions = message.reactions ?? [];
  const showReactions = hasCustomerReactions(reactions);
  const unreadReaction = highlightUnread && hasUnreadReaction(message, conversationId, lastReadAt);
  const unreadInbound =
    highlightUnread && isUnreadInboundMessage(message, conversationId, lastReadAt);

  return (
    <div
      className={cn(
        "group flex gap-2",
        inbound ? "justify-start" : "justify-end"
      )}
    >
      {inbound && (
        <div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#dfe5e7] text-[10px] font-semibold text-[#54656f]">
          C
        </div>
      )}
      <div className={cn("max-w-[75%]", !inbound && "order-first")}>
        {inbound && (
          <p className="mb-0.5 text-[11px] font-medium text-[#00a884]">Cliente</p>
        )}
        {!inbound && (
          <p
            className={cn(
              "mb-0.5 text-right text-[11px] font-medium",
              isHuman ? "text-[#00a884]" : "text-[#027eb5]"
            )}
          >
            {isHuman ? "Asesor humano" : isBot ? "Bot automático" : "Sistema"}
          </p>
        )}
        <div className={cn("relative", showReactions && "pb-2")}>
          <div
            className={cn(
              "relative rounded-lg px-3 py-1.5 text-sm shadow-sm",
              inbound
                ? cn(
                    "rounded-tl-none bg-white text-[#111b21]",
                    unreadInbound && "ring-2 ring-[#00a884]/40"
                  )
                : isHuman
                  ? "rounded-tr-none bg-[#d9fdd3] text-[#111b21]"
                  : "rounded-tr-none bg-[#e3f2fd] text-[#111b21] ring-1 ring-[#b3d9f2]/60",
              unreadReaction && "ring-2 ring-[#ff7a55]/50"
            )}
          >
            {canReply && onReply && (
              <button
                type="button"
                onClick={() => onReply(message)}
                className={cn(
                  "absolute top-1 rounded-full bg-white/90 p-1 text-[#667781] opacity-0 shadow-sm ring-1 ring-[#d1d7db] transition-opacity group-hover:opacity-100 hover:text-[#00a884]",
                  inbound ? "-right-8" : "-left-8"
                )}
                title="Responder citando este mensaje"
              >
                <CornerUpLeft className="size-3.5" />
              </button>
            )}
            {quoted && (
              <MessageQuotedBlock
                quotedText={quoted.text}
                quotedSenderType={quoted.senderType}
                inbound={inbound}
                unavailable={quoted.unavailable}
              />
            )}
            <p className="leading-relaxed whitespace-pre-wrap">{message.content_text}</p>
            <div
              className={cn(
                "mt-0.5 flex items-center gap-1 text-[10px] text-[#667781]",
                !inbound && "justify-end",
                showReactions && (inbound ? "pr-6" : "pl-6")
              )}
            >
              {isBot && !inbound && <Bot className="size-3 text-[#027eb5]" />}
              {isHuman && !inbound && <User className="size-3 text-[#00a884]" />}
              <span>{formatFullTime(message.created_at)}</span>
              {!inbound && (
                <CheckCheck
                  className={cn("size-3.5", isHuman ? "text-[#53bdeb]" : "text-[#8696a0]")}
                />
              )}
            </div>
          </div>
          <MessageReactions reactions={reactions} inbound={inbound} />
        </div>
      </div>
      {!inbound && (
        <div
          className={cn(
            "mt-1 flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white",
            isHuman ? "bg-[#00a884]" : "bg-[#027eb5]"
          )}
        >
          {isHuman ? "A" : "B"}
        </div>
      )}
    </div>
  );
}
