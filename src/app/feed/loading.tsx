import { Skeleton } from "@/components/ui/Skeleton";

export default function FeedLoading() {
  return (
    <div className="min-h-full">
      {/* Hero skeleton */}
      <div className="bg-surface border-b border-border px-6 py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-4 w-96 max-w-full" />
          <div className="grid grid-cols-3 gap-4 max-w-sm mt-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="mx-auto max-w-2xl px-4 md:px-6 py-8 space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface overflow-hidden">
            {i === 0 && <Skeleton className="h-48 rounded-none" />}
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
