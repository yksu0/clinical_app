import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";

export default function AuditLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-32" />
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-36 rounded-lg" />
        ))}
      </div>
      <SkeletonTable rows={12} />
    </div>
  );
}
