import { notFound } from "next/navigation";
import { requireAppAccess } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { loadConversationsInbox, toConversationRow, ensureConversationInList } from "@/lib/conversations/load-conversations";
import { fetchConversationMessages } from "@/lib/conversations/fetch-conversation-messages";
import { ConversationsInbox } from "@/features/conversations/components/conversations-inbox";
import { ChatWindow } from "@/features/conversations/components/chat-window";
import { ContactDetailsPanel } from "@/features/conversations/components/contact-details-panel";
import { isAgent, canClearConversationChat, canViewCustomerMessageAudit, canManageCustomerProfile } from "@/lib/rbac";
import { botApi } from "@/lib/bot-api/client";
import type {
  ConversationFlowState,
  DeliveryRegion,
  FlowDefinition,
} from "@/lib/bot-api/types";
import { outboundSenderFromProfile } from "@/lib/conversations/outbound-sender";
import { formatProfileDisplayName } from "@/lib/profile/display-name";
import type { Conversation, Customer, Message, ConversationNoteWithAuthor } from "@/types/database.types";

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireAppAccess();
  const agentFilter =
    isAgent(profile.role) && profile.agent_id ? profile.agent_id : null;
  const conversations = await loadConversationsInbox(
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

  const activeConversation = toConversationRow(
    conv,
    (customer as Customer | null) ?? null,
    (messages ?? [])[0]?.content_text ?? null
  );
  const conversationRows = ensureConversationInList(conversations, activeConversation);

  const { data: notes } = await supabase
    .from("conversation_notes")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  const noteUserIds = [...new Set((notes ?? []).map((note) => note.user_id))];
  const authorNameByUserId = new Map<string, string>();

  const { data: teamProfiles } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, full_name")
    .eq("business_id", profile.business_id!);

  const outboundSender = outboundSenderFromProfile(profile, teamProfiles ?? []);

  if (noteUserIds.length > 0) {
    for (const userId of noteUserIds) {
      const name = outboundSender.senderNameByUserId[userId];
      if (name) authorNameByUserId.set(userId, name);
    }

    const missingIds = noteUserIds.filter((userId) => !authorNameByUserId.has(userId));
    if (missingIds.length > 0) {
      const { data: noteAuthors } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, full_name")
        .in("user_id", missingIds);

      for (const author of noteAuthors ?? []) {
        authorNameByUserId.set(author.user_id, formatProfileDisplayName(author));
      }
    }
  }

  const notesWithAuthors: ConversationNoteWithAuthor[] = (notes ?? []).map((note) => ({
    ...note,
    color: note.color ?? null,
    author_name: authorNameByUserId.get(note.user_id) ?? "Usuario",
  }));

  const { data: events } = await supabase
    .from("usage_events")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  let deliveryRegions: DeliveryRegion[] = [];
  let initialFlowState: ConversationFlowState | null = null;
  let activatableFlows: FlowDefinition[] = [];
  let botAgentName: string | undefined;

  try {
    const personality = await botApi.getBotPersonality(profile.business_id!);
    botAgentName = personality.bot_name?.trim() || undefined;
  } catch {
    botAgentName = undefined;
  }

  try {
    const detail = await botApi.getConversation(id);
    initialFlowState = {
      flow_mode_locked: detail.flow_mode_locked,
      active_flow_run: detail.active_flow_run,
    };
  } catch {
    initialFlowState = null;
  }

  try {
    activatableFlows = (await botApi.listFlows(profile.business_id!, "ACTIVE")).filter(
      (flow) => flow.status === "ACTIVE" && flow.current_version_id != null
    );
  } catch {
    activatableFlows = [];
  }

  if (canManageCustomerProfile(profile.role)) {
    try {
      deliveryRegions = await botApi.listDeliveryRegions(profile.business_id!);
    } catch {
      deliveryRegions = [];
    }
  }

  return (
    <ConversationsInbox
      conversations={conversationRows}
      businessId={profile.business_id!}
      agentId={agentFilter}
      contactPanel={
        <ContactDetailsPanel
          businessId={profile.business_id!}
          conversation={convWithCustomer}
          flowState={initialFlowState}
          notes={notesWithAuthors}
          events={events ?? []}
          canEditCustomerProfile={canManageCustomerProfile(profile.role)}
          deliveryRegions={deliveryRegions}
          activatableFlows={activatableFlows}
        />
      }
    >
      <ChatWindow
        conversation={convWithCustomer}
        messages={(messages ?? []) as Message[]}
        initialFlowState={initialFlowState}
        outboundSender={outboundSender}
        canClearChat={canClearConversationChat(profile.role)}
        showCustomerMessageAudit={canViewCustomerMessageAudit(profile.role)}
        botAgentName={botAgentName}
      />
    </ConversationsInbox>
  );
}
