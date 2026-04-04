import { Skeleton, SkeletonCard, SkeletonTable } from "@/components/ui/Skeleton";

export default function CIDashboardLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-44" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <SkeletonTable rows={8} />
    </div>
  );
}
