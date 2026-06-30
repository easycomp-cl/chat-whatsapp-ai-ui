import { createClient } from "@/lib/supabase/server";
import type { Conversation, Customer, Message } from "@/types/database.types";

export type ConversationRow = Conversation & {
  customers: Customer | null;
  last_message_preview?: string | null;
};

export async function loadConversations(
  businessId: string,
  agentId?: string | null
): Promise<ConversationRow[]> {
  const supabase = await createClient();

  let convQuery = supabase
    .from("conversations")
    .select("*")
    .eq("business_id", businessId)
    .order("last_message_at", { ascending: false })
    .limit(100);

  if (agentId) {
    convQuery = convQuery.eq("assigned_admin_id", agentId);
  }

  const { data: conversations } = await convQuery;
  if (!conversations?.length) return [];

  const customerIds = [...new Set(conversations.map((c) => c.customer_id))];
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
  const clearedAtMap = new Map<string, string | null>();
  for (const conv of conversations as Conversation[]) {
    clearedAtMap.set(conv.id, conv.chat_cleared_at ?? null);
  }

  for (const msg of (recentMessages ?? []) as Pick<
    Message,
    "conversation_id" | "content_text" | "created_at"
  >[]) {
    if (previewMap.has(msg.conversation_id)) continue;

    const clearedAt = clearedAtMap.get(msg.conversation_id);
    if (clearedAt && new Date(msg.created_at).getTime() <= new Date(clearedAt).getTime()) {
      continue;
    }

    previewMap.set(msg.conversation_id, msg.content_text);
  }

  return (conversations as Conversation[]).map((c) => ({
    ...c,
    customers: customerMap.get(c.customer_id) ?? null,
    last_message_preview: previewMap.get(c.id) ?? null,
  }));
}
