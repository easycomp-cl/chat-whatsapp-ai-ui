import { requireAppAccess } from "@/lib/auth/session";
import { loadConversations } from "@/lib/conversations/load-conversations";
import { ConversationsInbox } from "@/features/conversations/components/conversations-inbox";
import { isAgent } from "@/lib/rbac";

export default async function ConversationsPage() {
  const profile = await requireAppAccess();
  const agentFilter =
    isAgent(profile.role) && profile.agent_id ? profile.agent_id : null;
  const conversations = await loadConversations(
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
