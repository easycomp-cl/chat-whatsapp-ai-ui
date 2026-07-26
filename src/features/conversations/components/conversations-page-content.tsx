import { requireAppAccess } from "@/lib/auth/session";
import { loadConversationsInbox } from "@/lib/conversations/load-conversations";
import { ConversationsInbox } from "@/features/conversations/components/conversations-inbox";
import { isAgent } from "@/lib/rbac";

export async function ConversationsPageContent() {
  const profile = await requireAppAccess();
  const agentFilter =
    isAgent(profile.role) && profile.agent_id ? profile.agent_id : null;
  const conversations = await loadConversationsInbox(
    profile.business_id!,
    agentFilter
  );

  return (
    <ConversationsInbox
      conversations={conversations}
      businessId={profile.business_id!}
      agentId={agentFilter}
    />
  );
}
