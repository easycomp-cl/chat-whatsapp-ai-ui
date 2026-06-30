"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePendingMessages } from "@/features/conversations/context/pending-messages-context";
import { fetchConversationMessages } from "@/lib/conversations/fetch-conversation-messages";
import { normalizeMessages } from "@/lib/conversations/message-display";
import { mapApiMessageToMessage, mergeServerWithLocal } from "@/lib/conversations/merge-messages";
import type { Conversation, Customer, Message } from "@/types/database.types";

const POLL_MS = 2500;

type MessageRow = {
  conversationId?: string;
  conversation_id?: string;
};

function matchesConversation(row: MessageRow, conversationId: string) {
  return row.conversationId === conversationId || row.conversation_id === conversationId;
}

export function useLiveConversation(
  conversationId: string,
  initialConversation: Conversation & { customers: Customer | null },
  initialMessages: Message[]
) {
  const [conversation, setConversation] = useState(initialConversation);
  const [messages, setMessages] = useState(() => normalizeMessages(initialMessages));
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const prevCountRef = useRef(initialMessages.length);
  const conversationRef = useRef(initialConversation);
  conversationRef.current = conversation;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const { syncConversationMessages } = usePendingMessages();
  const businessId = conversation.business_id;

  // Solo reiniciar al cambiar de conversación (evita pisar estado vivo con props RSC obsoletas).
  useEffect(() => {
    setConversation(initialConversation);
    setMessages(normalizeMessages(initialMessages));
    prevCountRef.current = initialMessages.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset solo al cambiar conversación
  }, [conversationId]);

  useEffect(() => {
    syncConversationMessages(conversationId, messages);
  }, [conversationId, messages, syncConversationMessages]);

  const applyMessages = useCallback((server: Message[]) => {
    setMessages((prev) => {
      const merged = mergeServerWithLocal(server, prev);
      prevCountRef.current = merged.length;
      return merged;
    });
  }, []);

  const refresh = useCallback(async () => {
    const supabase = createClient();

    const convRes = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    let chatClearedAt = conversationRef.current.chat_cleared_at;
    if (convRes.data) {
      const conv = convRes.data as Conversation;
      chatClearedAt = conv.chat_cleared_at;
      const { data: customer } = await supabase
        .from("customers")
        .select("*")
        .eq("id", conv.customer_id)
        .single();

      setConversation({
        ...conv,
        customers: (customer as Customer | null) ?? null,
      });
    }

    const msgRes = await fetchConversationMessages(supabase, conversationId, {
      chatClearedAt,
    });

    if (msgRes.error) {
      console.error("[chat] Error cargando mensajes:", msgRes.error);
      return;
    }

    if (msgRes.data) {
      applyMessages(msgRes.data);
    }
  }, [applyMessages, conversationId]);

  useEffect(() => {
    const supabase = createClient();

    void refresh();
    const interval = setInterval(() => void refresh(), POLL_MS);

    const onMessageChange = (payload: { new: MessageRow }) => {
      if (matchesConversation(payload.new, conversationId)) {
        void refresh();
      }
    };

    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Message",
          filter: `tenantId=eq.${businessId}`,
        },
        onMessageChange
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Message",
          filter: `tenantId=eq.${businessId}`,
        },
        onMessageChange
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Conversation",
          filter: `tenantId=eq.${businessId}`,
        },
        (payload) => {
          const row = payload.new as { id?: string };
          if (row.id === conversationId) void refresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "MessageReaction",
          filter: `tenantId=eq.${businessId}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as MessageRow;
          if (matchesConversation(row, conversationId)) void refresh();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [businessId, conversationId, refresh]);

  const appendOptimisticOutbound = useCallback((text: string) => {
    const optimistic: Message = {
      id: `optimistic-${Date.now()}`,
      conversation_id: conversationId,
      business_id: conversationRef.current.business_id,
      direction: "OUTBOUND",
      sender_type: "HUMAN",
      content_text: text,
      content_type: "TEXT",
      ai_generated: false,
      created_at: new Date().toISOString(),
      reactions: [],
    };

    setMessages((prev) => {
      const next = normalizeMessages([...prev, optimistic]);
      prevCountRef.current = next.length;
      return next;
    });
  }, [conversationId]);

  const upsertServerMessage = useCallback(
    (raw: Record<string, unknown>) => {
      const mapped = mapApiMessageToMessage(raw, {
        conversationId,
        businessId: conversationRef.current.business_id,
      });

      setMessages((prev) => {
        const withoutMatchingOptimistic = prev.filter(
          (m) =>
            !m.id.startsWith("optimistic-") ||
            m.content_text.trim() !== mapped.content_text.trim()
        );
        const exists = withoutMatchingOptimistic.some((m) => m.id === mapped.id);
        const next = exists
          ? withoutMatchingOptimistic
          : normalizeMessages([...withoutMatchingOptimistic, mapped]);
        prevCountRef.current = next.length;
        return next;
      });
    },
    [conversationId]
  );

  const refreshAfterSend = useCallback(
    async (text: string, serverMessage?: Record<string, unknown> | null) => {
      if (serverMessage) {
        upsertServerMessage(serverMessage);
      } else {
        const alreadyOptimistic = messagesRef.current.some(
          (m) =>
            m.id.startsWith("optimistic-") && m.content_text.trim() === text.trim()
        );
        if (!alreadyOptimistic) appendOptimisticOutbound(text);
      }

      await refresh();
      window.setTimeout(() => void refresh(), 800);
      window.setTimeout(() => void refresh(), 2000);
      window.setTimeout(() => void refresh(), 5000);
    },
    [appendOptimisticOutbound, refresh, upsertServerMessage]
  );

  return {
    conversation,
    messages,
    scrollRef,
    refresh,
    refreshAfterSend,
  };
}
