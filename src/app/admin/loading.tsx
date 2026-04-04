import { SkeletonCard, SkeletonTable } from "@/components/ui/Skeleton";

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="h-7 w-40 animate-pulse rounded-md bg-elevated" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Table */}
      <SkeletonTable rows={8} />
    </div>
  );
}
