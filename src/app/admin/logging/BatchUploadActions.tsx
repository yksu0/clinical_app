"use client";

import { useState, useTransition } from "react";
import { batchUpdateUploads } from "./actions";

type Upload = {
  id: string;
  file_name: string;
  status: string;
  uploaded_at: string;
};

export default function BatchUploadActions({ uploads }: { uploads: Upload[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const pending = uploads.filter((u) => u.status === "pending");

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === pending.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pending.map((u) => u.id)));
    }
  };

  const handleBatch = (status: "processed" | "rejected") => {
    startTransition(async () => {
      const result = await batchUpdateUploads(Array.from(selected), status);
      if (result.success) {
        setMessage(`${result.count} upload${result.count !== 1 ? "s" : ""} ${status === "processed" ? "approved" : "rejected"}.`);
        setSelected(new Set());
      } else {
        setMessage(result.error ?? "Failed.");
      }
    });
  };

  if (pending.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={toggleAll}
          className="text-xs text-(--text-secondary) hover:text-foreground transition-colors"
        >
          {selected.size === pending.length ? "Deselect All" : "Select All"} ({pending.length} pending)
        </button>
        {selected.size > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleBatch("processed")}
              className="rounded-lg bg-green-500/20 px-3 py-1.5 text-xs font-semibold text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50"
            >
              {isPending ? "…" : `Approve ${selected.size}`}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleBatch("rejected")}
              className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              {isPending ? "…" : `Reject ${selected.size}`}
            </button>
          </div>
        )}
      </div>

      {message && (
        <p className="text-xs text-(--status-processed)">{message}</p>
      )}

      <ul className="space-y-1.5">
        {pending.map((u) => (
          <li
            key={u.id}
            onClick={() => toggle(u.id)}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
              selected.has(u.id)
                ? "border-accent bg-accent/10"
                : "border-border bg-surface hover:bg-elevated"
            }`}
          >
            <div
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                selected.has(u.id) ? "border-accent bg-accent" : "border-border"
              }`}
            >
              {selected.has(u.id) && (
                <svg className="h-3 w-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{u.file_name}</p>
              <p className="text-xs text-(--text-muted)">
                {new Date(u.uploaded_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
