"use client";

import { useEffect, useMemo, useRef, useTransition, useState, useCallback } from "react";
import { toast } from "sonner";
import { ChevronDown, Eraser, MoreHorizontal, Search, StickyNote, MessageSquare } from "lucide-react";
import { changeConversationMode, clearConversationChatAction } from "@/lib/actions/app-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ChatMessageBubble } from "@/features/conversations/components/chat-message-bubble";
import { ConversationAvatar } from "@/features/conversations/components/conversation-avatar";
import { AddNoteForm } from "@/features/conversations/components/add-note-form";
import { ReplyForm } from "@/features/conversations/components/reply-form";
import { PendingIndicator } from "@/features/conversations/components/pending-indicator";
import { usePendingMessages } from "@/features/conversations/context/pending-messages-context";
import { buildMessageMap } from "@/lib/conversations/message-display";
import { hasUnreadCustomerReactions, countUnreadCustomerActivity } from "@/lib/conversations/pending-activity";
import { useChatScroll } from "@/features/conversations/hooks/use-chat-scroll";
import { useLiveConversation } from "@/features/conversations/hooks/use-live-conversation";
import { useMounted } from "@/hooks/use-mounted";
import type { Conversation, Customer, Message } from "@/types/database.types";

type ChatWindowProps = {
  conversation: Conversation & { customers: Customer | null };
  messages: Message[];
  canClearChat?: boolean;
};

export function ChatWindow({
  conversation: initialConversation,
  messages: initialMessages,
  canClearChat = false,
}: ChatWindowProps) {
  const { conversation, messages, scrollRef, refreshAfterSend, refresh } = useLiveConversation(
    initialConversation.id,
    initialConversation,
    initialMessages
  );
  const { markConversationRead, hasPending, lastReadAt } = usePendingMessages();
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const acknowledgeRead = useCallback(() => {
    markConversationRead(conversation.id, messagesRef.current);
  }, [conversation.id, markConversationRead]);

  const { showScrollButton, scrollToBottom } = useChatScroll(
    conversation.id,
    messages,
    scrollRef,
    { onAcknowledgeRead: acknowledgeRead }
  );
  const messageById = useMemo(() => buildMessageMap(messages), [messages]);
  const [pending, startTransition] = useTransition();
  const [clearPending, startClearTransition] = useTransition();
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [tab, setTab] = useState(conversation.mode === "HUMAN" ? "reply" : "note");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const customer = conversation.customers;
  const displayName = customer?.name ?? customer?.phone_number ?? "Conversación";
  const canReply = conversation.mode === "HUMAN";
  const mounted = useMounted();
  const unreadCount = useMemo(
    () =>
      mounted
        ? countUnreadCustomerActivity(messages, lastReadAt[conversation.id])
        : 0,
    [mounted, messages, lastReadAt, conversation.id]
  );
  const lastMessage = messages.at(-1);
  const awaitingResponse = lastMessage?.direction === "INBOUND";
  const hasUnreadReactions = useMemo(
    () =>
      mounted &&
      hasUnreadCustomerReactions(messages, conversation.id, lastReadAt[conversation.id]),
    [mounted, messages, conversation.id, lastReadAt]
  );
  const showPendingInHeader =
    mounted &&
    (awaitingResponse || hasPending(conversation.id) || hasUnreadReactions);

  useEffect(() => {
    if (conversation.mode === "HUMAN") {
      setTab((current) => (current === "note" ? "reply" : current));
    }
  }, [conversation.mode]);

  useEffect(() => {
    setReplyingTo(null);
  }, [conversation.id]);

  function handleModeChange(mode: "BOT" | "HUMAN") {
    if (mode === conversation.mode) return;
    startTransition(async () => {
      try {
        await changeConversationMode(conversation.id, mode);
        toast.success(`Modo ${mode} activado`);
        if (mode === "HUMAN") setTab("reply");
      } catch {
        toast.error("No se pudo cambiar el modo");
      }
    });
  }

  function handleClearChat() {
    startClearTransition(async () => {
      try {
        await clearConversationChatAction(conversation.id);
        setClearDialogOpen(false);
        toast.success("Chat limpiado. Los mensajes se conservan en el historial.");
        await refresh();
      } catch {
        toast.error("No se pudo limpiar el chat");
      }
    });
  }

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-[#efeae2]">
      <header className="flex items-center justify-between border-b border-[#d1d7db] bg-[#f0f2f5] px-5 py-3.5">
        <div className="flex items-center gap-3">
          <ConversationAvatar
            name={customer?.name}
            phone={customer?.phone_number}
            seed={conversation.customer_id}
            size="sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-[#111b21]">{displayName}</h2>
              {showPendingInHeader && <PendingIndicator size="md" showLabel />}
            </div>
            <p className="text-xs text-[#667781]">
              {awaitingResponse
                ? "Mensaje del cliente pendiente de respuesta"
                : hasUnreadReactions
                  ? "Nueva reacción del cliente sin revisar"
                  : customer?.phone_number}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Select
            value={conversation.mode}
            onValueChange={(v) => handleModeChange(v as "BOT" | "HUMAN")}
            disabled={pending}
          >
            <SelectTrigger className="h-8 rounded-full border-[#7678ed]/25 bg-[#7678ed]/8 text-xs font-medium text-[#7678ed]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BOT">Bot activo</SelectItem>
              <SelectItem value="HUMAN">Modo humano</SelectItem>
            </SelectContent>
          </Select>
          <button
            type="button"
            className="rounded-full p-2 text-[#202022]/40 transition-colors hover:bg-[#f9fafc] hover:text-[#7678ed]"
          >
            <Search className="size-4" />
          </button>
          {canClearChat && (
            <button
              type="button"
              onClick={() => setClearDialogOpen(true)}
              disabled={clearPending || messages.length === 0}
              className="rounded-full p-2 text-[#202022]/40 transition-colors hover:bg-[#f9fafc] hover:text-[#7678ed] disabled:cursor-not-allowed disabled:opacity-40"
              title="Limpiar chat"
              aria-label="Limpiar chat"
            >
              <Eraser className="size-4" />
            </button>
          )}
          <button
            type="button"
            className="rounded-full p-2 text-[#202022]/40 transition-colors hover:bg-[#f9fafc] hover:text-[#7678ed]"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto px-4 py-4"
          style={{
            backgroundColor: "#efeae2",
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cfc6' fill-opacity='0.35'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        >
          {conversation.handoff_reason && (
            <div className="mb-4 flex justify-center">
              <div className="rounded-xl border border-[#ff7a55]/25 bg-[#ff7a55]/8 px-4 py-2.5 text-xs font-medium text-[#c44d2a] shadow-sm">
                Derivación: {conversation.handoff_reason}
              </div>
            </div>
          )}
          <div className="space-y-4">
            {messages.length === 0 ? (
              <p className="text-center text-sm text-[#202022]/45">
                No hay mensajes en esta conversación
              </p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} data-message-id={msg.id}>
                  <ChatMessageBubble
                    message={msg}
                    messageById={messageById}
                    conversationId={conversation.id}
                    lastReadAt={lastReadAt[conversation.id]}
                    highlightUnread={mounted}
                    canReply={canReply}
                    onReply={(target) => {
                      setReplyingTo(target);
                      setTab("reply");
                    }}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {showScrollButton && (
          <button
            type="button"
            onClick={() => scrollToBottom("smooth", true)}
            className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#54656f] shadow-lg ring-1 ring-[#d1d7db] transition-transform hover:scale-105 hover:bg-[#f0f2f5]"
            aria-label={
              unreadCount > 0
                ? `${unreadCount} mensajes sin revisar`
                : "Ir al final de la conversación"
            }
          >
            <ChevronDown className="size-4 text-[#00a884]" />
            {unreadCount > 0
              ? `${unreadCount} sin revisar`
              : "Ir al final"}
          </button>
        )}
      </div>

      <footer className="border-t border-[#202022]/8 bg-white p-4 shadow-[0_-4px_20px_rgba(32,32,34,0.04)]">
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => canReply && setTab("reply")}
            disabled={!canReply}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
              tab === "reply"
                ? "bg-[#7678ed] text-white shadow-md shadow-[#7678ed]/25"
                : "border border-[#202022]/10 bg-[#f9fafc] text-[#202022]/55 hover:border-[#7678ed]/30 hover:text-[#7678ed]",
              !canReply && "cursor-not-allowed opacity-45"
            )}
          >
            <MessageSquare className="size-3.5" />
            Responder al cliente
          </button>
          <button
            type="button"
            onClick={() => setTab("note")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
              tab === "note"
                ? "border-2 border-amber-300 bg-amber-50 text-amber-900 shadow-md shadow-amber-100"
                : "border border-dashed border-amber-200/80 bg-amber-50/40 text-amber-700/70 hover:border-amber-300 hover:bg-amber-50"
            )}
          >
            <StickyNote className="size-3.5" />
            Nota interna
          </button>
        </div>

        <div
          className={cn(
            "rounded-xl p-4 transition-colors",
            tab === "reply"
              ? "border border-[#7678ed]/20 bg-[#7678ed]/5"
              : "border-2 border-dashed border-amber-200 bg-amber-50/60"
          )}
        >
          {tab === "reply" ? (
            canReply ? (
              <ReplyForm
                conversationId={conversation.id}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
                onSent={(text, serverMessage) => {
                  setReplyingTo(null);
                  void refreshAfterSend(text, serverMessage);
                }}
              />
            ) : (
              <p className="text-sm text-[#202022]/50">
                Activa el <strong className="font-medium text-[#7678ed]">modo humano</strong> para
                responder al cliente desde aquí.
              </p>
            )
          ) : (
            <>
              <p className="mb-3 text-[11px] font-medium text-amber-700/80">
                Solo visible para tu equipo — no se envía por WhatsApp
              </p>
              <AddNoteForm conversationId={conversation.id} />
            </>
          )}
        </div>
      </footer>

      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent showCloseButton={!clearPending}>
          <DialogHeader>
            <DialogTitle>¿Limpiar este chat?</DialogTitle>
            <DialogDescription>
              Se ocultarán todos los mensajes visibles en esta conversación. No se eliminarán de la
              base de datos: el historial completo quedará guardado para consulta o recuperación
              futura.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-t-0 bg-transparent p-0 pt-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setClearDialogOpen(false)}
              disabled={clearPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleClearChat}
              disabled={clearPending}
            >
              {clearPending ? "Limpiando…" : "Limpiar chat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
