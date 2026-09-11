"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePendingMessages } from "@/features/conversations/context/pending-messages-context";
import { fetchConversationMessages } from "@/lib/conversations/fetch-conversation-messages";
import { normalizeMessages } from "@/lib/conversations/message-display";
import { mapApiMessageToMessage, mergeOutboundMessage, mergeServerWithLocal, isOptimisticMessage } from "@/lib/conversations/merge-messages";
import {
  isDeliveryStatusRealtimePatch,
  patchMessageFromRealtimeRow,
} from "@/lib/conversations/patch-realtime-message";
import type { OutboundSenderContext } from "@/lib/conversations/outbound-sender";
import type { Conversation, Customer, Message } from "@/types/database.types";

const POLL_MS = 2500;

type MessageRow = {
  id?: string;
  conversationId?: string;
  conversation_id?: string;
  whatsappDeliveryStatus?: string | null;
  whatsapp_delivery_status?: string | null;
  externalId?: string | null;
  external_id?: string | null;
};

function matchesConversation(row: MessageRow, conversationId: string) {
  return row.conversationId === conversationId || row.conversation_id === conversationId;
}

export function useLiveConversation(
  conversationId: string,
  initialConversation: Conversation & { customers: Customer | null },
  initialMessages: Message[],
  outboundSender?: OutboundSenderContext | null
) {
  const [conversation, setConversation] = useState(initialConversation);
  const [messages, setMessages] = useState(() => normalizeMessages(initialMessages));
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const prevCountRef = useRef(initialMessages.length);
  const conversationRef = useRef(initialConversation);
  conversationRef.current = conversation;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const outboundSenderRef = useRef(outboundSender);
  outboundSenderRef.current = outboundSender;
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

  const applyMessages = useCallback(
    (server: Message[], options?: { authoritative?: boolean }) => {
      setMessages((prev) => {
        const merged = mergeServerWithLocal(server, prev, options);
        prevCountRef.current = merged.length;
        return merged;
      });
    },
    []
  );

  const clearChatView = useCallback(() => {
    const clearedAt = new Date().toISOString();
    setMessages([]);
    prevCountRef.current = 0;
    setConversation((prev) => ({
      ...prev,
      chat_cleared_at: clearedAt,
    }));
    conversationRef.current = {
      ...conversationRef.current,
      chat_cleared_at: clearedAt,
    };
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
      applyMessages(msgRes.data, { authoritative: Boolean(chatClearedAt) });
    }
  }, [applyMessages, conversationId]);

  useEffect(() => {
    const supabase = createClient();

    void refresh();
    const interval = setInterval(() => void refresh(), POLL_MS);

    const onMessageInsert = (payload: { new: MessageRow }) => {
      if (matchesConversation(payload.new, conversationId)) {
        void refresh();
      }
    };

    const onMessageUpdate = (payload: { new: MessageRow }) => {
      const row = payload.new;
      if (!matchesConversation(row, conversationId)) {
        return;
      }

      if (row.id && isDeliveryStatusRealtimePatch(row)) {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === row.id ? patchMessageFromRealtimeRow(message, row) : message
          )
        );
        return;
      }

      void refresh();
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
        onMessageInsert
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Message",
          filter: `tenantId=eq.${businessId}`,
        },
        onMessageUpdate
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
    const sender = outboundSenderRef.current;
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
      whatsapp_delivery_status: "pending",
      reactions: [],
      sender_user_id: sender?.userId ?? null,
      sender_display_name: sender?.displayName ?? null,
    };

    setMessages((prev) => {
      const next = normalizeMessages([...prev, optimistic]);
      prevCountRef.current = next.length;
      return next;
    });
  }, [conversationId]);

  const appendOptimisticMessage = useCallback((optimistic: Message) => {
    setMessages((prev) => {
      const next = normalizeMessages([...prev, optimistic]);
      prevCountRef.current = next.length;
      return next;
    });
  }, []);

  const upsertServerMessage = useCallback(
    (raw: Record<string, unknown>) => {
      const mapped = mapApiMessageToMessage(raw, {
        conversationId,
        businessId: conversationRef.current.business_id,
      });

      setMessages((prev) => {
        const matchingOptimistic = prev.find(
          (m) =>
            isOptimisticMessage(m) &&
            !m.id.startsWith("optimistic-media-") &&
            m.content_text.trim() === mapped.content_text.trim()
        );

        const withoutMatchingOptimistic = prev.filter((m) => {
          if (!m.id.startsWith("optimistic-")) return true;
          if (m.id.startsWith("optimistic-media-")) return false;
          return m.content_text.trim() !== mapped.content_text.trim();
        });

        const mappedWithSender = matchingOptimistic
          ? mergeOutboundMessage(matchingOptimistic, mapped)
          : mapped;

        const exists = withoutMatchingOptimistic.some((m) => m.id === mappedWithSender.id);
        const next = exists
          ? withoutMatchingOptimistic.map((m) =>
              m.id === mappedWithSender.id ? mergeOutboundMessage(m, mappedWithSender) : m
            )
          : normalizeMessages([...withoutMatchingOptimistic, mappedWithSender]);
        prevCountRef.current = next.length;
        return next;
      });
    },
    [conversationId]
  );

  const refreshAfterSend = useCallback(
    async (payload: {
      text?: string;
      optimistic?: Message;
      serverMessage?: Record<string, unknown> | null;
      previewOnly?: boolean;
    }) => {
      if (payload.optimistic) {
        appendOptimisticMessage(payload.optimistic);
      } else if (payload.serverMessage) {
        upsertServerMessage(payload.serverMessage);
      } else if (payload.text) {
        const alreadyOptimistic = messagesRef.current.some(
          (m) =>
            m.id.startsWith("optimistic-") && m.content_text.trim() === payload.text!.trim()
        );
        if (!alreadyOptimistic) appendOptimisticOutbound(payload.text);
      }

      if (payload.previewOnly) {
        return;
      }

      await refresh();
      window.setTimeout(() => void refresh(), 800);
      window.setTimeout(() => void refresh(), 2000);
      window.setTimeout(() => void refresh(), 5000);
    },
    [appendOptimisticMessage, appendOptimisticOutbound, refresh, upsertServerMessage]
  );

  return {
    conversation,
    messages,
    scrollRef,
    refresh,
    refreshAfterSend,
    clearChatView,
  };
}
