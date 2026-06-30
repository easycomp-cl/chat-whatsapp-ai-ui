import { Suspense } from "react";
import { ConversationListPanel } from "@/features/conversations/components/conversation-list-panel";
import { ConversationsEmptyState } from "@/features/conversations/components/conversations-empty-state";
import type { ConversationRow } from "@/lib/conversations/load-conversations";

export function ConversationsInbox({
  conversations,
  businessId,
  agentId,
  children,
}: {
  conversations: ConversationRow[];
  businessId: string;
  agentId?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 overflow-hidden rounded-2xl border border-[#202022]/8 bg-white shadow-[0_8px_40px_rgba(32,32,34,0.08)]">
      <Suspense>
        <ConversationListPanel
          conversations={conversations}
          businessId={businessId}
          agentId={agentId}
        />
      </Suspense>
      {children ?? <ConversationsEmptyState />}
    </div>
  );
}
