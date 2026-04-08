import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import AssignForm from "./AssignForm";
import { updateAssignmentStatus } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";

const STATUS_STYLE: Record<string, string> = {
  assigned: "text-(--status-assigned) bg-blue-500/10",
  completed: "text-(--status-completed) bg-green-500/10",
  missed: "text-(--status-rejected) bg-red-500/10",
  cancel_requested: "text-amber-400 bg-amber-500/10",
  cancelled: "text-(--text-muted) bg-neutral-500/10",
};

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ case_type?: string }>;
}) {
  const { case_type: selectedCaseTypeId } = await searchParams;
  const supabase = await createClient();

  const [{ data: caseTypes }, { data: locations }, { data: students }] =
    await Promise.all([
      supabase.from("case_types").select("id, name").eq("is_active", true).order("name"),
      supabase.from("locations").select("id, name").eq("is_active", true).order("name"),
      supabase
        .from("profiles")
        .select("id, full_name, section")
        .eq("role", "student")
        .eq("is_active", true)
        .order("full_name"),
    ]);

  // Build enriched student list
  let recommended: {
    id: string;
    full_name: string;
    section: string | null;
    case_count: number;
    total_cases: number;
    required_count: number;
    last_assigned: string | null;
    location_count: number;
    priority: "high" | "medium" | "low";
  }[] = [];

  const quickStats = { needCase: 0, completedPct: 0, totalStudents: students?.length ?? 0 };

  if (students && students.length > 0) {
    // All case logs
    const { data: allLogs } = await supabase
      .from("case_logs")
      .select("student_id, case_type_id");

    // All assignments (for last_assigned and location frequency)
    const { data: allAssignments } = await supabase
      .from("assignments")
      .select("student_id, scheduled_date, location_id, status")
      .in("status", ["assigned", "completed"]);

    // Requirement for selected case type
    let requiredCount = 0;
    if (selectedCaseTypeId) {
      const { data: req } = await supabase
        .from("requirements")
        .select("required_count")
        .eq("case_type_id", selectedCaseTypeId)
        .maybeSingle();
      requiredCount = req?.required_count ?? 0;
    }

    // Build per-student stats
    const totalCaseMap: Record<string, number> = {};
    const typeCaseMap: Record<string, number> = {};
    for (const log of allLogs ?? []) {
      totalCaseMap[log.student_id] = (totalCaseMap[log.student_id] ?? 0) + 1;
      if (selectedCaseTypeId && log.case_type_id === selectedCaseTypeId) {
        typeCaseMap[log.student_id] = (typeCaseMap[log.student_id] ?? 0) + 1;
      }
    }

    const lastAssignedMap: Record<string, string> = {};
    const locationCountMap: Record<string, number> = {};
    for (const a of allAssignments ?? []) {
      if (!lastAssignedMap[a.student_id] || a.scheduled_date > lastAssignedMap[a.student_id]) {
        lastAssignedMap[a.student_id] = a.scheduled_date;
      }
      locationCountMap[a.student_id] = (locationCountMap[a.student_id] ?? 0) + 1;
    }

    recommended = students.map((s) => {
      const caseCount = selectedCaseTypeId ? (typeCaseMap[s.id] ?? 0) : 0;
      const totalCases = totalCaseMap[s.id] ?? 0;
      const priority: "high" | "medium" | "low" =
        selectedCaseTypeId
          ? caseCount === 0 ? "high" : caseCount < requiredCount ? "medium" : "low"
          : "medium";
      return {
        id: s.id,
        full_name: s.full_name,
        section: s.section,
        case_count: caseCount,
        total_cases: totalCases,
        required_count: requiredCount,
        last_assigned: lastAssignedMap[s.id] ?? null,
        location_count: locationCountMap[s.id] ?? 0,
        priority,
      };
    }).sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority] || a.case_count - b.case_count;
    });

    // Quick stats
    if (selectedCaseTypeId) {
      quickStats.needCase = recommended.filter((s) => s.case_count === 0).length;
      const metCount = recommended.filter((s) => s.case_count >= requiredCount && requiredCount > 0).length;
      quickStats.completedPct = quickStats.totalStudents > 0
        ? Math.round((metCount / quickStats.totalStudents) * 100)
        : 0;
    }
  }

  // Active semester for scheduling window
  const { data: activeSemester } = await supabase
    .from("semesters")
    .select("name, start_date, end_date")
    .eq("is_active", true)
    .maybeSingle();

  // Existing assignments
  const { data: assignments } = await supabase
    .from("assignments")
    .select(
      "id, scheduled_date, end_date, start_time, end_time, status, notes, cancellation_reason, student:profiles!student_id(full_name), case_type:case_types(name), location:locations(name)"
    )
    .order("scheduled_date", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-foreground">Assignments</h1>
        <p className="mt-1 text-sm text-(--text-secondary)">
          Assign students to cases. Select one or multiple students for bulk assignment.
        </p>
      </div>

      {/* Case type filter */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-(--text-secondary) shrink-0">
          Filter by case type:
        </label>
        <div className="flex flex-wrap gap-2">
          <a
            href="/admin/assignments"
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !selectedCaseTypeId
                ? "bg-accent text-black"
                : "bg-surface text-(--text-secondary) hover:bg-elevated"
            }`}
          >
            All
          </a>
          {(caseTypes ?? []).map((ct) => (
            <a
              key={ct.id}
              href={`/admin/assignments?case_type=${ct.id}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                ct.id === selectedCaseTypeId
                  ? "bg-accent text-black"
                  : "bg-surface text-(--text-secondary) hover:bg-elevated"
              }`}
            >
              {ct.name}
            </a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left: form + recommendations */}
        <AssignForm
          caseTypes={caseTypes ?? []}
          locations={locations ?? []}
          recommended={recommended}
          selectedCaseTypeId={selectedCaseTypeId}
          quickStats={quickStats}
          semesterWindow={
            activeSemester
              ? {
                  name: activeSemester.name,
                  start: activeSemester.start_date,
                  end: activeSemester.end_date ?? null,
                }
              : null
          }
        />

        {/* Right: existing assignments */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-(--text-secondary)">
            Recent Assignments
          </h2>
          {(assignments ?? []).length === 0 ? (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-border py-12">
              <p className="text-xs text-(--text-muted)">No assignments yet</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {(assignments ?? []).map((a) => {
                const student = Array.isArray(a.student) ? a.student[0] : a.student;
                const caseType = Array.isArray(a.case_type) ? a.case_type[0] : a.case_type;
                const location = Array.isArray(a.location) ? a.location[0] : a.location;
                const statusStyle = STATUS_STYLE[a.status] ?? STATUS_STYLE.assigned;

                return (
                  <li
                    key={a.id}
                    className="rounded-xl border border-border bg-surface px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {student?.full_name ?? "\u2014"}
                        </p>
                        <p className="text-xs text-(--text-muted)">
                          {caseType?.name ?? "\u2014"} \u00B7 {location?.name ?? "\u2014"}
                        </p>
                        <p className="text-xs text-(--text-muted)">
                          {format(new Date(a.scheduled_date), "MMM d, yyyy")}
                          {a.end_date && a.end_date !== a.scheduled_date && ` – ${format(new Date(a.end_date), "MMM d, yyyy")}`}
                          {a.start_time && ` ${a.start_time.slice(0, 5)}`}
                          {a.end_time && `–${a.end_time.slice(0, 5)}`}
                          {a.notes && ` · ${a.notes}`}
                        </p>
                        {a.cancellation_reason && (
                          <p className="text-xs text-amber-400/80 mt-0.5">
                            Cancel reason: {a.cancellation_reason}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyle}`}>
                          {a.status === "cancel_requested" ? "Cancel Req" : a.status}
                        </span>
                        {a.status === "assigned" && (
                          <div className="flex gap-1">
                            <form action={updateAssignmentStatus}>
                              <input type="hidden" name="assignment_id" value={a.id} />
                              <input type="hidden" name="status" value="completed" />
                              <SubmitButton variant="ghost" label="Complete" />
                            </form>
                            <form action={updateAssignmentStatus}>
                              <input type="hidden" name="assignment_id" value={a.id} />
                              <input type="hidden" name="status" value="missed" />
                              <SubmitButton variant="danger" label="Missed" />
                            </form>
                            <form action={updateAssignmentStatus}>
                              <input type="hidden" name="assignment_id" value={a.id} />
                              <input type="hidden" name="status" value="cancelled" />
                              <SubmitButton variant="ghost" label="Cancel" />
                            </form>
                          </div>
                        )}
                        {a.status === "cancel_requested" && (
                          <div className="flex gap-1">
                            <form action={updateAssignmentStatus}>
                              <input type="hidden" name="assignment_id" value={a.id} />
                              <input type="hidden" name="status" value="cancelled" />
                              <SubmitButton variant="danger" label="Approve" />
                            </form>
                            <form action={updateAssignmentStatus}>
                              <input type="hidden" name="assignment_id" value={a.id} />
                              <input type="hidden" name="status" value="assigned" />
                              <SubmitButton variant="ghost" label="Deny" />
                            </form>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
