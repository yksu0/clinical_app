import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

export default function StudentDashboardLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-48" />

      {/* Progress cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Case type progress bars */}
      <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
        <Skeleton className="h-4 w-36" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
