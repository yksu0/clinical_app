"use client";

import { useActionState, useState, useCallback, useMemo, useTransition } from "react";
import { createAssignment, bulkAssign, checkConflicts } from "./actions";
import type { ConflictWarning } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";

type CaseType = { id: string; name: string };
type Location = { id: string; name: string };
type RecommendedStudent = {
  id: string;
  full_name: string;
  section: string | null;
  case_count: number;
  total_cases: number;
  required_count: number;
  last_assigned: string | null;
  location_count: number;
  priority: "high" | "medium" | "low";
};

interface Props {
  caseTypes: CaseType[];
  locations: Location[];
  recommended: RecommendedStudent[];
  selectedCaseTypeId?: string;
  quickStats: { needCase: number; completedPct: number; totalStudents: number };
  semesterWindow: { name: string; start: string; end: string | null } | null;
}

type ActionState = { error: string | null; success: boolean; message?: string };
const initialState: ActionState = { error: null, success: false };

const PRIORITY_LABEL = {
  high: { label: "No exposure", color: "text-(--status-rejected)", bg: "bg-red-500/10" },
  medium: { label: "Below target", color: "text-(--status-pending)", bg: "bg-yellow-500/10" },
  low: { label: "Target met", color: "text-(--status-processed)", bg: "bg-green-500/10" },
};

type SortKey = "priority" | "total_cases" | "case_count" | "last_assigned" | "location_count";

export default function AssignForm({ caseTypes, locations, recommended, selectedCaseTypeId, quickStats, semesterWindow }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("priority");
  const [filterMode, setFilterMode] = useState<"all" | "incomplete" | "low_exposure">("all");
  const [warnings, setWarnings] = useState<ConflictWarning[]>([]);
  const [, startTransition] = useTransition();

  const toggleStudent = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllFiltered = useCallback((ids: string[]) => {
    setSelected((prev) => {
      const allSelected = ids.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  // Filter -> search -> sort
  const filteredStudents = useMemo(() => {
    let list = recommended;

    if (filterMode === "incomplete") {
      list = list.filter((s) => s.case_count < s.required_count);
    } else if (filterMode === "low_exposure") {
      list = list.filter((s) => s.case_count <= 1);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.full_name.toLowerCase().includes(q) ||
          (s.section && s.section.toLowerCase().includes(q)),
      );
    }

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "priority": {
          const order = { high: 0, medium: 1, low: 2 };
          return order[a.priority] - order[b.priority] || a.case_count - b.case_count;
        }
        case "total_cases":
          return a.total_cases - b.total_cases;
        case "case_count":
          return a.case_count - b.case_count;
        case "last_assigned": {
          const aDate = a.last_assigned ?? "";
          const bDate = b.last_assigned ?? "";
          return aDate.localeCompare(bDate);
        }
        case "location_count":
          return b.location_count - a.location_count;
        default:
          return 0;
      }
    });

    return list;
  }, [recommended, search, sortBy, filterMode]);

  const [singleState, singleAction] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      const result = await createAssignment(formData);
      if (!result || result.success) {
        setSelected(new Set());
        return { error: null, success: true, message: "Assignment created." };
      }
      return { error: result.error ?? "Unknown error.", success: false };
    },
    initialState,
  );

  const [bulkState, bulkAction] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      const result = await bulkAssign(formData);
      if (!result || result.success) {
        setSelected(new Set());
        return { error: null, success: true, message: `${result?.count ?? 0} assignments created.` };
      }
      return { error: result.error ?? "Unknown error.", success: false };
    },
    initialState,
  );

  const state = selected.size > 1 ? bulkState : singleState;

  const handleCheckConflicts = useCallback(
    (date: string, locationId: string) => {
      if (!date || !locationId || selected.size === 0) {
        setWarnings([]);
        return;
      }
      startTransition(async () => {
        const w = await checkConflicts(Array.from(selected), date, locationId);
        setWarnings(w);
      });
    },
    [selected, startTransition],
  );

  const isBulk = selected.size > 1;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      {selectedCaseTypeId && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-surface px-3 py-2 text-center">
            <p className="text-lg font-bold text-(--status-rejected)">{quickStats.needCase}</p>
            <p className="text-[10px] text-(--text-muted) uppercase tracking-wider">Need this case</p>
          </div>
          <div className="rounded-lg border border-border bg-surface px-3 py-2 text-center">
            <p className="text-lg font-bold text-(--status-processed)">{quickStats.completedPct}%</p>
            <p className="text-[10px] text-(--text-muted) uppercase tracking-wider">Met requirement</p>
          </div>
          <div className="rounded-lg border border-border bg-surface px-3 py-2 text-center">
            <p className="text-lg font-bold text-foreground">{quickStats.totalStudents}</p>
            <p className="text-[10px] text-(--text-muted) uppercase tracking-wider">Total students</p>
          </div>
        </div>
      )}

      {/* Assignment form */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-(--text-secondary)">
          {isBulk ? `Bulk Assign (${selected.size} selected)` : "Create Assignment"}
        </h2>
        <form action={isBulk ? bulkAction : singleAction} className="space-y-4">
          {isBulk ? (
            <input type="hidden" name="student_ids" value={JSON.stringify(Array.from(selected))} />
          ) : (
            <input type="hidden" name="student_id" value={Array.from(selected)[0] ?? ""} />
          )}

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
              <option value="">Select case type...</option>
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
              onChange={(e) => {
                const dateInput = document.querySelector<HTMLInputElement>("input[name=scheduled_date]");
                if (dateInput?.value) handleCheckConflicts(dateInput.value, e.target.value);
              }}
              className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Select location...</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
              Start Date <span className="text-(--status-rejected)">*</span>
              {semesterWindow && (
                <span className="ml-1 text-(--text-muted) font-normal">
                  ({semesterWindow.name})
                </span>
              )}
            </label>
            <input
              type="date"
              name="scheduled_date"
              required
              min={semesterWindow?.start ?? undefined}
              max={semesterWindow?.end ?? undefined}
              onChange={(e) => {
                const locSelect = document.querySelector<HTMLSelectElement>("select[name=location_id]");
                if (locSelect?.value) handleCheckConflicts(e.target.value, locSelect.value);
                // Warn if outside semester window
                if (semesterWindow && e.target.value) {
                  const d = e.target.value;
                  const outOfRange =
                    d < semesterWindow.start ||
                    (semesterWindow.end ? d > semesterWindow.end : false);
                  if (outOfRange) {
                    setWarnings((prev) => {
                      const filtered = prev.filter((w) => w.type !== "out_of_semester");
                      return [
                        ...filtered,
                        {
                          type: "out_of_semester" as const,
                          studentName: "All",
                          reason: `Date is outside the active semester (${semesterWindow.start}${semesterWindow.end ? ` – ${semesterWindow.end}` : ""})`,
                        },
                      ];
                    });
                  } else {
                    setWarnings((prev) => prev.filter((w) => w.type !== "out_of_semester"));
                  }
                }
              }}
              className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
              End Date <span className="text-(--text-muted) font-normal">(optional, for multi-day)</span>
            </label>
            <input
              type="date"
              name="end_date"
              min={semesterWindow?.start ?? undefined}
              max={semesterWindow?.end ?? undefined}
              className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
              Time <span className="text-(--text-muted) font-normal">(optional)</span>
            </label>
            <input
              type="time"
              name="scheduled_time"
              className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
              Notes
            </label>
            <input
              type="text"
              name="notes"
              placeholder="Optional notes..."
              className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground placeholder-(--text-muted) focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Conflict warnings */}
          {warnings.length > 0 && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2.5">
              <p className="mb-1 text-xs font-semibold text-yellow-400">Conflicts detected:</p>
              <ul className="space-y-0.5">
                {warnings.map((w, i) => (
                  <li key={i} className="text-xs text-yellow-300">
                    <span className="font-medium">{w.studentName}</span> � {w.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {state.error && (
            <p className="text-sm text-(--status-rejected)">{state.error}</p>
          )}
          {state.success && (
            <p className="text-sm text-(--status-processed)">{state.message}</p>
          )}

          <SubmitButton
            variant="primary"
            label={isBulk ? `Assign ${selected.size} Students` : "Assign"}
            loadingLabel="Assigning..."
          />
        </form>
      </div>

      {/* Student list controls */}
      <div>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-(--text-secondary)">
            Students ({filteredStudents.length})
          </h2>
          <button
            type="button"
            onClick={() => selectAllFiltered(filteredStudents.map((s) => s.id))}
            className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-(--text-secondary) hover:bg-elevated transition-colors"
          >
            {filteredStudents.every((s) => selected.has(s.id)) && filteredStudents.length > 0
              ? "Deselect All"
              : "Select All"}
          </button>
        </div>

        {/* Search + Sort + Filter bar */}
        <div className="mb-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-elevated px-3 py-1.5 text-sm text-foreground placeholder-(--text-muted) focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded-lg border border-border bg-elevated px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="priority">Sort: Priority</option>
            <option value="case_count">Sort: Least exposure</option>
            <option value="total_cases">Sort: Lowest total</option>
            <option value="last_assigned">Sort: Least recent</option>
            <option value="location_count">Sort: Most at location</option>
          </select>
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as "all" | "incomplete" | "low_exposure")}
            className="rounded-lg border border-border bg-elevated px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="all">Filter: All</option>
            <option value="incomplete">Incomplete only</option>
            <option value="low_exposure">Low exposure</option>
          </select>
        </div>

        {/* Student list */}
        {filteredStudents.length === 0 ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-border py-10">
            <p className="text-xs text-(--text-muted)">
              {selectedCaseTypeId ? "No matching students" : "Select a case type to see recommendations"}
            </p>
          </div>
        ) : (
          <ul className="space-y-1.5 max-h-120 overflow-y-auto pr-1">
            {filteredStudents.map((s) => {
              const p = PRIORITY_LABEL[s.priority];
              const isSelected = selected.has(s.id);
              return (
                <li
                  key={s.id}
                  onClick={() => toggleStudent(s.id)}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                    isSelected
                      ? "border-accent bg-accent/10"
                      : "border-border bg-surface hover:bg-elevated"
                  }`}
                >
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      isSelected ? "border-accent bg-accent" : "border-border"
                    }`}
                  >
                    {isSelected && (
                      <svg className="h-3 w-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{s.full_name}</p>
                    <p className="text-xs text-(--text-muted)">
                      {s.section ?? "No section"}
                      {" \u00B7 "}
                      <span className={s.case_count < s.required_count ? "text-(--status-rejected)" : "text-(--status-processed)"}>
                        {s.case_count}/{s.required_count}
                      </span>
                      {" this type \u00B7 "}
                      {s.total_cases} total
                      {s.last_assigned && ` \u00B7 Last: ${s.last_assigned}`}
                    </p>
                  </div>

                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${p.color} ${p.bg}`}>
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
