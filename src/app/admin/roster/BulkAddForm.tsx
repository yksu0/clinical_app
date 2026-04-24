"use client";

import { useState, useActionState } from "react";
import { addToRoster, bulkAddToRoster, type BulkResult } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";

export default function BulkAddForm() {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [bulkState, bulkAction] = useActionState<BulkResult | null, FormData>(
    bulkAddToRoster,
    null,
  );

  return (
    <div className="mb-4">
      {/* Mode tabs */}
      <div className="flex rounded-t-xl border border-b-0 border-border overflow-hidden">
        <button
          type="button"
          onClick={() => setMode("single")}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            mode === "single"
              ? "bg-elevated text-foreground"
              : "bg-surface text-(--text-muted) hover:text-foreground"
          }`}
        >
          Single
        </button>
        <button
          type="button"
          onClick={() => setMode("bulk")}
          className={`flex-1 py-2 text-xs font-medium border-l border-border transition-colors ${
            mode === "bulk"
              ? "bg-elevated text-foreground"
              : "bg-surface text-(--text-muted) hover:text-foreground"
          }`}
        >
          Bulk Import
        </button>
      </div>

      {mode === "single" ? (
        <form
          action={addToRoster}
          className="grid grid-cols-1 gap-3 rounded-b-xl border border-border bg-surface p-4 sm:grid-cols-3"
        >
          <input
            name="last_name"
            type="text"
            required
            placeholder="Last name *"
            className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground placeholder-(--text-muted) outline-none focus:border-accent focus:ring-1 focus:ring-accent uppercase"
          />
          <input
            name="first_name"
            type="text"
            required
            placeholder="First name *"
            className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground placeholder-(--text-muted) outline-none focus:border-accent focus:ring-1 focus:ring-accent uppercase"
          />
          <div className="flex gap-2">
            <input
              name="middle_initial"
              type="text"
              maxLength={1}
              placeholder="MI"
              className="w-14 rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground placeholder-(--text-muted) outline-none focus:border-accent focus:ring-1 focus:ring-accent uppercase"
            />
            <input
              name="email"
              type="email"
              placeholder="Email (optional)"
              className="flex-1 rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground placeholder-(--text-muted) outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>
          <div className="flex gap-2 sm:col-span-3">
            <input
              name="section"
              type="text"
              placeholder="Section (optional)"
              className="flex-1 rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground placeholder-(--text-muted) outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
            <SubmitButton label="Add" loadingLabel="…" />
          </div>
        </form>
      ) : (
        <form
          action={bulkAction}
          className="rounded-b-xl border border-border bg-surface p-4 space-y-3"
        >
          <p className="text-xs text-(--text-muted)">
            One student per line in{" "}
            <code className="rounded bg-elevated px-1 py-0.5 font-mono text-accent">SURNAME, FIRSTNAME MI.</code>
            {" "}format. Optionally append email and section separated by{" "}
            <code className="rounded bg-elevated px-1 py-0.5 font-mono text-accent">|</code>
            {" — "}example:{" "}
            <code className="font-mono text-accent">DELA CRUZ, JUAN A. | juan@school.edu | A</code>
          </p>
          <textarea
            name="names"
            required
            rows={9}
            placeholder={"DELA CRUZ, JUAN A.\nSANTOS, MARIA C. | maria@school.edu | A\nREYES, PEDRO"}
            className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground placeholder-(--text-muted) outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-y font-mono leading-relaxed"
          />
          {bulkState !== null && (
            <div
              className={`rounded-lg border px-3 py-2 text-xs ${
                bulkState.added > 0
                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                  : "border-border text-(--text-muted)"
              }`}
            >
              {bulkState.added > 0
                ? `Added ${bulkState.added} student${bulkState.added !== 1 ? "s" : ""}${
                    bulkState.skipped > 0
                      ? `, skipped ${bulkState.skipped} duplicate${bulkState.skipped !== 1 ? "s" : ""}`
                      : ""
                  }.`
                : `No new students added.${
                    bulkState.skipped > 0
                      ? ` ${bulkState.skipped} ${bulkState.skipped !== 1 ? "were" : "was"} already in the roster.`
                      : " Check your input."
                  }`}
            </div>
          )}
          <div className="flex justify-end">
            <SubmitButton label="Import All" loadingLabel="Importing…" />
          </div>
        </form>
      )}
    </div>
  );
}
