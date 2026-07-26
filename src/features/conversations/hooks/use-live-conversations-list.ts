"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ConversationRow } from "@/lib/conversations/load-conversations";
import type { Conversation, Customer, Message } from "@/types/database.types";

const POLL_MS = 15000;

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

  useEffect(() => {
    initialRef.current = initial;
    if (initial.length > 0) {
      setConversations(initial);
    }
  }, [initial, businessId]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function refresh() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || cancelled) return;

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
      if (cancelled) return;

      if (error) {
        console.error("[conversations-list] refresh error:", error);
        return;
      }

      if (!convs?.length) {
        if (initialRef.current.length > 0) return;
        setConversations([]);
        return;
      }

      const customerIds = [...new Set(convs.map((c) => c.customer_id))];
      const { data: customers } = await supabase
        .from("customers")
        .select("*")
        .in("id", customerIds);

      const { data: recentMessages } = await supabase
        .from("messages")
        .select("conversation_id, content_text, created_at")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(300);

      if (cancelled) return;

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

    if (initialRef.current.length === 0) {
      void refresh();
    }
    const interval = setInterval(() => void refresh(), POLL_MS);

    const channel = supabase
      .channel(`business-conversations-${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `business_id=eq.${businessId}`,
        },
        () => void refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `business_id=eq.${businessId}`,
        },
        () => void refresh()
      )
      .subscribe();

    return () => {
      cancelled = true;
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [businessId, agentId]);

  return conversations;
}
