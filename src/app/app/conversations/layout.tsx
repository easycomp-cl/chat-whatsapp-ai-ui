import { Suspense } from "react";
import { requireAppAccess } from "@/lib/auth/session";

export default async function ConversationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAppAccess();

  return (
    <div className="-m-6 flex h-[calc(100vh-3.5rem)] min-h-0 min-w-0 flex-col overflow-hidden bg-[#f9fafc] p-2 md:p-4">
      <Suspense>{children}</Suspense>
    </div>
  );
}
