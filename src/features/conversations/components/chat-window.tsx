"use client";

import { useEffect, useMemo, useRef, useTransition, useState, useCallback } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Eraser, MoreHorizontal, PanelRightOpen, Search, StickyNote, MessageSquare, X } from "lucide-react";
import { changeConversationMode, clearConversationChatAction } from "@/lib/actions/app-actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
import { ConversationModeSwitch } from "@/features/conversations/components/conversation-mode-switch";
import { AddNoteForm } from "@/features/conversations/components/add-note-form";
import { ReplyForm } from "@/features/conversations/components/reply-form";
import { PendingIndicator } from "@/features/conversations/components/pending-indicator";
import { usePendingMessages } from "@/features/conversations/context/pending-messages-context";
import { buildMessageMap } from "@/lib/conversations/message-display";
import { stripWhatsAppFormatting } from "@/lib/conversations/whatsapp-formatting";
import { hasUnreadCustomerReactions, countUnreadCustomerActivity } from "@/lib/conversations/pending-activity";
import { useChatScroll } from "@/features/conversations/hooks/use-chat-scroll";
import { useLiveConversation } from "@/features/conversations/hooks/use-live-conversation";
import { useMounted } from "@/hooks/use-mounted";
import { resolveCustomerDisplayName } from "@/lib/customers/resolve-display-name";
import { FlowRunBanner } from "@/features/conversations/components/flow-run-banner";
import { FlowAgentInputBubble } from "@/features/conversations/components/flow-agent-input-bubble";
import { useWhatsappServiceWindow } from "@/features/conversations/hooks/use-whatsapp-service-window";
import { useConversationFlowState } from "@/features/conversations/hooks/use-conversation-flow-state";
import { useInboxColumnLayoutContext } from "@/features/conversations/context/inbox-column-layout-context";
import type { ConversationFlowState } from "@/lib/bot-api/types";
import type { OutboundSenderContext } from "@/lib/conversations/outbound-sender";
import type { Conversation, Customer, Message } from "@/types/database.types";

type ChatWindowProps = {
  conversation: Conversation & { customers: Customer | null };
  messages: Message[];
  initialFlowState?: ConversationFlowState | null;
  outboundSender?: OutboundSenderContext;
  canClearChat?: boolean;
  showCustomerMessageAudit?: boolean;
  botAgentName?: string | null;
};

export function ChatWindow({
  conversation: initialConversation,
  messages: initialMessages,
  initialFlowState = null,
  outboundSender,
  canClearChat = false,
  showCustomerMessageAudit = false,
  botAgentName,
}: ChatWindowProps) {
  const { conversation, messages, scrollRef, refreshAfterSend, refresh, clearChatView } =
    useLiveConversation(initialConversation.id, initialConversation, initialMessages, outboundSender);
  const flowState = useConversationFlowState(initialConversation.id, initialFlowState);
  const flowModeLocked = flowState?.flow_mode_locked ?? false;
  const activeFlowRun = flowState?.active_flow_run ?? null;
  const showAgentInputBubble =
    activeFlowRun?.status === "AWAITING_AGENT_INPUT" &&
    activeFlowRun.pending_agent_input != null;
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState(conversation.mode === "HUMAN" ? "reply" : "note");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const customer = conversation.customers;
  const displayName = resolveCustomerDisplayName(customer);
  const canReply = conversation.mode === "HUMAN";
  const serviceWindow = useWhatsappServiceWindow({
    messages,
    customerLastSeenAt: customer?.last_seen_at,
  });
  const mounted = useMounted();
  const {
    showContactOverlayTrigger,
    showContactColumnReopen,
    openContactOverlay,
    toggleContactCollapsed,
  } = useInboxColumnLayoutContext();
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

  const matchingMessageIds = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return messages
      .filter((message) =>
        stripWhatsAppFormatting(message.content_text ?? "")
          .toLowerCase()
          .includes(query)
      )
      .map((message) => message.id);
  }, [messages, searchQuery]);

  const activeMatchId = matchingMessageIds[currentMatchIndex] ?? null;

  useEffect(() => {
    if (conversation.mode === "HUMAN") {
      setTab((current) => (current === "note" ? "reply" : current));
    }
  }, [conversation.mode]);

  useEffect(() => {
    setReplyingTo(null);
    setSearchOpen(false);
    setSearchQuery("");
    setCurrentMatchIndex(0);
  }, [conversation.id]);

  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    if (!searchOpen) return;
    const timer = window.setTimeout(() => searchInputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen || !activeMatchId) return;
    const element = scrollRef.current?.querySelector(
      `[data-message-id="${activeMatchId}"]`
    );
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [searchOpen, activeMatchId, scrollRef]);

  useEffect(() => {
    if (!searchOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen]);

  function openSearch() {
    setSearchOpen(true);
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery("");
    setCurrentMatchIndex(0);
  }

  function goToPreviousMatch() {
    if (matchingMessageIds.length === 0) return;
    setCurrentMatchIndex(
      (index) => (index - 1 + matchingMessageIds.length) % matchingMessageIds.length
    );
  }

  function goToNextMatch() {
    if (matchingMessageIds.length === 0) return;
    setCurrentMatchIndex((index) => (index + 1) % matchingMessageIds.length);
  }

  function handleModeChange(mode: "BOT" | "HUMAN") {
    if (mode === conversation.mode) return;
    if (flowModeLocked && mode === "HUMAN") {
      toast.error(
        "Hay un flujo activo. Solo finaliza o cancela el flujo para pasar a modo humano."
      );
      return;
    }
    startTransition(async () => {
      try {
        await changeConversationMode(conversation.id, mode);
        toast.success(`Modo ${mode} activado`);
        if (mode === "HUMAN") setTab("reply");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "No se pudo cambiar el modo"
        );
      }
    });
  }

  function handleClearChat() {
    startClearTransition(async () => {
      try {
        await clearConversationChatAction(conversation.id);
        clearChatView();
        acknowledgeRead();
        setClearDialogOpen(false);
        toast.success("Chat limpiado. Los mensajes se conservan en el historial.");
        void refresh();
      } catch {
        toast.error("No se pudo limpiar el chat");
      }
    });
  }

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-[#efeae2]">
      <header className="shrink-0 flex items-center justify-between border-b border-[#d1d7db] bg-[#f0f2f5] px-5 py-3.5">
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
        <div className="flex flex-col items-end gap-0.5">
          {showContactColumnReopen && (
            <button
              type="button"
              onClick={toggleContactCollapsed}
              className="hidden rounded-lg p-1.5 text-[#7678ed] transition-colors hover:bg-[#7678ed]/10 xl:flex"
              aria-label="Mostrar información del contacto"
              title="Mostrar información del contacto"
            >
              <PanelRightOpen className="size-4" />
            </button>
          )}
          <div className="flex items-center gap-1.5">
            {showContactOverlayTrigger && (
              <button
                type="button"
                onClick={openContactOverlay}
                className="rounded-full p-2 text-[#202022]/40 transition-colors hover:bg-[#f9fafc] hover:text-[#7678ed] xl:hidden"
                aria-label="Ver información del contacto"
                title="Ver información del contacto"
              >
                <PanelRightOpen className="size-4" />
              </button>
            )}
            <ConversationModeSwitch
              mode={conversation.mode}
              disabled={pending || flowModeLocked}
              lockedReason={
                flowModeLocked
                  ? "Hay un flujo activo. Solo finaliza o cancela el flujo para pasar a modo humano."
                  : undefined
              }
              onModeChange={handleModeChange}
            />
            <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="rounded-full p-2 text-[#202022]/40 transition-colors hover:bg-[#f9fafc] hover:text-[#7678ed]"
                  aria-label="Más opciones"
                />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem
                onClick={openSearch}
                className="text-[#111b21] focus:bg-accent focus:text-[#111b21] data-highlighted:text-[#111b21] [&>svg]:text-[#111b21] hover:[&>svg]:text-[#7678ed] focus:[&>svg]:text-[#7678ed] data-highlighted:[&>svg]:text-[#7678ed]"
              >
                <Search />
                Buscar
              </DropdownMenuItem>
              {canClearChat && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={clearPending || messages.length === 0}
                    onClick={() => setClearDialogOpen(true)}
                    className="text-[#111b21] focus:bg-accent focus:text-[#111b21] data-highlighted:text-[#111b21] [&>svg]:text-[#111b21] hover:[&>svg]:text-destructive focus:[&>svg]:text-destructive data-highlighted:[&>svg]:text-destructive"
                  >
                    <Eraser />
                    Limpiar chat
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </header>

      {activeFlowRun && (
        <FlowRunBanner run={activeFlowRun} onCancelled={() => void refresh()} />
      )}

      {searchOpen && (
        <div className="shrink-0 flex items-center gap-2 border-b border-[#d1d7db] bg-[#f0f2f5] px-5 py-2">
          <Search className="size-4 shrink-0 text-[#667781]" />
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (event.shiftKey) goToPreviousMatch();
                else goToNextMatch();
              }
            }}
            placeholder="Buscar en la conversación..."
            className="h-8 flex-1 border-[#d1d7db] bg-white text-sm text-[#111b21] placeholder:text-[#667781]"
          />
          {searchQuery.trim() && (
            <span className="shrink-0 text-xs text-[#667781]">
              {matchingMessageIds.length === 0
                ? "0/0"
                : `${currentMatchIndex + 1}/${matchingMessageIds.length}`}
            </span>
          )}
          <button
            type="button"
            onClick={goToPreviousMatch}
            disabled={matchingMessageIds.length === 0}
            className="rounded-full p-1.5 text-[#667781] transition-colors hover:bg-white hover:text-[#7678ed] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Resultado anterior"
          >
            <ChevronUp className="size-4" />
          </button>
          <button
            type="button"
            onClick={goToNextMatch}
            disabled={matchingMessageIds.length === 0}
            className="rounded-full p-1.5 text-[#667781] transition-colors hover:bg-white hover:text-[#7678ed] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Siguiente resultado"
          >
            <ChevronDown className="size-4" />
          </button>
          <button
            type="button"
            onClick={closeSearch}
            className="rounded-full p-1.5 text-[#667781] transition-colors hover:bg-white hover:text-[#7678ed]"
            aria-label="Cerrar búsqueda"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

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
              messages.map((msg) => {
                const isMatch = matchingMessageIds.includes(msg.id);
                const isActiveMatch = activeMatchId === msg.id;

                return (
                <div
                  key={msg.id}
                  data-message-id={msg.id}
                  className={cn(
                    "rounded-lg transition-colors",
                    isMatch && "bg-[#00a884]/8",
                    isActiveMatch && "ring-2 ring-[#00a884] ring-offset-2 ring-offset-[#efeae2]"
                  )}
                >
                  <ChatMessageBubble
                    message={msg}
                    messageById={messageById}
                    conversationId={conversation.id}
                    customerDisplayName={displayName}
                    customerName={customer?.name}
                    customerPhone={customer?.phone_number}
                    customerAvatarSeed={conversation.customer_id}
                    lastReadAt={lastReadAt[conversation.id]}
                    highlightUnread={mounted}
                    canReply={canReply}
                    showCustomerMessageAudit={showCustomerMessageAudit}
                    outboundSender={outboundSender}
                    botAgentName={botAgentName}
                    onResent={() => void refresh()}
                    onEdited={() => void refresh()}
                    onReply={(target) => {
                      setReplyingTo(target);
                      setTab("reply");
                    }}
                  />
                </div>
              );
              })
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

      <footer className="shrink-0 border-t border-[#202022]/8 bg-white shadow-[0_-4px_20px_rgba(32,32,34,0.04)]">
        {showAgentInputBubble && activeFlowRun?.pending_agent_input && (
          <FlowAgentInputBubble
            runId={activeFlowRun.id}
            pendingAgentInput={activeFlowRun.pending_agent_input}
            onSubmitted={() => void refresh()}
          />
        )}

        <div className="p-4">
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => canReply && setTab("reply")}
            disabled={!canReply}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
              tab === "reply"
                ? "bg-[#00a884] text-white shadow-md shadow-[#00a884]/25"
                : "border border-[#202022]/10 bg-[#f9fafc] text-[#202022]/55 hover:border-[#00a884]/30 hover:text-[#00a884]",
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
                ? "border border-[#6b2038] bg-[#7a2840] text-[#fff8f2] shadow-sm"
                : "border border-[#9a3d55] bg-[#9a3d55] text-[#fff8f2]/95 hover:border-[#6b2038] hover:bg-[#7a2840]"
            )}
          >
            <StickyNote className="size-3.5" />
            Nota interna
          </button>
        </div>

        <div
          className={cn(
            "rounded-xl p-3 transition-colors",
            tab === "reply"
              ? "border border-[#d1d7db]/80 bg-[#f0f2f5]"
              : "border-0 bg-transparent p-0 shadow-none"
          )}
        >
          {tab === "reply" ? (
            canReply ? (
              <ReplyForm
                conversationId={conversation.id}
                businessId={conversation.business_id}
                outboundSender={outboundSender}
                replyingTo={replyingTo}
                serviceWindow={serviceWindow}
                handoffReason={conversation.handoff_reason}
                onCancelReply={() => setReplyingTo(null)}
                onSent={(payload) => {
                  setReplyingTo(null);
                  void refreshAfterSend(payload);
                }}
              />
            ) : (
              <p className="text-sm text-[#667781]">
                Activa el <strong className="font-medium text-[#00a884]">modo humano</strong> para
                responder al cliente desde aquí.
              </p>
            )
          ) : (
            <AddNoteForm conversationId={conversation.id} />
          )}
        </div>
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
          <DialogFooter>
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
