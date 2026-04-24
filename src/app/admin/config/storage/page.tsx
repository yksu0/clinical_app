import { createClient } from "@/lib/supabase/server";
import ThresholdForm from "./ThresholdForm";
import ArchiveClient from "./ArchiveClient";
import { HardDrive } from "lucide-react";

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default async function StoragePage() {
  const supabase = await createClient();

  const [
    { data: statsRaw },
    { data: settings },
    { data: uploadsRaw },
  ] = await Promise.all([
    supabase
      .from("uploads")
      .select("size_bytes")
      .eq("archived", false),
    supabase
      .from("system_settings")
      .select("value")
      .eq("key", "storage_threshold_gb")
      .single(),
    supabase
      .from("uploads")
      .select(
        "id, file_name, size_bytes, uploaded_at, status, profiles!student_id(full_name)"
      )
      .eq("archived", false)
      .order("uploaded_at", { ascending: false }),
  ]);

  const thresholdGb = parseFloat(settings?.value ?? "8");
  const thresholdBytes = thresholdGb * 1024 * 1024 * 1024;

  const allUploads = statsRaw ?? [];
  const trackedBytes = allUploads.reduce(
    (sum, u) => sum + (u.size_bytes ?? 0),
    0
  );
  const unknownCount = allUploads.filter((u) => u.size_bytes === null).length;
  const usagePct = Math.min(
    Math.round((trackedBytes / thresholdBytes) * 100),
    100
  );
  const isWarning = trackedBytes >= thresholdBytes * 0.8;
  const isDanger = trackedBytes >= thresholdBytes;

  const uploads = ((uploadsRaw ?? []) as unknown as {
    id: string;
    file_name: string;
    size_bytes: number | null;
    uploaded_at: string;
    status: string;
    profiles: { full_name: string } | null;
  }[]).map((u) => ({
    id: u.id,
    file_name: u.file_name,
    size_bytes: u.size_bytes,
    uploaded_at: u.uploaded_at,
    status: u.status,
    student_name: u.profiles?.full_name ?? "Unknown",
  }));

  const barColor = isDanger
    ? "bg-red-500"
    : isWarning
    ? "bg-amber-500"
    : "bg-accent";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-foreground">Storage Management</h1>
        <p className="mt-1 text-sm text-(--text-secondary)">
          Monitor upload storage usage and archive old files to free space.
        </p>
      </div>

      {/* Usage indicator */}
      <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-(--text-secondary)" />
          <h2 className="text-sm font-semibold text-foreground">Storage Usage</h2>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-foreground">
              {formatBytes(trackedBytes)}
            </span>
            <span className="text-sm text-(--text-secondary)">
              of {thresholdGb} GB threshold
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2.5 w-full rounded-full bg-elevated overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${usagePct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-(--text-muted)">
            <span>{usagePct}% used</span>
            {unknownCount > 0 && (
              <span>{unknownCount} file{unknownCount !== 1 ? "s" : ""} with unknown size (legacy uploads)</span>
            )}
          </div>
        </div>

        {isDanger && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400">
            Storage is at or above the threshold. Archive old uploads to free space.
          </div>
        )}
        {isWarning && !isDanger && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs text-amber-400">
            Storage is above 80% of the threshold. Consider archiving old uploads soon.
          </div>
        )}
      </div>

      {/* Threshold config */}
      <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Threshold Setting</h2>
        <ThresholdForm currentGb={thresholdGb} />
      </div>

      {/* Archive section */}
      <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Archive Uploads</h2>
          <p className="mt-1 text-xs text-(--text-secondary)">
            Select uploads to download as a zip, then permanently remove from storage.
            Archived uploads remain visible in student history with an Archived badge,
            but the file can no longer be previewed or downloaded.
          </p>
        </div>

        <ArchiveClient uploads={uploads} />
      </div>
    </div>
  );
}
