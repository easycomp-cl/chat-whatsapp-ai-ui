import { Suspense } from "react";
import { ConversationsInboxSkeleton } from "@/components/layout/page-skeletons";
import { ConversationsPageContent } from "@/features/conversations/components/conversations-page-content";

export default function ConversationsPage() {
  return (
    <Suspense fallback={<ConversationsInboxSkeleton />}>
      <ConversationsPageContent />
    </Suspense>
  );
}
