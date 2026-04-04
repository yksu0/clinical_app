import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";

export default function StudentHistoryLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <SkeletonTable rows={10} />
    </div>
  );
}
