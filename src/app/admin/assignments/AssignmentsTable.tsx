"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { updateAssignmentStatus } from "./actions";
import { ArrowUpDown, ArrowUp, ArrowDown, Maximize2, Minimize2 } from "lucide-react";

const STATUS_STYLE: Record<string, string> = {
  scheduled: "text-blue-400 bg-blue-500/10",
  completed: "text-green-400 bg-green-500/10",
  missed: "text-red-400 bg-red-500/10",
  cancel_requested: "text-amber-400 bg-amber-500/10",
  cancelled: "text-neutral-400 bg-neutral-500/10",
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "scheduled", label: "Scheduled" },
  { key: "completed", label: "Completed" },
  { key: "missed", label: "Missed" },
  { key: "cancel_requested", label: "Cancel Req." },
  { key: "cancelled", label: "Cancelled" },
] as const;

export type TableAssignment = {
  id: string;
  scheduled_date: string;
  end_date: string | null;
  status: string;
  notes: string | null;
  cancellation_reason: string | null;
  student: { full_name: string } | null;
  location: { name: string } | null;
  shift: { name: string } | null;
  rotation: { name: string } | null;
  ci: { full_name: string } | null;
};

type SortKey = "student" | "location" | "date" | "status";
type SortDir = "asc" | "desc";

interface Props {
  assignments: TableAssignment[];
}

function ActionBtn({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default function AssignmentsTable({ assignments }: Props) {
  const [filter, setFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expanded, setExpanded] = useState(false);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: assignments.length };
    for (const a of assignments) c[a.status] = (c[a.status] ?? 0) + 1;
    return c;
  }, [assignments]);

  const filtered = useMemo(() => {
    const rows = filter === "all" ? [...assignments] : assignments.filter((a) => a.status === filter);
    return rows.sort((a, b) => {
      let av = "", bv = "";
      if (sortKey === "student") { av = a.student?.full_name ?? ""; bv = b.student?.full_name ?? ""; }
      else if (sortKey === "location") { av = a.location?.name ?? ""; bv = b.location?.name ?? ""; }
      else if (sortKey === "date") { av = a.scheduled_date; bv = b.scheduled_date; }
      else if (sortKey === "status") { av = a.status; bv = b.status; }
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [assignments, filter, sortKey, sortDir]);

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  }

  const shell = expanded
    ? "fixed inset-4 z-40 flex flex-col rounded-xl border border-border bg-surface shadow-2xl overflow-hidden"
    : "rounded-xl border border-border bg-surface overflow-hidden";

  return (
    <>
      {/* Backdrop when expanded */}
      {expanded && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={() => setExpanded(false)}
        />
      )}

      <div className={shell}>
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5 bg-surface shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-foreground">All Assignments</h2>
            <span className="rounded-full bg-elevated border border-border px-2 py-0.5 text-xs text-(--text-muted)">
              {counts[filter] ?? 0} {filter !== "all" ? `/ ${assignments.length}` : "total"}
            </span>
          </div>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="rounded-lg p-1.5 text-(--text-secondary) hover:bg-elevated hover:text-foreground transition-colors"
            title={expanded ? "Collapse" : "Expand to full view"}
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-border px-4 py-2.5 shrink-0">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === key
                  ? "bg-accent text-black"
                  : "text-(--text-secondary) hover:bg-elevated hover:text-foreground"
              }`}
            >
              {label}
              {counts[key] != null && counts[key] > 0 && (
                <span className="ml-1.5 opacity-70">{counts[key]}</span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className={`overflow-auto ${expanded ? "flex-1" : "max-h-120"}`}>
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center py-14">
              <p className="text-xs text-(--text-muted)">No assignments match this filter</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-elevated">
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-2.5">
                    <button
                      className="flex items-center gap-1 text-xs font-medium text-(--text-secondary) hover:text-foreground transition-colors"
                      onClick={() => toggleSort("student")}
                    >
                      Student <SortIcon col="student" />
                    </button>
                  </th>
                  <th className="px-4 py-2.5">
                    <button
                      className="flex items-center gap-1 text-xs font-medium text-(--text-secondary) hover:text-foreground transition-colors"
                      onClick={() => toggleSort("location")}
                    >
                      Area of Duty <SortIcon col="location" />
                    </button>
                  </th>
                  <th className="px-4 py-2.5">
                    <button
                      className="flex items-center gap-1 text-xs font-medium text-(--text-secondary) hover:text-foreground transition-colors"
                      onClick={() => toggleSort("date")}
                    >
                      Date <SortIcon col="date" />
                    </button>
                  </th>
                  <th className="hidden md:table-cell px-4 py-2.5 text-xs font-medium text-(--text-secondary)">
                    Shift / Rotation
                  </th>
                  <th className="px-4 py-2.5">
                    <button
                      className="flex items-center gap-1 text-xs font-medium text-(--text-secondary) hover:text-foreground transition-colors"
                      onClick={() => toggleSort("status")}
                    >
                      Status <SortIcon col="status" />
                    </button>
                  </th>
                  <th className="px-4 py-2.5 text-xs font-medium text-(--text-secondary)">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-elevated/40 transition-colors">
                    {/* Student + CI + notes */}
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-foreground">
                        {a.student?.full_name ?? "—"}
                      </p>
                      {a.ci && (
                        <p className="text-xs text-(--text-muted)">CI: {a.ci.full_name}</p>
                      )}
                      {a.notes && (
                        <p className="text-xs text-(--text-muted) truncate max-w-[16ch]">{a.notes}</p>
                      )}
                      {a.cancellation_reason && (
                        <p className="text-xs text-amber-400/80 truncate max-w-[16ch]">{a.cancellation_reason}</p>
                      )}
                    </td>

                    {/* Area */}
                    <td className="px-4 py-3 text-xs text-(--text-secondary) whitespace-nowrap">
                      {a.location?.name ?? "—"}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-xs text-(--text-secondary) whitespace-nowrap">
                      {format(new Date(a.scheduled_date), "MMM d, yyyy")}
                      {a.end_date && a.end_date !== a.scheduled_date && (
                        <span className="block text-(--text-muted)">
                          → {format(new Date(a.end_date), "MMM d, yyyy")}
                        </span>
                      )}
                    </td>

                    {/* Shift / Rotation */}
                    <td className="hidden md:table-cell px-4 py-3 text-xs text-(--text-secondary)">
                      {a.shift?.name ?? "—"}
                      {a.rotation?.name && (
                        <span className="block text-(--text-muted)">{a.rotation.name}</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_STYLE[a.status] ?? STATUS_STYLE.scheduled
                        }`}
                      >
                        {a.status === "cancel_requested" ? "Cancel Req." : a.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {a.status === "scheduled" && (
                          <>
                            <form action={updateAssignmentStatus}>
                              <input type="hidden" name="assignment_id" value={a.id} />
                              <input type="hidden" name="status" value="completed" />
                              <ActionBtn className="text-green-400 bg-green-500/10 hover:bg-green-500/20">
                                Complete
                              </ActionBtn>
                            </form>
                            <form action={updateAssignmentStatus}>
                              <input type="hidden" name="assignment_id" value={a.id} />
                              <input type="hidden" name="status" value="missed" />
                              <ActionBtn className="text-red-400 bg-red-500/10 hover:bg-red-500/20">
                                Missed
                              </ActionBtn>
                            </form>
                            <form action={updateAssignmentStatus}>
                              <input type="hidden" name="assignment_id" value={a.id} />
                              <input type="hidden" name="status" value="cancelled" />
                              <ActionBtn className="text-(--text-muted) bg-elevated hover:bg-border">
                                Cancel
                              </ActionBtn>
                            </form>
                          </>
                        )}
                        {a.status === "cancel_requested" && (
                          <>
                            <form action={updateAssignmentStatus}>
                              <input type="hidden" name="assignment_id" value={a.id} />
                              <input type="hidden" name="status" value="cancelled" />
                              <ActionBtn className="text-red-400 bg-red-500/10 hover:bg-red-500/20">
                                Approve
                              </ActionBtn>
                            </form>
                            <form action={updateAssignmentStatus}>
                              <input type="hidden" name="assignment_id" value={a.id} />
                              <input type="hidden" name="status" value="scheduled" />
                              <ActionBtn className="text-(--text-muted) bg-elevated hover:bg-border">
                                Deny
                              </ActionBtn>
                            </form>
                          </>
                        )}
                        {["completed", "missed", "cancelled"].includes(a.status) && (
                          <span className="text-xs text-(--text-muted)">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
