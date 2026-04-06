import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import AssignForm from "./AssignForm";
import { updateAssignmentStatus } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";

const STATUS_STYLE = {
  assigned: "text-(--status-assigned) bg-blue-500/10",
  completed: "text-(--status-completed) bg-green-500/10",
  missed: "text-(--status-rejected) bg-red-500/10",
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

  // Build recommended list when case type is known
  let recommended: {
    id: string;
    full_name: string;
    section: string | null;
    case_count: number;
    required_count: number;
    priority: "high" | "medium" | "low";
  }[] = [];

  if (selectedCaseTypeId && students) {
    // Get required count for this case type
    const { data: req } = await supabase
      .from("requirements")
      .select("required_count")
      .eq("case_type_id", selectedCaseTypeId)
      .maybeSingle();
    const requiredCount = req?.required_count ?? 0;

    // Count completed case logs per student for this case type
    const { data: logs } = await supabase
      .from("case_logs")
      .select("student_id")
      .eq("case_type_id", selectedCaseTypeId);

    const countMap: Record<string, number> = {};
    for (const log of logs ?? []) {
      countMap[log.student_id] = (countMap[log.student_id] ?? 0) + 1;
    }

    recommended = students
      .map((s) => {
        const count = countMap[s.id] ?? 0;
        const priority: "high" | "medium" | "low" =
          count === 0 ? "high" : count < requiredCount ? "medium" : "low";
        return {
          id: s.id,
          full_name: s.full_name,
          section: s.section,
          case_count: count,
          required_count: requiredCount,
          priority,
        };
      })
      .sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.priority] - order[b.priority] || a.full_name.localeCompare(b.full_name);
      });
  } else if (students) {
    // No case type selected — show all students unranked
    recommended = students.map((s) => ({
      id: s.id,
      full_name: s.full_name,
      section: s.section,
      case_count: 0,
      required_count: 0,
      priority: "medium" as const,
    }));
  }

  // Existing assignments
  const { data: assignments } = await supabase
    .from("assignments")
    .select(
      "id, scheduled_date, status, student:profiles!student_id(full_name), case_type:case_types(name), location:locations(name)"
    )
    .order("scheduled_date", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-foreground">Assignments</h1>
        <p className="mt-1 text-sm text-(--text-secondary)">
          Assign students to cases. Recommendations are sorted by exposure priority.
        </p>
      </div>

      {/* Case type filter for recommendations */}
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
                const statusStyle = STATUS_STYLE[a.status as keyof typeof STATUS_STYLE] ?? STATUS_STYLE.assigned;

                return (
                  <li
                    key={a.id}
                    className="rounded-xl border border-border bg-surface px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {student?.full_name ?? "—"}
                        </p>
                        <p className="text-xs text-(--text-muted)">
                          {caseType?.name ?? "—"} · {location?.name ?? "—"}
                        </p>
                        <p className="text-xs text-(--text-muted)">
                          {format(new Date(a.scheduled_date), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyle}`}>
                          {a.status}
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
