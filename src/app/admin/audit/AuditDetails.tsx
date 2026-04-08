"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

/**
 * Expandable details cell for audit log rows.
 * Shows a human-readable summary and optionally the raw JSON.
 */
export function AuditDetails({
  details,
  targetTable,
}: {
  details: Record<string, unknown> | null;
  targetTable: string | null;
}) {
  const [open, setOpen] = useState(false);

  if (!details && !targetTable) return <span className="text-(--text-muted)">—</span>;

  // Build human-readable summary from common detail keys
  const summaryParts: string[] = [];

  if (details) {
    const d = details as Record<string, unknown>;
    if (typeof d.student_name === "string") summaryParts.push(d.student_name);
    if (typeof d.case_type === "string") summaryParts.push(d.case_type);
    if (typeof d.location === "string") summaryParts.push(d.location);
    if (typeof d.date === "string") summaryParts.push(d.date);
    if (typeof d.new_semester === "string") summaryParts.push(`→ ${d.new_semester}`);
    if (typeof d.previous_semester === "string") summaryParts.push(`from ${d.previous_semester}`);
    if (typeof d.students_archived === "number")
      summaryParts.push(`${d.students_archived} students archived`);
    if (typeof d.status === "string") summaryParts.push(d.status);
    if (typeof d.name === "string") summaryParts.push(d.name);
    if (typeof d.table === "string") summaryParts.push(d.table);
  }

  const summary =
    summaryParts.length > 0
      ? summaryParts.join(" · ")
      : targetTable ?? "—";

  const hasMore = details && Object.keys(details).length > 0;

  return (
    <span className="block">
      <span className="flex items-center gap-1">
        <span className="text-xs text-(--text-secondary)">{summary}</span>
        {hasMore && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-(--text-muted) hover:text-foreground transition-colors"
            title={open ? "Hide details" : "Show raw details"}
          >
            {open ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        )}
      </span>
      {open && details && (
        <pre className="mt-1 rounded bg-elevated px-2 py-1.5 text-[10px] text-(--text-muted) overflow-x-auto max-w-xs">
          {JSON.stringify(details, null, 2)}
        </pre>
      )}
    </span>
  );
}
