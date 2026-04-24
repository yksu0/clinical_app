"use client";

import { useState, useTransition } from "react";
import { zipSync } from "fflate";
import { getSignedUrls, archiveUploads } from "./actions";

type Upload = {
  id: string;
  file_name: string;
  size_bytes: number | null;
  uploaded_at: string;
  status: string;
  student_name: string;
};

function formatBytes(bytes: number | null) {
  if (bytes === null) return "unknown";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Step = "select" | "downloading" | "download_done" | "archiving";

export default function ArchiveClient({ uploads }: { uploads: Upload[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<Step>("select");
  const [progress, setProgress] = useState(0);
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const visible = uploads.filter((u) => !archivedIds.has(u.id));

  function toggleAll() {
    if (selected.size === visible.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(visible.map((u) => u.id)));
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleDownload() {
    if (selected.size === 0) return;
    setError(null);
    setStep("downloading");
    setProgress(0);

    try {
      const ids = Array.from(selected);
      const signedUrls = await getSignedUrls(ids);

      if (signedUrls.length === 0) {
        setError("No downloadable files found for the selected uploads.");
        setStep("select");
        return;
      }

      const files: Record<string, Uint8Array> = {};
      let done = 0;

      await Promise.all(
        signedUrls.map(async ({ id, fileName, url }) => {
          const res = await fetch(url);
          const buf = await res.arrayBuffer();
          // prefix with short ID to avoid name collisions
          files[`${id.slice(0, 8)}-${fileName}`] = new Uint8Array(buf);
          done++;
          setProgress(Math.round((done / signedUrls.length) * 100));
        })
      );

      const zipData = zipSync(files, { level: 0 });
      const blob = new Blob([zipData as unknown as Uint8Array<ArrayBuffer>], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `uploads-archive-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      setStep("download_done");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Download failed. Please try again."
      );
      setStep("select");
    }
  }

  function handleArchive() {
    if (selected.size === 0 || step !== "download_done") return;
    setStep("archiving");
    setError(null);

    startTransition(async () => {
      const ids = Array.from(selected);
      const result = await archiveUploads(ids);
      if ("error" in result) {
        setError(result.error);
        setStep("download_done");
        return;
      }
      setArchivedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));
        return next;
      });
      setSelected(new Set());
      setStep("select");
    });
  }

  if (visible.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-(--text-muted)">
        No uploads available for archiving.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-(--text-secondary)">
          {selected.size} of {visible.length} selected
        </span>

        {step === "select" && (
          <button
            onClick={handleDownload}
            disabled={selected.size === 0}
            className="rounded-lg bg-accent/20 text-accent hover:bg-accent/30 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-semibold transition-colors"
          >
            Download Archive
          </button>
        )}

        {step === "downloading" && (
          <span className="text-xs text-accent animate-pulse">
            Downloading… {progress}%
          </span>
        )}

        {step === "download_done" && (
          <>
            <span className="text-xs text-green-400">
              Download complete. Confirm to remove from storage.
            </span>
            <button
              onClick={handleArchive}
              className="rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1.5 text-xs font-semibold transition-colors"
            >
              Archive Selected ({selected.size})
            </button>
            <button
              onClick={() => setStep("select")}
              className="text-xs text-(--text-secondary) hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </>
        )}

        {step === "archiving" && (
          <span className="text-xs text-red-400 animate-pulse">
            Archiving…
          </span>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400">
          {error}
        </p>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[32px_1fr_1fr_100px_80px_80px] gap-3 px-4 py-2.5 border-b border-border bg-elevated text-xs font-semibold uppercase tracking-wider text-(--text-secondary)">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={selected.size === visible.length && visible.length > 0}
              onChange={toggleAll}
              className="h-3.5 w-3.5 rounded border-border accent-accent"
            />
          </label>
          <span>Student</span>
          <span>File</span>
          <span>Uploaded</span>
          <span>Size</span>
          <span>Status</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border bg-surface">
          {visible.map((u) => (
            <label
              key={u.id}
              className="grid grid-cols-[32px_1fr_1fr_100px_80px_80px] gap-3 px-4 py-3 items-center hover:bg-elevated cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.has(u.id)}
                onChange={() => toggle(u.id)}
                className="h-3.5 w-3.5 rounded border-border accent-accent"
              />
              <span className="text-sm text-foreground truncate">
                {u.student_name}
              </span>
              <span className="text-sm text-(--text-secondary) truncate">
                {u.file_name}
              </span>
              <span className="text-xs text-(--text-muted)">
                {new Date(u.uploaded_at).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="text-xs text-(--text-muted)">
                {formatBytes(u.size_bytes)}
              </span>
              <span className="text-xs capitalize text-(--text-muted)">
                {u.status}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
