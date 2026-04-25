"use client";

import { useState, useActionState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Clock, ClipboardCheck, PenSquare, CheckCircle } from "lucide-react";
import { logCase } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";

type Submission = {
  id: string;
  date: string;
  submitted_at: string;
  profiles: { full_name: string; section: string | null } | null;
  case_types: { name: string } | null;
  areas_of_duty: { name: string } | null;
};

type Student = { id: string; full_name: string; section: string | null };
type CaseType = { id: string; name: string };
type AreaOfDuty = { id: string; name: string };
type Rotation = { id: string; name: string };

interface Props {
  pending: Submission[];
  students: Student[];
  caseTypes: CaseType[];
  areasOfDuty: AreaOfDuty[];
  rotations: Rotation[];
}

type LogState = { error: string | null; success: boolean; assignmentCompleted?: boolean };
const logInitial: LogState = { error: null, success: false };

export default function CasesPanel({ pending, students, caseTypes, areasOfDuty, rotations }: Props) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "log" ? "log" : "review";
  const preselectedStudent = searchParams.get("student") ?? "";
  const [tab, setTab] = useState<"review" | "log">(initialTab as "review" | "log");

  // Sync tab when URL search params change (e.g. navigating from dashboard)
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "log" || t === "review") setTab(t);
  }, [searchParams]);

  const [logState, logAction, logPending] = useActionState(
    async (_prev: LogState, formData: FormData): Promise<LogState> => {
      const result = await logCase(formData);
      if (!result || result.success) {
        return { error: null, success: true, assignmentCompleted: result?.assignmentCompleted ?? false };
      }
      return { error: result.error ?? "Unknown error.", success: false };
    },
    logInitial
  );

  const tabClass = (active: boolean) =>
    `relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
      active
        ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-accent after:rounded-full"
        : "text-(--text-secondary) hover:text-foreground"
    }`;

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-border mb-6 -mx-4 px-4 sm:-mx-0 sm:px-0">
        <button onClick={() => setTab("review")} className={tabClass(tab === "review")}>
          <ClipboardCheck className="h-4 w-4" />
          Pending Review
          {pending.length > 0 && (
            <span className="ml-1 rounded-full bg-accent/20 px-1.5 py-0.5 text-xs font-semibold text-accent leading-none">
              {pending.length}
            </span>
          )}
        </button>
        <button onClick={() => setTab("log")} className={tabClass(tab === "log")}>
          <PenSquare className="h-4 w-4" />
          Log Manually
        </button>
      </div>

      {/* --- Pending Review tab --- */}
      {tab === "review" && (
        <>
          {pending.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
              <Clock className="h-8 w-8 text-(--text-muted) mb-3" />
              <p className="text-sm font-medium text-foreground">No pending submissions</p>
              <p className="mt-1 text-xs text-(--text-secondary)">
                All student case submissions have been reviewed.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {pending.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3.5"
                >
                  {/* Student */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {s.profiles?.full_name ?? "Unknown Student"}
                    </p>
                    {s.profiles?.section && (
                      <p className="text-xs text-(--text-muted)">{s.profiles.section}</p>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-(--text-secondary) sm:flex-1">
                    <span>
                      <span className="text-(--text-muted) mr-1">Type</span>
                      {s.case_types?.name ?? "—"}
                    </span>
                    <span>
                      <span className="text-(--text-muted) mr-1">Area</span>
                      {s.areas_of_duty?.name ?? "—"}
                    </span>
                    <span>
                      <span className="text-(--text-muted) mr-1">Date</span>
                      {new Date(s.date).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-(--text-muted)">
                      Submitted{" "}
                      {new Date(s.submitted_at).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>

                  {/* Action */}
                  <Link
                    href={`/admin/cases/review/${s.id}`}
                    className="shrink-0 rounded-lg bg-accent/15 px-3.5 py-1.5 text-xs font-semibold text-accent hover:bg-accent/25 transition-colors text-center"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* --- Log Manually tab --- */}
      {tab === "log" && (
        <div className="max-w-xl">
          {logState.success ? (
            <div className="rounded-xl border border-border bg-surface p-6 flex flex-col items-center gap-4 text-center">
              <CheckCircle className="h-8 w-8 text-accent" />
              <div>
                <p className="text-sm font-semibold text-foreground">Case logged successfully</p>
                {logState.assignmentCompleted && (
                  <p className="mt-1 text-xs text-(--text-secondary)">
                    A matching assignment was automatically marked as completed.
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  /* reset via re-render; navigate to review or log another */
                  window.location.reload();
                }}
                className="rounded-lg border border-border bg-elevated px-4 py-2 text-sm font-medium text-foreground hover:bg-border transition-colors"
              >
                Log Another
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="mb-5 text-sm font-semibold text-foreground">Log a Case</h2>
              <form action={logAction} className="space-y-4">
                {/* Student */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
                    Student <span className="text-(--status-rejected)">*</span>
                  </label>
                  <select
                    name="student_id"
                    required
                    defaultValue={preselectedStudent}
                    className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="">Select student…</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name}
                        {s.section ? ` — ${s.section}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Row: Case Type + Area of Duty */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
                      Case Type <span className="text-(--status-rejected)">*</span>
                    </label>
                    <select
                      name="case_type_id"
                      required
                      className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="">Select type…</option>
                      {caseTypes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
                      Area of Duty <span className="text-(--status-rejected)">*</span>
                    </label>
                    <select
                      name="area_of_duty_id"
                      required
                      className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="">Select area…</option>
                      {areasOfDuty.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row: Date + Rotation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
                      Date <span className="text-(--status-rejected)">*</span>
                    </label>
                    <input
                      type="date"
                      name="date"
                      required
                      className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  {rotations.length > 0 && (
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
                        Rotation (optional)
                      </label>
                      <select
                        name="rotation_id"
                        className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                      >
                        <option value="">— No rotation —</option>
                        {rotations.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
                    Notes (optional)
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder="Any additional context…"
                    className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground placeholder:text-(--text-muted) focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                  />
                </div>

                {logState.error && (
                  <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                    {logState.error}
                  </p>
                )}

                <SubmitButton label="Log Case" loadingLabel="Logging…" />
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
