"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ConversationRow } from "@/lib/conversations/load-conversations";
import type { Conversation, Customer, Message } from "@/types/database.types";

const POLL_MS = 4000;

export function useLiveConversationsList(
  businessId: string,
  initial: ConversationRow[],
  agentId?: string | null
) {
  const [conversations, setConversations] = useState(initial);

  useEffect(() => {
    setConversations(initial);
  }, [initial, businessId]);

  useEffect(() => {
    const supabase = createClient();

    async function refresh() {
      let convQuery = supabase
        .from("conversations")
        .select("*")
        .eq("business_id", businessId)
        .order("last_message_at", { ascending: false })
        .limit(100);

      if (agentId) {
        convQuery = convQuery.eq("assigned_admin_id", agentId);
      }

      const { data: convs } = await convQuery;
      if (!convs?.length) {
        setConversations([]);
        return;
      }

      const customerIds = [...new Set(convs.map((c) => c.customer_id))];
      const { data: customers } = await supabase
        .from("customers")
        .select("*")
        .in("id", customerIds);

      const customerMap = new Map(
        ((customers ?? []) as Customer[]).map((c) => [c.id, c])
      );

      const { data: recentMessages } = await supabase
        .from("messages")
        .select("conversation_id, content_text, created_at")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(300);

      const previewMap = new Map<string, string>();
      for (const msg of (recentMessages ?? []) as Pick<
        Message,
        "conversation_id" | "content_text"
      >[]) {
        if (!previewMap.has(msg.conversation_id)) {
          previewMap.set(msg.conversation_id, msg.content_text);
        }
      }

      setConversations(
        (convs as Conversation[]).map((c) => ({
          ...c,
          customers: customerMap.get(c.customer_id) ?? null,
          last_message_preview: previewMap.get(c.id) ?? null,
        }))
      );
    }

    void refresh();
    const interval = setInterval(refresh, POLL_MS);

    const channel = supabase
      .channel(`business-conversations-${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Message",
          filter: `tenantId=eq.${businessId}`,
        },
        () => void refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Conversation",
          filter: `tenantId=eq.${businessId}`,
        },
        () => void refresh()
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [businessId, agentId]);

  return conversations;
}
