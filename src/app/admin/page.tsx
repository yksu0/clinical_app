import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Users, ClipboardList, AlertTriangle, MapPin, BarChart3, ClipboardCheck } from "lucide-react";

const PAGE_SIZE = 25;

type FilterType = "all" | "behind" | "pending_submissions" | "no_cases";

interface PageProps {
  searchParams: Promise<{
    filter?: string;
    search?: string;
    page?: string;
    student?: string;
    section?: string;
  }>;
}

type Profile = {
  id: string;
  full_name: string;
  email: string;
  section: string | null;
};

type StudentRow = Profile & {
  totalCases: number;
  pendingSubmissions: number;
  openAssignments: number;
  casesByType: Record<string, number>;
  isBehind: boolean;
  completionPct: number;
  projectedPct: number;
};

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const params = await searchParams;
  const filter: FilterType = (params.filter as FilterType) ?? "all";
  const search = params.search ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const selectedStudentId = params.student ?? null;
  const sectionFilter = params.section ?? "";

  const [
    profilesRes,
    caseTypesRes,
    requirementsRes,
    caseLogsRes,
    submissionsRes,
    assignmentsRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, section")
      .eq("role", "student")
      .eq("is_active", true)
      .eq("is_verified", true),
    supabase.from("case_types").select("id, name").eq("is_active", true),
    supabase.from("requirements").select("case_type_id, required_count"),
    supabase
      .from("case_logs")
      .select("student_id, case_type_id, area_of_duty_id, date, areas_of_duty(name)"),
    supabase.from("case_submissions").select("student_id, status"),
    supabase.from("assignments").select("student_id, status, case_type_id"),
  ]);

  const profiles: Profile[] = profilesRes.data ?? [];
  const caseTypes = caseTypesRes.data ?? [];
  const requirements = requirementsRes.data ?? [];
  const allLogs = caseLogsRes.data ?? [];
  const allSubmissions = submissionsRes.data ?? [];
  const allAssignments = assignmentsRes.data ?? [];

  const reqMap: Record<string, number> = {};
  for (const r of requirements) {
    reqMap[r.case_type_id] = (reqMap[r.case_type_id] ?? 0) + r.required_count;
  }
  const totalRequired = Object.values(reqMap).reduce((s, n) => s + n, 0);

  const logsByStudent: Record<string, typeof allLogs> = {};
  for (const log of allLogs) {
    (logsByStudent[log.student_id] ??= []).push(log);
  }

  const pendingSubmissionsByStudent: Record<string, number> = {};
  for (const s of allSubmissions) {
    if (s.status === "pending") {
      pendingSubmissionsByStudent[s.student_id] =
        (pendingSubmissionsByStudent[s.student_id] ?? 0) + 1;
    }
  }

  const assignmentsByStudent: Record<string, number> = {};
  const openAssignmentsByStudentType: Record<string, Record<string, number>> = {};
  for (const a of allAssignments) {
    if (a.status === "scheduled") {
      assignmentsByStudent[a.student_id] =
        (assignmentsByStudent[a.student_id] ?? 0) + 1;
      if (a.case_type_id) {
        const s = (openAssignmentsByStudentType[a.student_id] ??= {});
        s[a.case_type_id] = (s[a.case_type_id] ?? 0) + 1;
      }
    }
  }

  const studentRows: StudentRow[] = profiles.map((p) => {
    const logs = logsByStudent[p.id] ?? [];
    const casesByType: Record<string, number> = {};
    for (const log of logs) {
      casesByType[log.case_type_id] = (casesByType[log.case_type_id] ?? 0) + 1;
    }
    const totalCases = logs.length;

    const completedRequired = Math.min(
      Object.entries(reqMap).reduce(
        (sum, [ctId, req]) => sum + Math.min(casesByType[ctId] ?? 0, req),
        0
      ),
      totalRequired
    );
    const completionPct =
      totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0;

    const openByType = openAssignmentsByStudentType[p.id] ?? {};
    const projectedRequired = Math.min(
      Object.entries(reqMap).reduce((sum, [ctId, req]) => {
        const done = casesByType[ctId] ?? 0;
        const pending = openByType[ctId] ?? 0;
        return sum + Math.min(done + pending, req);
      }, 0),
      totalRequired
    );
    const projectedPct =
      totalRequired > 0 ? Math.round((projectedRequired / totalRequired) * 100) : 0;

    const isBehind =
      totalRequired > 0 &&
      projectedPct < 50 &&
      Object.keys(reqMap).some(
        (ctId) =>
          (casesByType[ctId] ?? 0) + (openByType[ctId] ?? 0) < (reqMap[ctId] ?? 0)
      );

    return {
      ...p,
      totalCases,
      pendingSubmissions: pendingSubmissionsByStudent[p.id] ?? 0,
      openAssignments: assignmentsByStudent[p.id] ?? 0,
      casesByType,
      isBehind,
      completionPct,
      projectedPct,
    };
  });

  const totalStudents = studentRows.length;
  const totalCasesLogged = allLogs.length;
  const totalPendingSubmissions = allSubmissions.filter((s) => s.status === "pending").length;
  const studentsBehind = studentRows.filter((s) => s.isBehind).length;

  const caseCountByType: Record<string, number> = {};
  for (const log of allLogs) {
    caseCountByType[log.case_type_id] = (caseCountByType[log.case_type_id] ?? 0) + 1;
  }

  const locationCountMap: Record<string, number> = {};
  for (const log of allLogs) {
    const locName =
      (log.areas_of_duty as unknown as { name: string } | null)?.name ?? "Unknown";
    locationCountMap[locName] = (locationCountMap[locName] ?? 0) + 1;
  }
  const locationEntries = Object.entries(locationCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const sections = [
    ...new Set(studentRows.map((s) => s.section).filter(Boolean)),
  ] as string[];
  sections.sort();

  let filtered = studentRows;
  if (sectionFilter) filtered = filtered.filter((s) => s.section === sectionFilter);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (s) => s.full_name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }
  if (filter === "behind") filtered = filtered.filter((s) => s.isBehind);
  else if (filter === "pending_submissions") filtered = filtered.filter((s) => s.pendingSubmissions > 0);
  else if (filter === "no_cases") filtered = filtered.filter((s) => s.totalCases === 0);

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selectedStudent = selectedStudentId
    ? (studentRows.find((s) => s.id === selectedStudentId) ?? null)
    : null;

  type LogRow = {
    student_id: string;
    case_type_id: string;
    area_of_duty_id: string;
    date: string;
    areas_of_duty: { name: string } | null;
  };

  const selectedLogs: LogRow[] = selectedStudentId
    ? (allLogs.filter((l) => l.student_id === selectedStudentId) as unknown as LogRow[])
    : [];

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p: Record<string, string> = {};
    if (filter !== "all") p.filter = filter;
    if (search) p.search = search;
    if (page !== 1) p.page = String(page);
    if (selectedStudentId) p.student = selectedStudentId;
    if (sectionFilter) p.section = sectionFilter;
    const merged = { ...p, ...overrides };
    const qs = Object.entries(merged)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join("&");
    return `/admin${qs ? `?${qs}` : ""}`;
  }

  const FILTERS: { key: FilterType; label: string; count: number }[] = [
    { key: "all", label: "All Students", count: totalStudents },
    { key: "behind", label: "Falling Behind", count: studentsBehind },
    { key: "pending_submissions", label: "Pending Review", count: studentRows.filter((s) => s.pendingSubmissions > 0).length },
    { key: "no_cases", label: "No Cases Yet", count: studentRows.filter((s) => s.totalCases === 0).length },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Active Students" value={totalStudents} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Cases Logged" value={totalCasesLogged} icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard
          label="Pending Review"
          value={totalPendingSubmissions}
          highlight={totalPendingSubmissions > 0}
          icon={<ClipboardCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Students Behind"
          value={studentsBehind}
          highlight={studentsBehind > 0}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </div>

      {/* Alerts */}
      {(studentsBehind > 0 || totalPendingSubmissions > 0) && (
        <div className="space-y-2">
          {studentsBehind > 0 && (
            <AlertBanner
              type="warning"
              message={`${studentsBehind} student${studentsBehind !== 1 ? "s are" : " is"} falling behind on required case exposure.`}
              href={buildUrl({ filter: "behind", page: "1", student: undefined })}
            />
          )}
          {totalPendingSubmissions > 0 && (
            <AlertBanner
              type="info"
              message={`${totalPendingSubmissions} case submission${totalPendingSubmissions !== 1 ? "s are" : " is"} awaiting review.`}
              href="/admin/cases/review"
            />
          )}
        </div>
      )}

      {/* Distribution Charts */}
      {!selectedStudent && totalCasesLogged > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-accent" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-(--text-secondary)">
                Cases by Type
              </h2>
            </div>
            {caseTypes.map((ct) => {
              const count = caseCountByType[ct.id] ?? 0;
              const pct = totalCasesLogged > 0 ? Math.round((count / totalCasesLogged) * 100) : 0;
              return (
                <div key={ct.id} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate text-xs text-(--text-secondary)">{ct.name}</span>
                  <div className="flex-1 rounded-full bg-elevated h-2.5">
                    <div className="h-2.5 rounded-full bg-accent/70 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-14 text-right text-xs text-(--text-muted)">
                    {count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-(--text-secondary)">
                Top Areas of Duty
              </h2>
            </div>
            {locationEntries.length === 0 ? (
              <p className="text-xs text-(--text-muted)">No data yet.</p>
            ) : (
              locationEntries.map(([loc, count]) => {
                const pct = totalCasesLogged > 0 ? Math.round((count / totalCasesLogged) * 100) : 0;
                return (
                  <div key={loc} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 truncate text-xs text-(--text-secondary)">{loc}</span>
                    <div className="flex-1 rounded-full bg-elevated h-2.5">
                      <div className="h-2.5 rounded-full bg-accent/60 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-14 text-right text-xs text-(--text-muted)">
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Student List + Detail Panel */}
      <div className={`flex gap-6 ${selectedStudent ? "items-start" : ""}`}>
        <div className={`flex min-w-0 flex-col gap-4 ${selectedStudent ? "w-1/2" : "w-full"}`}>
          {/* Filters + Search */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <Link
                  key={f.key}
                  href={buildUrl({ filter: f.key === "all" ? undefined : f.key, page: "1", student: undefined })}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    filter === f.key
                      ? "bg-accent text-black"
                      : "bg-elevated text-(--text-secondary) hover:text-foreground hover:bg-border"
                  }`}
                >
                  {f.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      filter === f.key ? "bg-black/20 text-black" : "bg-border text-(--text-muted)"
                    }`}
                  >
                    {f.count}
                  </span>
                </Link>
              ))}
            </div>

            <form method="GET" action="/admin" className="flex gap-2">
              {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
              <input type="hidden" name="page" value="1" />
              <input
                name="search"
                defaultValue={search}
                placeholder="Search by name or email…"
                className="flex-1 rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground placeholder:text-(--text-muted) focus:border-accent focus:outline-none"
              />
              {sections.length > 0 && (
                <select
                  name="section"
                  defaultValue={sectionFilter}
                  className="rounded-lg border border-border bg-elevated px-2 py-2 text-xs text-foreground focus:border-accent focus:outline-none"
                >
                  <option value="">All Sections</option>
                  {sections.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
              <button
                type="submit"
                className="rounded-lg border border-border bg-elevated px-4 py-2 text-sm text-(--text-secondary) hover:text-foreground transition-colors"
              >
                Search
              </button>
              {(search || sectionFilter) && (
                <Link
                  href={buildUrl({ search: undefined, section: undefined, page: "1" })}
                  className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-(--text-muted) hover:text-foreground transition-colors"
                >
                  Clear
                </Link>
              )}
            </form>
          </div>

          {/* Student Table */}
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="grid grid-cols-[1fr_60px_80px] gap-2 border-b border-border bg-elevated px-4 py-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Student</span>
              <span className="text-center text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Cases</span>
              <span className="text-center text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Complete</span>
            </div>

            {paginated.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-(--text-muted)">
                No students match the current filter.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {paginated.map((s) => {
                  const isSelected = selectedStudentId === s.id;
                  return (
                    <Link
                      key={s.id}
                      href={buildUrl({ student: isSelected ? undefined : s.id })}
                      className={`grid grid-cols-[1fr_60px_80px] items-center gap-2 px-4 py-3 text-sm transition-colors hover:bg-elevated ${
                        isSelected ? "bg-accent/10 ring-1 ring-inset ring-accent/30" : ""
                      }`}
                    >
                      <span>
                        <p className={`font-medium truncate ${isSelected ? "text-accent" : "text-foreground"}`}>
                          {s.full_name}
                        </p>
                        <p className="text-xs text-(--text-muted) truncate">{s.section ?? s.email}</p>
                      </span>
                      <span className={`text-center text-sm ${s.totalCases > 0 ? "text-foreground" : "text-(--text-muted)"}`}>
                        {s.totalCases > 0 ? s.totalCases : "—"}
                      </span>
                      <span className="flex flex-col items-end gap-1">
                        <span className="flex items-center gap-1">
                          <span
                            className={`text-xs font-semibold ${
                              s.completionPct >= 100 ? "text-green-400" : s.projectedPct >= 50 ? "text-accent" : "text-red-400"
                            }`}
                          >
                            {s.completionPct}%
                          </span>
                          {s.projectedPct > s.completionPct && s.completionPct < 100 && (
                            <span className="text-[10px] text-(--text-muted)" title={`Projected with open assignments: ${s.projectedPct}%`}>
                              →{s.projectedPct}%
                            </span>
                          )}
                        </span>
                        <div className="h-1.5 w-full rounded-full bg-elevated min-w-[60px]">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              s.completionPct >= 100 ? "bg-green-500" : s.projectedPct >= 50 ? "bg-accent" : "bg-red-500"
                            }`}
                            style={{ width: `${Math.min(s.completionPct, 100)}%` }}
                          />
                        </div>
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-(--text-muted)">
              <span>
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalFiltered)} of {totalFiltered}
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={buildUrl({ page: String(page - 1) })} className="rounded-lg border border-border bg-elevated px-3 py-1.5 text-xs hover:bg-border transition-colors">
                    ← Prev
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={buildUrl({ page: String(page + 1) })} className="rounded-lg border border-border bg-elevated px-3 py-1.5 text-xs hover:bg-border transition-colors">
                    Next →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Student Detail Panel */}
        {selectedStudent && (
          <aside className="w-1/2 shrink-0 space-y-4">
            <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{selectedStudent.full_name}</p>
                  <p className="text-xs text-(--text-muted)">{selectedStudent.email}</p>
                  {selectedStudent.section && (
                    <p className="text-xs text-(--text-muted)">{selectedStudent.section}</p>
                  )}
                </div>
                <Link
                  href={buildUrl({ student: undefined })}
                  className="text-xs text-(--text-muted) hover:text-foreground transition-colors"
                >
                  ✕
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-elevated p-3">
                  <p className="text-lg font-bold text-accent">{selectedStudent.totalCases}</p>
                  <p className="text-xs text-(--text-muted)">Cases</p>
                </div>
                <div className="rounded-lg bg-elevated p-3">
                  <p className={`text-lg font-bold ${selectedStudent.pendingSubmissions > 0 ? "text-accent" : "text-(--text-muted)"}`}>
                    {selectedStudent.pendingSubmissions || "—"}
                  </p>
                  <p className="text-xs text-(--text-muted)">Pending</p>
                </div>
                <div className="rounded-lg bg-elevated p-3">
                  <p className={`text-lg font-bold ${selectedStudent.completionPct >= 100 ? "text-green-400" : "text-(--text-muted)"}`}>
                    {selectedStudent.completionPct}%
                  </p>
                  <p className="text-xs text-(--text-muted)">Complete</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Requirements</p>
                {caseTypes.length === 0 ? (
                  <p className="text-xs text-(--text-muted)">No requirements set.</p>
                ) : (
                  caseTypes.map((ct) => {
                    const req = reqMap[ct.id] ?? 0;
                    const done = selectedStudent.casesByType[ct.id] ?? 0;
                    const pct = req > 0 ? Math.min(100, Math.round((done / req) * 100)) : 0;
                    const met = req > 0 && done >= req;
                    return (
                      <div key={ct.id}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-(--text-secondary)">{ct.name}</span>
                          <span className={`text-xs font-semibold ${met ? "text-green-400" : "text-accent"}`}>
                            {done}/{req || "—"}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-elevated">
                          <div
                            className={`h-2 rounded-full transition-all ${met ? "bg-green-500" : "bg-accent"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {selectedStudent.isBehind && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                  <p className="text-xs font-semibold text-red-400">Falling Behind</p>
                  <p className="text-xs text-red-400/80 mt-0.5">
                    Less than 50% of required case exposure reached.
                  </p>
                </div>
              )}

              {selectedLogs.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Recent Cases</p>
                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {selectedLogs
                      .slice()
                      .sort((a, b) => (b.date > a.date ? 1 : -1))
                      .slice(0, 10)
                      .map((log, i) => (
                        <div key={i} className="flex justify-between border-b border-border py-1 text-xs">
                          <span className="text-(--text-secondary)">
                            {caseTypes.find((c) => c.id === log.case_type_id)?.name ?? "—"}
                          </span>
                          <span className="text-(--text-muted)">
                            {log.date
                              ? new Date(log.date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })
                              : "—"}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Link
                  href={`/admin/cases/review?tab=log&student=${selectedStudent.id}`}
                  className="flex-1 rounded-lg bg-accent/20 py-2 text-center text-xs font-semibold text-accent hover:bg-accent/30 transition-colors"
                >
                  Log Case
                </Link>
                <Link
                  href={`/admin/assignments?student=${selectedStudent.id}`}
                  className="flex-1 rounded-lg border border-border bg-elevated py-2 text-center text-xs font-semibold text-(--text-secondary) hover:bg-border transition-colors"
                >
                  Assign
                </Link>
                <Link
                  href={`/admin/students/${selectedStudent.id}`}
                  className="flex-1 rounded-lg border border-border bg-elevated py-2 text-center text-xs font-semibold text-(--text-secondary) hover:bg-border transition-colors"
                >
                  Profile
                </Link>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
  icon,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        highlight ? "border-accent/30 bg-accent/10" : "border-border bg-surface"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            highlight ? "bg-accent/20 text-accent" : "bg-elevated text-(--text-muted)"
          }`}
        >
          {icon}
        </div>
        <p className={`text-3xl font-bold ${highlight ? "text-accent" : "text-foreground"}`}>
          {value}
        </p>
      </div>
      <p className="text-xs font-medium text-(--text-muted)">{label}</p>
    </div>
  );
}

function AlertBanner({
  type,
  message,
  href,
}: {
  type: "warning" | "info";
  message: string;
  href: string;
}) {
  const styles =
    type === "warning"
      ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
      : "border-blue-500/30 bg-blue-500/10 text-blue-400";
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-opacity hover:opacity-80 ${styles}`}
    >
      <span>{message}</span>
      <span className="ml-4 text-xs opacity-70">View →</span>
    </Link>
  );
}
