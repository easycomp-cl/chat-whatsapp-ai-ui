import { Suspense } from "react";
import { ConversationListPanel } from "@/features/conversations/components/conversation-list-panel";
import { ConversationsEmptyState } from "@/features/conversations/components/conversations-empty-state";
import { InboxColumnLayout } from "@/features/conversations/components/inbox-column-layout";
import type { ConversationRow } from "@/lib/conversations/load-conversations";

export function ConversationsInbox({
  conversations,
  businessId,
  agentId,
  children,
  contactPanel,
}: {
  conversations: ConversationRow[];
  businessId: string;
  agentId?: string | null;
  children?: React.ReactNode;
  contactPanel?: React.ReactNode;
}) {
  return (
    <InboxColumnLayout
      listPanel={
        <Suspense>
          <ConversationListPanel
            conversations={conversations}
            businessId={businessId}
            agentId={agentId}
          />
        </Suspense>
      }
      chatPanel={children ?? <ConversationsEmptyState />}
      contactPanel={contactPanel}
    />
  );
}
