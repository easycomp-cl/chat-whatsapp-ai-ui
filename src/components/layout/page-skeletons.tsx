import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonMetricCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 rounded-xl border p-4">
      <Skeleton className="h-9 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4 rounded-xl border p-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-9 w-28" />
    </div>
  );
}

export function DashboardContentSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonMetricCards count={4} />
      <SkeletonMetricCards count={3} />
      <Skeleton className="h-72 rounded-xl" />
      <SkeletonTable rows={4} />
    </div>
  );
}

export function FaqsContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-40 rounded-lg" />
        <Skeleton className="h-9 w-44 rounded-lg" />
      </div>
      <SkeletonTable rows={6} />
    </div>
  );
}

export function CatalogContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-36 rounded-lg" />
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>
      <SkeletonTable rows={6} />
    </div>
  );
}

export function KnowledgeContentSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 rounded-xl" />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-40 rounded-lg" />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
      <SkeletonTable rows={5} />
    </div>
  );
}

export function DespachosContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-36 rounded-lg" />
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>
      <Skeleton className="h-20 rounded-xl" />
      <SkeletonTable rows={8} />
    </div>
  );
}

export function AgentsContentSkeleton() {
  return <SkeletonTable rows={5} />;
}

export function UsageContentSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonMetricCards count={4} />
      <SkeletonMetricCards count={2} />
      <SkeletonTable rows={6} />
    </div>
  );
}

export function SettingsContentSkeleton() {
  return <SkeletonForm fields={5} />;
}

export function ConversationsInboxSkeleton() {
  return (
    <div className="flex h-full min-h-0 overflow-hidden rounded-xl border border-[#202022]/8 bg-white shadow-[0_8px_40px_rgba(32,32,34,0.08)] md:rounded-2xl">
      <div className="flex w-20 shrink-0 flex-col gap-3 border-r p-2 md:w-80 md:p-3">
        <Skeleton className="hidden h-10 w-full md:block" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1 md:flex-row md:gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="hidden flex-1 space-y-1 md:block">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-1 items-center justify-center p-8">
        <Skeleton className="h-32 w-full max-w-sm rounded-xl" />
      </div>
    </div>
  );
}

export function ImportarChatPanelsSkeleton() {
  return (
    <div className="space-y-10">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
