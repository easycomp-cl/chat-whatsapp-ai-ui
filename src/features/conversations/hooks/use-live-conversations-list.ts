"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchConversationsInboxAction } from "@/lib/actions/flow-actions";
import type { ConversationRow } from "@/lib/conversations/load-conversations";
import type { Conversation, Customer, Message } from "@/types/database.types";

const POLL_MS = 15000;
const REALTIME_DEBOUNCE_MS = 400;

function buildConversationRows(
  convs: Conversation[],
  customers: Customer[] | null | undefined,
  recentMessages: Pick<Message, "conversation_id" | "content_text" | "created_at">[] | null | undefined
): ConversationRow[] {
  const customerMap = new Map(
    ((customers ?? []) as Customer[]).map((c) => [c.id, c])
  );

  const previewMap = new Map<string, string>();
  const clearedAtMap = new Map<string, string | null>();
  for (const conv of convs) {
    clearedAtMap.set(conv.id, conv.chat_cleared_at ?? null);
  }

  for (const msg of recentMessages ?? []) {
    if (previewMap.has(msg.conversation_id)) continue;

    const clearedAt = clearedAtMap.get(msg.conversation_id);
    if (
      clearedAt &&
      new Date(msg.created_at).getTime() <= new Date(clearedAt).getTime()
    ) {
      continue;
    }

    previewMap.set(msg.conversation_id, msg.content_text);
  }

  return convs.map((c) => ({
    ...c,
    customers: customerMap.get(c.customer_id) ?? null,
    last_message_preview: previewMap.get(c.id) ?? null,
  }));
}

export function useLiveConversationsList(
  businessId: string,
  initial: ConversationRow[],
  agentId?: string | null
) {
  const [conversations, setConversations] = useState(initial);
  const initialRef = useRef(initial);
  const conversationsRef = useRef(initial);
  const refreshGenRef = useRef(0);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    initialRef.current = initial;
    if (initial.length > 0) {
      setConversations(initial);
    }
  }, [initial, businessId]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    async function refreshFromBotApi() {
      const generation = ++refreshGenRef.current;
      try {
        const rows = await fetchConversationsInboxAction(agentId);
        if (cancelled || generation !== refreshGenRef.current) return;
        if (rows.length > 0 || conversationsRef.current.length === 0) {
          setConversations(rows);
        }
      } catch (error) {
        console.error("[conversations-list] inbox API error:", error);
        await refreshFromSupabase();
      }
    }

    async function refreshFromSupabase() {
      const generation = ++refreshGenRef.current;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || cancelled || generation !== refreshGenRef.current) return;

      let convQuery = supabase
        .from("conversations")
        .select("*")
        .eq("business_id", businessId)
        .order("last_message_at", { ascending: false })
        .limit(100);

      if (agentId) {
        convQuery = convQuery.eq("assigned_admin_id", agentId);
      }

      const { data: convs, error } = await convQuery;
      if (cancelled || generation !== refreshGenRef.current) return;

      if (error) {
        console.error("[conversations-list] refresh error:", error);
        return;
      }

      if (!convs?.length) {
        if (
          initialRef.current.length > 0 ||
          conversationsRef.current.length > 0
        ) {
          return;
        }
        setConversations([]);
        return;
      }

      const customerIds = [...new Set(convs.map((c) => c.customer_id))];
      const { data: customers, error: customersError } = await supabase
        .from("customers")
        .select("*")
        .in("id", customerIds);

      if (cancelled || generation !== refreshGenRef.current) return;

      if (customersError) {
        console.error("[conversations-list] customers error:", customersError);
        return;
      }

      const { data: recentMessages, error: messagesError } = await supabase
        .from("messages")
        .select("conversation_id, content_text, created_at")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(300);

      if (cancelled || generation !== refreshGenRef.current) return;

      if (messagesError) {
        console.error("[conversations-list] messages preview error:", messagesError);
        return;
      }

      setConversations(
        buildConversationRows(
          convs as Conversation[],
          customers as Customer[] | null,
          (recentMessages ?? []) as Pick<
            Message,
            "conversation_id" | "content_text" | "created_at"
          >[]
        )
      );
    }

    function scheduleRefresh() {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        void refreshFromBotApi();
      }, REALTIME_DEBOUNCE_MS);
    }

    void refreshFromBotApi();
    const interval = setInterval(() => void refreshFromBotApi(), POLL_MS);

    const channel = supabase
      .channel(`business-conversations-${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Message",
          filter: `tenantId=eq.${businessId}`,
        },
        () => scheduleRefresh()
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Conversation",
          filter: `tenantId=eq.${businessId}`,
        },
        () => scheduleRefresh()
      )
      .subscribe();

    return () => {
      cancelled = true;
      refreshGenRef.current += 1;
      if (debounceTimer) clearTimeout(debounceTimer);
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [businessId, agentId]);

  return conversations;
}
