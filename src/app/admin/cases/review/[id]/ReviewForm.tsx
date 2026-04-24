"use client";

import { useActionState } from "react";
import { approveSubmission, rejectSubmission } from "../actions";
import SubmitButton from "@/components/ui/SubmitButton";

type CaseType = { id: string; name: string };
type AreaOfDuty = { id: string; name: string };
type Rotation = { id: string; name: string };

interface Submission {
  id: string;
  case_type_id: string;
  area_of_duty_id: string;
  rotation_id: string | null;
  upload_id: string | null;
  date: string;
  notes: string | null;
}

interface Props {
  submission: Submission;
  caseTypes: CaseType[];
  areasOfDuty: AreaOfDuty[];
  rotations: Rotation[];
  upload: { id: string; file_name: string } | null;
}

type ActionState = { error: string | null };
const initialState: ActionState = { error: null };

export default function ReviewForm({
  submission,
  caseTypes,
  areasOfDuty,
  rotations,
  upload,
}: Props) {
  const [approveState, approveAction] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      const result = await approveSubmission(formData);
      if (!result) return { error: null };
      return { error: result.error ?? null };
    },
    initialState
  );

  const [rejectState, rejectAction] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      const result = await rejectSubmission(formData);
      if (!result) return { error: null };
      return { error: result.error ?? null };
    },
    initialState
  );

  return (
    <div className="space-y-6">
      {/* Approve form */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">
          Review &amp; Edit Details
        </h2>

        <form action={approveAction} className="space-y-4">
          <input
            type="hidden"
            name="submission_id"
            value={submission.id}
          />

          {/* Case type */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
              Case Type <span className="text-red-400">*</span>
            </label>
            <select
              name="case_type_id"
              required
              defaultValue={submission.case_type_id}
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
              defaultValue={submission.area_of_duty_id}
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
              defaultValue={submission.date}
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
                defaultValue={submission.rotation_id ?? ""}
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

          {/* Linked upload (read-only) */}
          {upload && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
                Linked Upload
              </label>
              <input type="hidden" name="upload_id" value={upload.id} />
              <p className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground">
                {upload.file_name}
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
              Notes (optional)
            </label>
            <textarea
              name="notes"
              rows={3}
              defaultValue={submission.notes ?? ""}
              className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
          </div>

          {approveState.error && (
            <p className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400">
              {approveState.error}
            </p>
          )}

          <SubmitButton label="Approve & Log" />
        </form>
      </div>

      {/* Reject form — separate element, no nesting */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-red-400">
          Reject Submission
        </h2>

        <form action={rejectAction} className="space-y-4">
          <input
            type="hidden"
            name="submission_id"
            value={submission.id}
          />

          <div>
            <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
              Reason for rejection (optional — student will see this)
            </label>
            <textarea
              name="admin_note"
              rows={2}
              placeholder="e.g., Incorrect case type selected, please resubmit with the correct information."
              className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground placeholder:text-(--text-muted) focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
            />
          </div>

          {rejectState.error && (
            <p className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400">
              {rejectState.error}
            </p>
          )}

          <SubmitButton label="Reject" variant="danger" />
        </form>
      </div>
    </div>
  );
}
