import { Suspense } from "react";

export default function ConversationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="-m-6 flex h-[calc(100vh-3.5rem)] min-h-0 flex-col overflow-hidden bg-[#f9fafc] p-4">
      <Suspense>{children}</Suspense>
    </div>
  );
}
