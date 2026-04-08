"use client";

import { useState, useTransition } from "react";
import { activateSemester, updateSemesterDates } from "./actions";
import { CheckCircle, Edit2 } from "lucide-react";

type Semester = {
  id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
};

export function SemesterCard({ semester }: { semester: Semester }) {
  const [editing, setEditing] = useState(false);
  const [startDate, setStartDate] = useState(semester.start_date);
  const [endDate, setEndDate] = useState(semester.end_date ?? "");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleActivate() {
    startTransition(async () => {
      const result = await activateSemester(semester.id);
      if (result.error) setError(result.error);
    });
  }

  function handleSaveDates() {
    startTransition(async () => {
      const result = await updateSemesterDates(
        semester.id,
        startDate,
        endDate || null
      );
      if (result.error) setError(result.error);
      else setEditing(false);
    });
  }

  function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d + "T00:00:00").toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div
      className={`rounded-xl border p-4 space-y-3 ${
        semester.is_active
          ? "border-accent/40 bg-accent/5"
          : "border-border bg-surface"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">
              {semester.name}
            </p>
            {semester.is_active && (
              <span className="flex items-center gap-1 text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                <CheckCircle className="h-3 w-3" />
                Active
              </span>
            )}
          </div>
          {!editing ? (
            <p className="text-xs text-(--text-muted) mt-0.5">
              {fmtDate(semester.start_date)} – {fmtDate(semester.end_date)}
            </p>
          ) : (
            <div className="flex gap-2 mt-2 flex-wrap">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-md border border-border bg-elevated px-2 py-1 text-xs text-foreground focus:border-accent focus:outline-none"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-md border border-border bg-elevated px-2 py-1 text-xs text-foreground focus:border-accent focus:outline-none"
              />
              <button
                onClick={handleSaveDates}
                disabled={isPending}
                className="rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-black disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded-md border border-border px-2 py-1 text-xs text-(--text-muted) hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="rounded-md p-1.5 text-(--text-muted) hover:text-foreground hover:bg-elevated transition-colors"
              title="Edit dates"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
          )}
          {!semester.is_active && (
            <button
              onClick={handleActivate}
              disabled={isPending}
              className="rounded-md border border-accent/30 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 transition-colors disabled:opacity-50"
            >
              Make Active
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
