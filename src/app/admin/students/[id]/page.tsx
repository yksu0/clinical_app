import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminStudentProfilePage({ params }: PageProps) {
  const supabase = await createClient();

  const { id } = await params;

  const [profileRes, caseTypesRes, requirementsRes, caseLogsRes, assignmentsRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, section, is_verified, is_active")
        .eq("id", id)
        .single(),
      supabase.from("case_types").select("id, name").eq("is_active", true),
      supabase.from("requirements").select("case_type_id, required_count"),
      supabase
        .from("case_logs")
        .select("id, date, notes, case_type_id, case_types(name), locations(name)")
        .eq("student_id", id)
        .order("date", { ascending: false }),
      supabase
        .from("assignments")
        .select("id, scheduled_date, status, notes, case_types(name), locations(name)")
        .eq("student_id", id)
        .order("scheduled_date", { ascending: false }),
    ]);

  if (!profileRes.data) notFound();

  const profile = profileRes.data;
  const caseTypes = caseTypesRes.data ?? [];
  const requirements = requirementsRes.data ?? [];
  const caseLogs = caseLogsRes.data ?? [];
  const assignments = assignmentsRes.data ?? [];

  // Requirement map
  const reqMap: Record<string, number> = {};
  for (const r of requirements) {
    reqMap[r.case_type_id] = (reqMap[r.case_type_id] ?? 0) + r.required_count;
  }
  const totalRequired = Object.values(reqMap).reduce((s, n) => s + n, 0);

  // Per case type completed
  const casesByType: Record<string, number> = {};
  for (const log of caseLogs) {
    casesByType[log.case_type_id] = (casesByType[log.case_type_id] ?? 0) + 1;
  }

  const completedRequired = Object.entries(reqMap).reduce(
    (sum, [ctId, req]) => sum + Math.min(casesByType[ctId] ?? 0, req),
    0
  );
  const completionPct =
    totalRequired > 0
      ? Math.round((completedRequired / totalRequired) * 100)
      : 0;

  type CaseLogRow = {
    id: string;
    date: string;
    notes: string | null;
    case_type_id: string;
    case_types: { name: string } | null;
    locations: { name: string } | null;
  };

  type AssignmentRow = {
    id: string;
    scheduled_date: string;
    status: string;
    notes: string | null;
    case_types: { name: string } | null;
    locations: { name: string } | null;
  };

  const typedLogs = caseLogs as unknown as CaseLogRow[];
  const typedAssignments = assignments as unknown as AssignmentRow[];

  const statusColors: Record<string, string> = {
    assigned: "bg-accent/20 text-accent",
    completed: "bg-green-500/20 text-green-400",
    missed: "bg-red-500/20 text-red-400",
    cancelled: "bg-(--text-muted)/20 text-(--text-muted)",
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Back */}
      <Link
        href="/admin/students"
        className="text-xs text-(--text-muted) hover:text-(--text-secondary) transition-colors"
      >
        ← Back to Students
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {profile.full_name}
            </h1>
            <p className="text-sm text-(--text-muted)">{profile.email}</p>
            {profile.section && (
              <p className="text-xs text-(--text-muted) mt-0.5">
                {profile.section}
              </p>
            )}
            <div className="flex gap-2 mt-2">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  profile.is_verified
                    ? "bg-green-500/20 text-green-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}
              >
                {profile.is_verified ? "Verified" : "Unverified"}
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  profile.is_active
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {profile.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p
              className={`text-2xl font-bold ${
                completionPct >= 100
                  ? "text-green-400"
                  : completionPct >= 50
                    ? "text-accent"
                    : "text-red-400"
              }`}
            >
              {completionPct}%
            </p>
            <p className="text-xs text-(--text-muted)">Complete</p>
          </div>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-elevated p-3">
            <p className="text-lg font-bold text-foreground">
              {caseLogs.length}
            </p>
            <p className="text-xs text-(--text-muted)">Cases Logged</p>
          </div>
          <div className="rounded-lg bg-elevated p-3">
            <p className="text-lg font-bold text-foreground">
              {typedAssignments.filter((a) => a.status === "assigned").length}
            </p>
            <p className="text-xs text-(--text-muted)">Open Assignments</p>
          </div>
          <div className="rounded-lg bg-elevated p-3">
            <p className="text-lg font-bold text-foreground">
              {totalRequired}
            </p>
            <p className="text-xs text-(--text-muted)">Required Total</p>
          </div>
        </div>

        {/* Per Case Type Progress */}
        {caseTypes.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">
              Requirements
            </p>
            {caseTypes.map((ct) => {
              const req = reqMap[ct.id] ?? 0;
              const done = casesByType[ct.id] ?? 0;
              const pct =
                req > 0 ? Math.min(100, Math.round((done / req) * 100)) : 0;
              const met = req > 0 && done >= req;
              return (
                <div key={ct.id}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-(--text-secondary)">
                      {ct.name}
                    </span>
                    <span
                      className={`text-xs font-semibold ${met ? "text-green-400" : "text-accent"}`}
                    >
                      {done}/{req || "—"}
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-elevated">
                    <div
                      className={`h-2.5 rounded-full transition-all ${met ? "bg-green-500" : "bg-accent"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Case Log History */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-(--text-secondary) uppercase tracking-wider">
          Case History ({typedLogs.length})
        </h2>
        {typedLogs.length === 0 ? (
          <EmptyState message="No cases logged yet." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="divide-y divide-border">
              {typedLogs.map((log) => (
                <div
                  key={log.id}
                  className="grid grid-cols-[1fr_1fr_120px] gap-2 items-center px-4 py-3"
                >
                  <span className="text-sm text-foreground">
                    {log.case_types?.name ?? "—"}
                  </span>
                  <span className="text-sm text-(--text-secondary)">
                    {log.locations?.name ?? "—"}
                  </span>
                  <span className="text-sm text-(--text-muted) text-right">
                    {log.date
                      ? new Date(log.date).toLocaleDateString("en-AU", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </span>
                  {log.notes && (
                    <p className="col-span-3 text-xs text-(--text-muted) -mt-1 pb-1">
                      {log.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Assignments */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-(--text-secondary) uppercase tracking-wider">
          Assignments ({typedAssignments.length})
        </h2>
        {typedAssignments.length === 0 ? (
          <EmptyState message="No assignments." />
        ) : (
          <div className="space-y-2">
            {typedAssignments.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {a.case_types?.name ?? "—"}
                  </p>
                  <p className="text-xs text-(--text-muted)">
                    {a.locations?.name ?? "—"} &middot;{" "}
                    {a.scheduled_date
                      ? new Date(a.scheduled_date).toLocaleDateString(
                          "en-AU",
                          { day: "numeric", month: "short", year: "numeric" }
                        )
                      : "—"}
                  </p>
                  {a.notes && (
                    <p className="text-xs text-(--text-muted) mt-1">
                      {a.notes}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                    statusColors[a.status] ?? "bg-elevated text-(--text-muted)"
                  }`}
                >
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-8 text-center">
      <p className="text-sm text-(--text-muted)">{message}</p>
    </div>
  );
}
