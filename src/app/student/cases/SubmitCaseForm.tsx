"use client";

import { useActionState } from "react";
import { submitCase, resubmitCase } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";

type CaseType = { id: string; name: string };
type AreaOfDuty = { id: string; name: string };
type Rotation = { id: string; name: string };
type Upload = { id: string; file_name: string; uploaded_at: string };
type OpenAssignment = {
  id: string;
  areas_of_duty: { name: string } | null;
  scheduled_date: string;
};
type ExistingSubmission = {
  id: string;
  case_type_id: string;
  area_of_duty_id: string;
  rotation_id: string | null;
  upload_id: string | null;
  date: string;
  notes: string | null;
  admin_note: string | null;
  status: string;
};

interface Props {
  caseTypes: CaseType[];
  areasOfDuty: AreaOfDuty[];
  rotations: Rotation[];
  uploads: Upload[];
  openAssignments: OpenAssignment[];
  existingSubmission?: ExistingSubmission;
}

type ActionState = { error: string | null; success: boolean };
const initialState: ActionState = { error: null, success: false };

export default function SubmitCaseForm({
  caseTypes,
  areasOfDuty,
  rotations,
  uploads,
  openAssignments,
  existingSubmission,
}: Props) {
  const isResubmit = !!existingSubmission;

  const [state, formAction] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      const fn = isResubmit ? resubmitCase : submitCase;
      const result = await fn(formData);
      if (!result || result.success) return { error: null, success: true };
      return { error: result.error ?? "Unknown error.", success: false };
    },
    initialState
  );

  if (state.success) {
    return (
      <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6 text-center space-y-3">
        <p className="text-sm font-semibold text-green-400">
          {isResubmit
            ? "Case resubmitted successfully."
            : "Case submitted for review."}
        </p>
        <p className="text-xs text-(--text-secondary)">
          An admin will review your submission shortly.
        </p>
        <a
          href="/student/cases"
          className="inline-block rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-black"
        >
          View My Submissions
        </a>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-4">
      {isResubmit && (
        <input
          type="hidden"
          name="submission_id"
          value={existingSubmission!.id}
        />
      )}

      {/* Rejection note (resubmit only) */}
      {isResubmit && existingSubmission!.admin_note && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-xs font-semibold text-red-400 mb-1">
            Rejection Reason
          </p>
          <p className="text-sm text-red-300">
            {existingSubmission!.admin_note}
          </p>
        </div>
      )}

      {/* Link to assignment (new submissions only) */}
      {!isResubmit && openAssignments.length > 0 && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
            Link to Assignment (optional)
          </label>
          <select
            name="assignment_id"
            className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">— Not linked to an assignment —</option>
            {openAssignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.areas_of_duty?.name ?? "Unknown"} —{" "}
                {new Date(a.scheduled_date).toLocaleDateString("en-AU", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Case type */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
          Case Type <span className="text-red-400">*</span>
        </label>
        <select
          name="case_type_id"
          required
          defaultValue={existingSubmission?.case_type_id ?? ""}
          className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">Select case type…</option>
          {caseTypes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Area of duty */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
          Area of Duty <span className="text-red-400">*</span>
        </label>
        <select
          name="area_of_duty_id"
          required
          defaultValue={existingSubmission?.area_of_duty_id ?? ""}
          className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">Select area…</option>
          {areasOfDuty.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
          Date <span className="text-red-400">*</span>
        </label>
        <input
          type="date"
          name="date"
          required
          defaultValue={existingSubmission?.date ?? today}
          max={today}
          className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Rotation */}
      {rotations.length > 0 && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
            Rotation (optional)
          </label>
          <select
            name="rotation_id"
            defaultValue={existingSubmission?.rotation_id ?? ""}
            className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">— No rotation —</option>
            {rotations.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Linked upload */}
      {uploads.length > 0 && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
            Linked Upload (optional)
          </label>
          <select
            name="upload_id"
            defaultValue={existingSubmission?.upload_id ?? ""}
            className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">— No upload —</option>
            {uploads.map((u) => (
              <option key={u.id} value={u.id}>
                {u.file_name} (
                {new Date(u.uploaded_at).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
          Notes / Remarks (optional)
        </label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={existingSubmission?.notes ?? ""}
          placeholder="Brief description of the case, procedure, etc."
          className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground placeholder:text-(--text-muted) focus:outline-none focus:ring-1 focus:ring-accent resize-none"
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400">
          {state.error}
        </p>
      )}

      <SubmitButton
        label={isResubmit ? "Resubmit for Review" : "Submit for Review"}
      />
    </form>
  );
}
