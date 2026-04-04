"use client";

import { useActionState, useState } from "react";
import { createAssignment } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";

type CaseType = { id: string; name: string };
type Location = { id: string; name: string };
type RecommendedStudent = {
  id: string;
  full_name: string;
  section: string | null;
  case_count: number;
  required_count: number;
  priority: "high" | "medium" | "low";
};

interface Props {
  caseTypes: CaseType[];
  locations: Location[];
  recommended: RecommendedStudent[];
  selectedCaseTypeId?: string;
}

type ActionState = { error: string | null; success: boolean };
const initialState: ActionState = { error: null, success: false };

const PRIORITY_LABEL = {
  high: { label: "No exposure", color: "text-(--status-rejected)", bg: "bg-red-500/10" },
  medium: { label: "Below target", color: "text-(--status-pending)", bg: "bg-yellow-500/10" },
  low: { label: "Target met", color: "text-(--status-processed)", bg: "bg-green-500/10" },
};

export default function AssignForm({ caseTypes, locations, recommended, selectedCaseTypeId }: Props) {
  const [selectedStudent, setSelectedStudent] = useState<string>("");

  const [state, formAction] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      const result = await createAssignment(formData);
      if (!result || result.success) return { error: null, success: true };
      return { error: result.error ?? "Unknown error.", success: false };
    },
    initialState
  );

  return (
    <div className="space-y-6">
      {/* Assignment form */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-(--text-secondary)">
          Create Assignment
        </h2>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="student_id" value={selectedStudent} />

          <div>
            <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
              Case Type <span className="text-(--status-rejected)">*</span>
            </label>
            <select
              name="case_type_id"
              required
              defaultValue={selectedCaseTypeId ?? ""}
              className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Select case type…</option>
              {caseTypes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
              Location <span className="text-(--status-rejected)">*</span>
            </label>
            <select
              name="location_id"
              required
              className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Select location…</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
              Date <span className="text-(--status-rejected)">*</span>
            </label>
            <input
              type="date"
              name="scheduled_date"
              required
              className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
              Student <span className="text-(--status-rejected)">*</span>
            </label>
            <p className="text-xs text-(--text-muted) mb-2">
              Select from the recommended list below, or pick manually.
            </p>
            <select
              required
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Select student…</option>
              {recommended.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}{s.section ? ` (${s.section})` : ""}
                </option>
              ))}
            </select>
          </div>

          {state.error && (
            <p className="text-sm text-(--status-rejected)">{state.error}</p>
          )}
          {state.success && (
            <p className="text-sm text-(--status-processed)">Assignment created.</p>
          )}

          <SubmitButton variant="primary" label="Assign" loadingLabel="Assigning…" />
        </form>
      </div>

      {/* Recommended students */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-(--text-secondary)">
          Recommended Students
        </h2>
        {recommended.length === 0 ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-border py-10">
            <p className="text-xs text-(--text-muted)">Select a case type to see recommendations</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {recommended.map((s) => {
              const p = PRIORITY_LABEL[s.priority];
              return (
                <li
                  key={s.id}
                  onClick={() => setSelectedStudent(s.id)}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
                    selectedStudent === s.id
                      ? "border-accent bg-accent/10"
                      : "border-border bg-surface hover:bg-elevated"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.full_name}</p>
                    <p className="text-xs text-(--text-muted)">
                      {s.section ?? "No section"} · {s.case_count}/{s.required_count} cases
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${p.color} ${p.bg}`}>
                    {p.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
