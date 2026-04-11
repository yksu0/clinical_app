"use client";

import { useState, useTransition } from "react";
import { upsertOverride, removeOverride } from "./actions";

type CaseType = { id: string; name: string };
type Override = { case_type_id: string; adjusted_count: number; reason: string | null };

export default function RequirementOverrides({
  studentId,
  caseTypes,
  overrides,
  reqMap,
}: {
  studentId: string;
  caseTypes: CaseType[];
  overrides: Override[];
  reqMap: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const overrideMap = new Map(overrides.map((o) => [o.case_type_id, o]));

  const handleSave = (formData: FormData) => {
    startTransition(async () => {
      const result = await upsertOverride(formData);
      if (result.success) setMessage("Override saved.");
      else setMessage(result.error ?? "Failed.");
    });
  };

  const handleRemove = (formData: FormData) => {
    startTransition(async () => {
      const result = await removeOverride(formData);
      if (result.success) setMessage("Override removed.");
      else setMessage(result.error ?? "Failed.");
    });
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-(--text-secondary) hover:text-foreground transition-colors"
      >
        <svg
          className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        Requirement Overrides
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-(--text-muted)">
            Adjust required case counts for this student (e.g., medical exemptions).
          </p>

          {message && (
            <p className="text-xs text-(--status-processed)">{message}</p>
          )}

          <div className="space-y-2">
            {caseTypes.map((ct) => {
              const existing = overrideMap.get(ct.id);
              const defaultReq = reqMap[ct.id] ?? 0;
              return (
                <form
                  key={ct.id}
                  action={existing ? handleRemove : handleSave}
                  className="flex items-center gap-2"
                >
                  <input type="hidden" name="student_id" value={studentId} />
                  <input type="hidden" name="case_type_id" value={ct.id} />
                  <span className="text-xs text-(--text-secondary) min-w-30 truncate">
                    {ct.name}
                  </span>
                  <span className="text-[10px] text-(--text-muted) shrink-0">
                    Default: {defaultReq}
                  </span>
                  {existing ? (
                    <>
                      <span className="text-xs font-semibold text-accent">
                        → {existing.adjusted_count}
                      </span>
                      {existing.reason && (
                        <span className="text-[10px] text-(--text-muted) truncate max-w-30" title={existing.reason}>
                          ({existing.reason})
                        </span>
                      )}
                      <button
                        type="submit"
                        disabled={isPending}
                        className="ml-auto text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        type="number"
                        name="adjusted_count"
                        min={0}
                        defaultValue={defaultReq}
                        className="w-16 rounded border border-border bg-elevated px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      <input
                        type="text"
                        name="reason"
                        placeholder="Reason…"
                        className="flex-1 min-w-0 rounded border border-border bg-elevated px-2 py-1 text-xs text-foreground placeholder-(--text-muted) focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      <button
                        type="submit"
                        disabled={isPending}
                        className="shrink-0 text-xs text-accent hover:text-accent-hover transition-colors disabled:opacity-50"
                      >
                        Save
                      </button>
                    </>
                  )}
                </form>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
