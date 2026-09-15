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
import { ChatMediaDocument, ChatMediaImage } from "@/features/conversations/components/chat-media-preview";
import { ChatInteractiveMessage } from "@/features/conversations/components/chat-interactive-message";
import { ChatAudioPlayer } from "@/features/conversations/components/chat-audio-player";
import { MessageCustomerChangeBadge } from "@/features/conversations/components/message-customer-change-badge";
import { ConversationAvatar } from "@/features/conversations/components/conversation-avatar";
import {
  getMessageDisplayText,
  isCustomerRevokedMessage,
} from "@/lib/conversations/customer-message-change";
import { parseMessageInteractive, isInteractivePreviewMessage, resolveMessageInteractive, isInteractiveReplySelection, findCustomerSelectionForInteractive } from "@/lib/conversations/interactive-message";
import {
  EMPTY_MESSAGE_MEDIA,
  getAudioTranscriptText,
  getMediaCaption,
  isAudioContentType,
  isAudioPendingTranscript,
  isDocumentContentType,
  isImageContentType,
  isInteractiveContentType,
  isMediaMessage,
  isTemplateContentType,
  mayHaveRemoteMedia,
} from "@/lib/conversations/message-media";
import {
  resolveAiAgentAvatarInitial,
  resolveAiAgentSenderLabel,
  resolveHumanSenderLabel,
  type OutboundSenderContext,
} from "@/lib/conversations/outbound-sender";
import type { Message } from "@/types/database.types";
import { Bot, CornerUpLeft, Pencil, User } from "lucide-react";

type ChatMessageBubbleProps = {
  message: Message;
  messageById: Map<string, Message>;
  conversationId: string;
  customerDisplayName?: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerAvatarSeed?: string;
  lastReadAt?: string;
  highlightUnread?: boolean;
  canReply?: boolean;
  onReply?: (message: Message) => void;
  onResent?: () => void;
  onRetryFailed?: (message: Message) => void;
  onEdited?: () => void;
  showCustomerMessageAudit?: boolean;
  outboundSender?: OutboundSenderContext;
  botAgentName?: string | null;
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
  messageById,
  conversationId,
  isHuman,
  inbound,
  isEditing,
  onEditingChange,
  onEdited,
  showCustomerMessageAudit = false,
}: {
  message: Message;
  messageById: Map<string, Message>;
  conversationId: string;
  isHuman: boolean;
  inbound: boolean;
  isEditing: boolean;
  onEditingChange: (editing: boolean) => void;
  onEdited?: () => void;
  showCustomerMessageAudit?: boolean;
}) {
  const media = message.media ?? EMPTY_MESSAGE_MEDIA;
  const caption = getMediaCaption(message);
  const showMedia = isMediaMessage(message);
  const canLoadRemoteMedia = mayHaveRemoteMedia(message);
  const audioTranscript = getAudioTranscriptText(message);
  const audioPending = isAudioPendingTranscript(message);
  const parentMessage = message.reply_to_message_id
    ? messageById.get(message.reply_to_message_id)
    : undefined;
  const displayText = getMessageDisplayText(message, showCustomerMessageAudit);
  const isInteractiveSelection =
    inbound && isInteractiveReplySelection(displayText, parentMessage);

  if (isInteractiveContentType(message.content_type) || resolveMessageInteractive(message)) {
    const interactive = resolveMessageInteractive(message);
    const customerSelection =
      !inbound && interactive
        ? findCustomerSelectionForInteractive(message.id, messageById, message)
        : null;

    return (
      <>
        {interactive ? (
          <ChatInteractiveMessage
            interactive={interactive}
            inbound={inbound}
            isLocalPreview={isInteractivePreviewMessage(message)}
            customerSelection={customerSelection}
          />
        ) : (
          <p className="leading-relaxed whitespace-pre-wrap wrap-anywhere">
            <WhatsAppFormattedText text={getMessageDisplayText(message, showCustomerMessageAudit)} />
          </p>
        )}
        {inbound && (
          <MessageCustomerChangeBadge
            message={message}
            showAudit={showCustomerMessageAudit}
          />
        )}
      </>
    );
  }

  if (showMedia) {
    return (
      <>
        {isImageContentType(message.content_type) ? (
          <ChatMediaImage
            messageId={message.id}
            hasMedia={canLoadRemoteMedia}
            localPreviewUrl={message._local_preview_url}
            alt={caption ?? "Imagen"}
          />
        ) : isAudioContentType(message.content_type) ? (
          <ChatAudioPlayer
            messageId={message.id}
            hasMedia={canLoadRemoteMedia}
            localPreviewUrl={message._local_preview_url}
          />
        ) : isDocumentContentType(message.content_type) ? (
          <ChatMediaDocument
            messageId={message.id}
            hasMedia={canLoadRemoteMedia}
            filename={media.filename}
            fileSize={media.file_size}
            mimeType={media.mime_type}
          />
        ) : null}
        {isAudioContentType(message.content_type) &&
          (audioTranscript || audioPending) &&
          (audioTranscript ? (
            <div className="mt-1.5 space-y-0.5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-[#667781]">
                Transcripción
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-anywhere text-[#54656f]">
                <WhatsAppFormattedText text={audioTranscript} />
              </p>
            </div>
          ) : (
            <p className="mt-1 text-xs text-[#667781]">Transcribiendo…</p>
          ))}
        {caption && (
          <p className="mt-1.5 leading-relaxed whitespace-pre-wrap wrap-anywhere">
            <WhatsAppFormattedText text={caption} />
          </p>
        )}
        {inbound && (
          <MessageCustomerChangeBadge
            message={message}
            showAudit={showCustomerMessageAudit}
          />
        )}
      </>
    );
  }

  if (isTemplateContentType(message.content_type)) {
    return (
      <>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#667781]">
          Plantilla
        </p>
        <p className="leading-relaxed whitespace-pre-wrap wrap-anywhere">
          <WhatsAppFormattedText text={displayText} />
        </p>
      </>
    );
  }

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
          "leading-relaxed whitespace-pre-wrap wrap-anywhere",
          isInteractiveSelection && "font-medium text-[#00a884]",
          showCustomerMessageAudit &&
            isCustomerRevokedMessage(message) &&
            "text-[#667781] line-through decoration-[#ea0038]/50"
        )}
      >
        <WhatsAppFormattedText text={displayText} />
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
  customerName,
  customerPhone,
  customerAvatarSeed = "customer",
  lastReadAt,
  highlightUnread = false,
  canReply = false,
  onReply,
  onResent,
  onRetryFailed,
  onEdited,
  showCustomerMessageAudit = false,
  outboundSender,
  botAgentName,
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
        <div className="max-w-md min-w-0 overflow-hidden rounded-lg border border-amber-200/80 bg-[#fff3cd] px-4 py-2 text-center text-xs wrap-anywhere text-[#54656f] shadow-sm">
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
  const humanSenderLabel = isHuman
    ? resolveHumanSenderLabel(message, outboundSender?.senderNameByUserId ?? {})
    : null;
  const humanAvatarInitial = humanSenderLabel?.trim().charAt(0).toUpperCase() || "A";
  const botSenderLabel = resolveAiAgentSenderLabel(botAgentName);
  const botAvatarInitial = resolveAiAgentAvatarInitial(botAgentName);
  const isInteractiveOutbound =
    !inbound &&
    (isInteractiveContentType(message.content_type) ||
      Boolean(resolveMessageInteractive(message)));

  return (
    <div
      className={cn(
        "group flex min-w-0 gap-2",
        inbound ? "justify-start" : "justify-end"
      )}
    >
      {inbound && (
        <div className="mt-1 shrink-0">
          <ConversationAvatar
            name={customerName}
            phone={customerPhone ?? undefined}
            seed={customerAvatarSeed}
            size="bubble"
            showChannel={false}
          />
        </div>
      )}
      <div className={cn("min-w-0 max-w-[min(75%,100%)]", !inbound && "order-first")}>
        {inbound && (
          <p className="mb-0.5 text-[11px] font-medium text-[#00a884]">{customerDisplayName}</p>
        )}
        {!inbound && !isInteractiveOutbound && (
          <p
            className={cn(
              "mb-0.5 text-right text-[11px] font-medium",
              isHuman ? "text-[#00a884]" : "text-[#027eb5]"
            )}
          >
            {isHuman ? humanSenderLabel : isBot ? botSenderLabel : "Sistema"}
          </p>
        )}
        <div className={cn("relative", showReactions && "pb-2")}>
          <div
            className={cn(
              "relative min-w-0 max-w-full overflow-hidden rounded-lg text-sm shadow-sm",
              isInteractiveOutbound ? "overflow-hidden px-0 py-0" : "px-3 py-1.5",
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
                botAgentLabel={botSenderLabel}
              />
            )}
            <MessageBody
              message={message}
              messageById={messageById}
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
                "flex items-center gap-1 text-[10px] text-[#667781]",
                isInteractiveOutbound ? "justify-end px-3 py-1" : "mt-0.5",
                !inbound && "justify-end",
                showReactions && (inbound ? "pr-6" : "pl-6")
              )}
            >
              {isBot && !inbound && !isInteractiveOutbound && (
                <Bot className="size-3 text-[#027eb5]" />
              )}
              {isHuman && !inbound && !isInteractiveOutbound && (
                <User className="size-3 text-[#00a884]" />
              )}
              <span>{formatFullTime(message.created_at)}</span>
              {!inbound && (
                <MessageDeliveryStatus
                  message={message}
                  conversationId={conversationId}
                  onResent={onResent}
                  onRetryLocal={onRetryFailed}
                />
              )}
            </div>
          </div>
          <MessageReactions reactions={reactions} inbound={inbound} />
        </div>
      </div>
      {!inbound && !isInteractiveOutbound && (
        <div
          className={cn(
            "mt-1 flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white",
            isHuman ? "bg-[#00a884]" : "bg-[#027eb5]"
          )}
        >
          {isHuman ? humanAvatarInitial : botAvatarInitial}
        </div>
      )}
    </div>
  );
}
