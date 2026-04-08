"use client";

import { useActionState, useState } from "react";
import { rolloverSemester, createSemester } from "./actions";
import type { SemesterActionResult } from "./actions";

const initialState: SemesterActionResult = {};

export function RolloverForm() {
  const [state, action, pending] = useActionState(rolloverSemester, initialState);
  const [step, setStep] = useState<1 | 2>(1);

  if (state.success) {
    return (
      <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6">
        <p className="text-sm font-medium text-green-400">{state.success}</p>
        <p className="text-xs text-(--text-muted) mt-1">
          The new semester is now active. Add new students to the roster to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-red-500/20 bg-surface p-6 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">Roll Over Semester</h3>
        <p className="text-sm text-(--text-muted) mt-1">
          Archives all current students and starts a fresh semester. This cannot be undone.
        </p>
      </div>

      {step === 1 ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
            <p className="text-sm font-medium text-amber-400">What this will do:</p>
            <ul className="mt-2 space-y-1 text-xs text-(--text-muted) list-disc list-inside">
              <li>Close and end-date the current active semester</li>
              <li>Set all current students to <strong className="text-(--text-secondary)">inactive</strong> (their records are preserved)</li>
              <li>Create a new active semester for incoming students</li>
              <li>Case logs, assignments, and uploads are retained for historical reference</li>
            </ul>
          </div>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="rounded-lg border border-red-500/40 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Proceed to Rollover
          </button>
        </div>
      ) : (
        <form action={action} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-(--text-secondary) block mb-1">
                New Semester Name
              </label>
              <input
                name="new_semester_name"
                placeholder="e.g. AY 2026–2027 Semester 1"
                required
                className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground placeholder-(--text-muted) focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-(--text-secondary) block mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="new_start_date"
                required
                className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-red-400 block mb-1">
              Type <strong>ROLLOVER</strong> to confirm
            </label>
            <input
              name="confirm_code"
              placeholder="ROLLOVER"
              required
              autoComplete="off"
              className="w-full rounded-lg border border-red-500/30 bg-elevated px-3 py-2 text-sm text-foreground placeholder-(--text-muted) focus:border-red-400 focus:outline-none"
            />
          </div>

          {state.error && (
            <p className="text-sm text-red-400">{state.error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-(--text-secondary) hover:bg-elevated transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-red-500/20 border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              {pending ? "Rolling over…" : "Confirm Rollover"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export function CreateSemesterForm() {
  const [state, action, pending] = useActionState(createSemester, initialState);

  return (
    <form action={action} className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-3 sm:col-span-1">
          <label className="text-xs font-medium text-(--text-secondary) block mb-1">
            Semester Name
          </label>
          <input
            name="name"
            placeholder="e.g. Sem 1 AY 2026–27"
            required
            className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground placeholder-(--text-muted) focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-(--text-secondary) block mb-1">
            Start Date
          </label>
          <input
            type="date"
            name="start_date"
            required
            className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-(--text-secondary) block mb-1">
            End Date <span className="text-(--text-muted)">(optional)</span>
          </label>
          <input
            type="date"
            name="end_date"
            className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state.success && <p className="text-sm text-green-400">{state.success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50 hover:bg-accent/90 transition-colors"
      >
        {pending ? "Creating…" : "Create Semester"}
      </button>
    </form>
  );
}
