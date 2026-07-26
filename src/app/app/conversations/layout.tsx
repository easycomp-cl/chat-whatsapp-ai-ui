import { Suspense } from "react";
import { requireAppAccess } from "@/lib/auth/session";
import { PendingMessagesProvider } from "@/features/conversations/context/pending-messages-context";

export default async function ConversationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAppAccess();

  return (
    <PendingMessagesProvider businessId={profile.business_id!}>
      <div className="-m-6 flex h-[calc(100vh-3.5rem)] min-h-0 flex-col overflow-hidden bg-[#f9fafc] p-2 md:p-4">
        <Suspense>{children}</Suspense>
      </div>
    </PendingMessagesProvider>
  );
}
