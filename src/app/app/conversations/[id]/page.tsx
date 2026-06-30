import { notFound } from "next/navigation";
import { requireAppAccess } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { loadConversations } from "@/lib/conversations/load-conversations";
import { fetchConversationMessages } from "@/lib/conversations/fetch-conversation-messages";
import { ConversationsInbox } from "@/features/conversations/components/conversations-inbox";
import { ChatWindow } from "@/features/conversations/components/chat-window";
import { ContactDetailsPanel } from "@/features/conversations/components/contact-details-panel";
import { isAgent, canClearConversationChat } from "@/lib/rbac";
import type { Conversation, Customer, Message, ConversationNote } from "@/types/database.types";

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireAppAccess();
  const agentFilter =
    isAgent(profile.role) && profile.agent_id ? profile.agent_id : null;
  const conversations = await loadConversations(
    profile.business_id!,
    agentFilter
  );

  const supabase = await createClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .eq("business_id", profile.business_id!)
    .single();

  if (!conversation) notFound();

  const conv = conversation as Conversation;

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", conv.customer_id)
    .single();

  const convWithCustomer = {
    ...conv,
    customers: (customer as Customer | null) ?? null,
  };

  const { data: messages, error: messagesError } = await fetchConversationMessages(
    supabase,
    id,
    { chatClearedAt: conv.chat_cleared_at }
  );
  if (messagesError) {
    console.error("[chat] Error cargando mensajes (SSR):", messagesError);
  }

  const { data: notes } = await supabase
    .from("conversation_notes")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: false });

  const { data: events } = await supabase
    .from("usage_events")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <ConversationsInbox
      conversations={conversations}
      businessId={profile.business_id!}
      agentId={agentFilter}
    >
      <ChatWindow
        conversation={convWithCustomer}
        messages={(messages ?? []) as Message[]}
        canClearChat={canClearConversationChat(profile.role)}
      />
      <ContactDetailsPanel
        conversation={convWithCustomer}
        notes={(notes ?? []) as ConversationNote[]}
        events={events ?? []}
      />
    </ConversationsInbox>
  );
}
