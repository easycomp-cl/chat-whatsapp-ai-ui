"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatFullTime } from "@/lib/conversations/utils";
import {
  isInbound,
  isSystemMessage,
  resolveQuotedText,
} from "@/lib/conversations/message-display";
import { getLastReadAt } from "@/lib/conversations/last-read-storage";
import { isCustomerReaction, isUnreadInboundMessage } from "@/lib/conversations/pending-activity";
import {
  WHATSAPP_MESSAGE_EDIT_UI_ENABLED,
  canEditWhatsappMessage,
  getWhatsappEditWindowLabel,
} from "@/lib/conversations/delivery-status";
import { MessageQuotedBlock } from "@/features/conversations/components/message-quoted-block";
import {
  MessageReactions,
  hasCustomerReactions,
} from "@/features/conversations/components/message-reactions";
import { MessageDeliveryStatus } from "@/features/conversations/components/message-delivery-status";
import { MessageEditableText } from "@/features/conversations/components/message-editable-text";
import { WhatsAppFormattedText } from "@/features/conversations/components/whatsapp-formatted-text";
import { MessageCustomerChangeBadge } from "@/features/conversations/components/message-customer-change-badge";
import {
  getMessageDisplayText,
  isCustomerRevokedMessage,
} from "@/lib/conversations/customer-message-change";
import type { Message } from "@/types/database.types";
import { Bot, CornerUpLeft, Pencil, User } from "lucide-react";

type ChatMessageBubbleProps = {
  message: Message;
  messageById: Map<string, Message>;
  conversationId: string;
  customerDisplayName?: string;
  lastReadAt?: string;
  highlightUnread?: boolean;
  canReply?: boolean;
  onReply?: (message: Message) => void;
  onResent?: () => void;
  onEdited?: () => void;
  showCustomerMessageAudit?: boolean;
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

function MessageBody({
  message,
  conversationId,
  isHuman,
  inbound,
  isEditing,
  onEditingChange,
  onEdited,
  showCustomerMessageAudit = false,
}: {
  message: Message;
  conversationId: string;
  isHuman: boolean;
  inbound: boolean;
  isEditing: boolean;
  onEditingChange: (editing: boolean) => void;
  onEdited?: () => void;
  showCustomerMessageAudit?: boolean;
}) {
  if (WHATSAPP_MESSAGE_EDIT_UI_ENABLED && isHuman && !inbound) {
    return (
      <MessageEditableText
        message={message}
        conversationId={conversationId}
        isEditing={isEditing}
        onEditingChange={onEditingChange}
        onEdited={onEdited}
      />
    );
  }

  return (
    <>
      <p
        className={cn(
          "leading-relaxed whitespace-pre-wrap",
          showCustomerMessageAudit &&
            isCustomerRevokedMessage(message) &&
            "text-[#667781] line-through decoration-[#ea0038]/50"
        )}
      >
        <WhatsAppFormattedText text={getMessageDisplayText(message, showCustomerMessageAudit)} />
      </p>
      {inbound && (
        <MessageCustomerChangeBadge
          message={message}
          showAudit={showCustomerMessageAudit}
        />
      )}
    </>
  );
}

export function ChatMessageBubble({
  message,
  messageById,
  conversationId,
  customerDisplayName = "Cliente",
  lastReadAt,
  highlightUnread = false,
  canReply = false,
  onReply,
  onResent,
  onEdited,
  showCustomerMessageAudit = false,
}: ChatMessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [canEdit, setCanEdit] = useState(
    () => WHATSAPP_MESSAGE_EDIT_UI_ENABLED && canEditWhatsappMessage(message)
  );
  const messageRef = useRef(message);
  messageRef.current = message;

  useEffect(() => {
    if (!WHATSAPP_MESSAGE_EDIT_UI_ENABLED) return;
    setIsEditing(false);
  }, [message.id]);

  useEffect(() => {
    if (!WHATSAPP_MESSAGE_EDIT_UI_ENABLED) return;

    const syncCanEdit = () => setCanEdit(canEditWhatsappMessage(messageRef.current));
    syncCanEdit();
    const interval = window.setInterval(syncCanEdit, 30_000);
    return () => window.clearInterval(interval);
  }, [message.id]);

  if (isSystemMessage(message)) {
    return (
      <div className="flex justify-center py-2">
        <div className="max-w-md rounded-lg border border-amber-200/80 bg-[#fff3cd] px-4 py-2 text-center text-xs text-[#54656f] shadow-sm">
          <WhatsAppFormattedText text={message.content_text} />
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
  const showEdit =
    WHATSAPP_MESSAGE_EDIT_UI_ENABLED && isHuman && !inbound && canEdit && !isEditing;
  const showReply =
    canReply && onReply && (!WHATSAPP_MESSAGE_EDIT_UI_ENABLED || !isEditing);

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
          <p className="mb-0.5 text-[11px] font-medium text-[#00a884]">{customerDisplayName}</p>
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
            {(showReply || showEdit) && (
              <div
                className={cn(
                  "absolute top-1 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100",
                  inbound ? "-right-8" : "-left-8"
                )}
              >
                {showEdit && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    onMouseDown={(event) => event.preventDefault()}
                    className="rounded-full bg-white/90 p-1 text-[#667781] shadow-sm ring-1 ring-[#d1d7db] hover:text-[#00a884]"
                    title={getWhatsappEditWindowLabel(message)}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                )}
                {showReply && (
                  <button
                    type="button"
                    onClick={() => onReply(message)}
                    className="rounded-full bg-white/90 p-1 text-[#667781] shadow-sm ring-1 ring-[#d1d7db] hover:text-[#00a884]"
                    title="Responder citando este mensaje"
                  >
                    <CornerUpLeft className="size-3.5" />
                  </button>
                )}
              </div>
            )}
            {quoted && (
              <MessageQuotedBlock
                quotedText={quoted.text}
                quotedSenderType={quoted.senderType}
                inbound={inbound}
                unavailable={quoted.unavailable}
                customerDisplayName={customerDisplayName}
              />
            )}
            <MessageBody
              message={message}
              conversationId={conversationId}
              isHuman={isHuman}
              inbound={inbound}
              isEditing={isEditing}
              onEditingChange={setIsEditing}
              onEdited={onEdited}
              showCustomerMessageAudit={showCustomerMessageAudit}
            />
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
                <MessageDeliveryStatus
                  message={message}
                  conversationId={conversationId}
                  isHuman={isHuman}
                  onResent={onResent}
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
