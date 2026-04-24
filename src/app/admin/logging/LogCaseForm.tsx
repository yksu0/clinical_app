"use client";

import { useActionState } from "react";
import { logCase } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";

type CaseType = { id: string; name: string };
type AreaOfDuty = { id: string; name: string };
type Rotation = { id: string; name: string };
type Upload = { id: string; file_name: string; uploaded_at: string };

interface Props {
  studentId: string;
  caseTypes: CaseType[];
  areasOfDuty: AreaOfDuty[];
  rotations: Rotation[];
  uploads: Upload[];
}

type ActionState = { error: string | null; success: boolean; assignmentCompleted?: boolean };

const initialState: ActionState = { error: null, success: false };

export default function LogCaseForm({
  studentId,
  caseTypes,
  areasOfDuty,
  rotations,
  uploads,
}: Props) {
  const [state, formAction] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      const result = await logCase(formData);
      if (!result || result.success) return { error: null, success: true, assignmentCompleted: result?.assignmentCompleted ?? false };
      return { error: result.error ?? "Unknown error.", success: false };
    },
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="student_id" value={studentId} />

      {/* Linked upload */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
          Linked Upload (optional)
        </label>
        <select
          name="upload_id"
          className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">— No linked upload —</option>
          {uploads.map((u) => (
            <option key={u.id} value={u.id}>
              {u.file_name}{" "}
              ({new Date(u.uploaded_at).toLocaleDateString()})
            </option>
          ))}
        </select>
      </div>

      {/* Case type */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
          Case Type <span className="text-(--status-rejected)">*</span>
        </label>
        <select
          name="case_type_id"
          required
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

      {/* Area of Duty */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
          Area of Duty <span className="text-(--status-rejected)">*</span>
        </label>
        <select
          name="area_of_duty_id"
          required
          className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">Select area of duty…</option>
          {areasOfDuty.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
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

      {/* Notes */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
          Notes
        </label>
        <textarea
          name="notes"
          rows={3}
          className="w-full resize-none rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground placeholder-[--text-muted] focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Optional notes…"
        />
      </div>

      {/* Rotation */}
      {rotations.length > 0 && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
            Rotation
          </label>
          <select
            name="rotation_id"
            className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">No rotation</option>
            {rotations.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      )}

      {state.error && (
        <p className="text-sm text-(--status-rejected)">{state.error}</p>
      )}
      {state.success && (
        <div className="space-y-1">
          <p className="text-sm text-(--status-processed)">Case logged successfully.</p>
          {state.assignmentCompleted && (
            <p className="text-xs text-accent">
              ✓ Matching assignment auto-completed.
            </p>
          )}
        </div>
      )}

      <SubmitButton variant="primary" label="Log Case" loadingLabel="Logging…" />
    </form>
  );
}
