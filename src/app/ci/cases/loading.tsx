import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";

export default function CICasesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>
      <SkeletonTable rows={12} />
    </div>
  );
}
