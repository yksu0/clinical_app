import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Users, ClipboardList, Upload, AlertTriangle, MapPin, BarChart3 } from "lucide-react";

const PAGE_SIZE = 25;

type FilterType =
  | "all"
  | "behind"
  | "pending_uploads"
  | "open_assignments"
  | "low_activity";

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
  pendingUploads: number;
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

  // ── Fetch All Reference Data ──────────────────────────────────────────────
  const [
    profilesRes,
    caseTypesRes,
    requirementsRes,
    caseLogsRes,
    uploadsRes,
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
      .select("student_id, case_type_id, location_id, date, locations(name)"),
    supabase
      .from("uploads")
      .select("student_id, status, uploaded_at"),
    supabase
      .from("assignments")
      .select("student_id, status, case_type_id"),
  ]);

  const profiles: Profile[] = profilesRes.data ?? [];
  const caseTypes = caseTypesRes.data ?? [];
  const requirements = requirementsRes.data ?? [];
  const allLogs = caseLogsRes.data ?? [];
  const allUploads = uploadsRes.data ?? [];
  const allAssignments = assignmentsRes.data ?? [];

  // ── Aggregated Requirement Map: case_type_id → total required ─────────────
  const reqMap: Record<string, number> = {};
  for (const r of requirements) {
    reqMap[r.case_type_id] = (reqMap[r.case_type_id] ?? 0) + r.required_count;
  }
  const totalRequired = Object.values(reqMap).reduce((s, n) => s + n, 0);

  // ── Per-Student Aggregation ───────────────────────────────────────────────
  const logsByStudent: Record<string, typeof allLogs> = {};
  for (const log of allLogs) {
    (logsByStudent[log.student_id] ??= []).push(log);
  }

  const uploadsByStudent: Record<string, number> = {};
  for (const u of allUploads) {
    if (u.status === "pending") {
      uploadsByStudent[u.student_id] = (uploadsByStudent[u.student_id] ?? 0) + 1;
    }
  }

  const assignmentsByStudent: Record<string, number> = {};
  // Also track open assignments per case type per student for projected completion
  const openAssignmentsByStudentType: Record<string, Record<string, number>> = {};
  for (const a of allAssignments) {
    if (a.status === "assigned") {
      assignmentsByStudent[a.student_id] =
        (assignmentsByStudent[a.student_id] ?? 0) + 1;
      if (a.case_type_id) {
        const s = (openAssignmentsByStudentType[a.student_id] ??= {});
        s[a.case_type_id] = (s[a.case_type_id] ?? 0) + 1;
      }
    }
  }

  // ── Build StudentRow array ────────────────────────────────────────────────
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
      totalRequired > 0
        ? Math.round((completedRequired / totalRequired) * 100)
        : 0;

    // Projected completion counts open assignments as future cases (capped at requirement)
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
      totalRequired > 0
        ? Math.round((projectedRequired / totalRequired) * 100)
        : 0;

    // Only mark "behind" if projected completion (actual + open assignments) is < 50%
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
      pendingUploads: uploadsByStudent[p.id] ?? 0,
      openAssignments: assignmentsByStudent[p.id] ?? 0,
      casesByType,
      isBehind,
      completionPct,
      projectedPct,
    };
  });

  // ── Summary Stats ─────────────────────────────────────────────────────────
  const totalStudents = studentRows.length;
  const totalCasesLogged = allLogs.length;
  const totalPendingUploads = allUploads.filter((u) => u.status === "pending").length;
  const totalOpenAssignments = allAssignments.filter(
    (a) => a.status === "assigned"
  ).length;
  const studentsBehind = studentRows.filter((s) => s.isBehind).length;

  // ── Case Distribution by Type ─────────────────────────────────────────────
  const caseCountByType: Record<string, number> = {};
  for (const log of allLogs) {
    caseCountByType[log.case_type_id] =
      (caseCountByType[log.case_type_id] ?? 0) + 1;
  }

  // ── Location Distribution ─────────────────────────────────────────────────
  const locationCountMap: Record<string, number> = {};
  for (const log of allLogs) {
    const locName =
      (log.locations as unknown as { name: string } | null)?.name ?? "Unknown";
    locationCountMap[locName] = (locationCountMap[locName] ?? 0) + 1;
  }
  const locationEntries = Object.entries(locationCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // ── Unique sections for filtering ─────────────────────────────────────────
  const sections = [...new Set(studentRows.map((s) => s.section).filter(Boolean))] as string[];
  sections.sort();

  // ── Apply Filters ─────────────────────────────────────────────────────────
  let filtered = studentRows;

  if (sectionFilter) {
    filtered = filtered.filter((s) => s.section === sectionFilter);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
    );
  }

  if (filter === "behind") {
    filtered = filtered.filter((s) => s.isBehind);
  } else if (filter === "pending_uploads") {
    filtered = filtered.filter((s) => s.pendingUploads > 0);
  } else if (filter === "open_assignments") {
    filtered = filtered.filter((s) => s.openAssignments > 0);
  } else if (filter === "low_activity") {
    filtered = filtered.filter((s) => s.totalCases === 0);
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Selected Student Detail ───────────────────────────────────────────────
  const selectedStudent = selectedStudentId
    ? (studentRows.find((s) => s.id === selectedStudentId) ?? null)
    : null;

  type LogRow = {
    student_id: string;
    case_type_id: string;
    location_id: string;
    date: string;
    locations: { name: string } | null;
  };

  const selectedLogs: LogRow[] = selectedStudentId
    ? (allLogs.filter(
        (l) => l.student_id === selectedStudentId
      ) as unknown as LogRow[])
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
    {
      key: "pending_uploads",
      label: "Pending Uploads",
      count: totalPendingUploads,
    },
    {
      key: "open_assignments",
      label: "Open Assignments",
      count: totalOpenAssignments,
    },
    {
      key: "low_activity",
      label: "No Cases Yet",
      count: studentRows.filter((s) => s.totalCases === 0).length,
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Active Students" value={totalStudents} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Cases Logged" value={totalCasesLogged} icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard
          label="Pending Uploads"
          value={totalPendingUploads}
          highlight={totalPendingUploads > 0}
          icon={<Upload className="h-5 w-5" />}
        />
        <StatCard
          label="Students Behind"
          value={studentsBehind}
          highlight={studentsBehind > 0}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </div>

      {/* Alerts */}
      {(studentsBehind > 0 || totalPendingUploads > 0) && (
        <div className="space-y-2">
          {studentsBehind > 0 && (
            <AlertBanner
              type="warning"
              message={`${studentsBehind} student${studentsBehind !== 1 ? "s are" : " is"} falling behind on required case exposure.`}
              href={buildUrl({ filter: "behind", page: "1", student: undefined })}
            />
          )}
          {totalPendingUploads > 0 && (
            <AlertBanner
              type="info"
              message={`${totalPendingUploads} upload${totalPendingUploads !== 1 ? "s are" : " is"} awaiting review.`}
              href="/admin/logging"
            />
          )}
        </div>
      )}

      {/* Two-column layout: student list + optional detail panel */}
      <div className={`flex gap-6 ${selectedStudent ? "items-start" : ""}`}>
        {/* Left: Student List */}
        <div
          className={`flex min-w-0 flex-col gap-4 ${selectedStudent ? "w-1/2" : "w-full"}`}
        >
          {/* Filters + Search */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <Link
                  key={f.key}
                  href={buildUrl({
                    filter: f.key === "all" ? undefined : f.key,
                    page: "1",
                    student: undefined,
                  })}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    filter === f.key
                      ? "bg-accent text-black"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  {f.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      filter === f.key
                        ? "bg-black/20 text-black"
                        : "bg-white/10"
                    }`}
                  >
                    {f.count}
                  </span>
                </Link>
              ))}
            </div>

            {/* Search + Section filter */}
            <form method="GET" action="/admin" className="flex gap-2">
              {filter !== "all" && (
                <input type="hidden" name="filter" value={filter} />
              )}
              <input type="hidden" name="page" value="1" />
              <input
                name="search"
                defaultValue={search}
                placeholder="Search by name or email…"
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-accent focus:outline-none"
              />
              {sections.length > 0 && (
                <select
                  name="section"
                  defaultValue={sectionFilter}
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs text-white focus:border-accent focus:outline-none"
                >
                  <option value="">All Sections</option>
                  {sections.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
              <button
                type="submit"
                className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/20 transition-colors"
              >
                Search
              </button>
              {(search || sectionFilter) && (
                <Link
                  href={buildUrl({ search: undefined, section: undefined, page: "1" })}
                  className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white/60 hover:bg-white/20 transition-colors"
                >
                  Clear
                </Link>
              )}
            </form>
          </div>

          {/* Student Table */}
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <div className="grid grid-cols-[1fr_60px_60px_80px] gap-2 border-b border-white/10 bg-white/5 px-4 py-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
                Student
              </span>
              <span className="text-center text-xs font-semibold uppercase tracking-wider text-white/50">
                Cases
              </span>
              <span className="text-center text-xs font-semibold uppercase tracking-wider text-white/50">
                Pending
              </span>
              <span className="text-center text-xs font-semibold uppercase tracking-wider text-white/50">
                Complete
              </span>
            </div>

            {paginated.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-white/40">
                No students match the current filter.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {paginated.map((s) => {
                  const isSelected = selectedStudentId === s.id;
                  return (
                    <Link
                      key={s.id}
                      href={buildUrl({
                        student: isSelected ? undefined : s.id,
                      })}
                      className={`grid grid-cols-[1fr_60px_60px_80px] items-center gap-2 px-4 py-3 text-sm transition-colors hover:bg-white/5 ${
                        isSelected
                          ? "bg-accent/10 ring-1 ring-inset ring-accent/30"
                          : ""
                      }`}
                    >
                      <span>
                        <p
                          className={`font-medium ${isSelected ? "text-accent" : "text-white"}`}
                        >
                          {s.full_name}
                        </p>
                        <p className="text-xs text-white/40">
                          {s.section ?? s.email}
                        </p>
                      </span>
                      <span className="text-center text-white/80">
                        {s.totalCases}
                      </span>
                      <span
                        className={`text-center ${s.pendingUploads > 0 ? "font-semibold text-accent" : "text-white/40"}`}
                      >
                        {s.pendingUploads > 0 ? s.pendingUploads : "—"}
                      </span>
                      <span className="flex flex-col items-end gap-1">
                        <span className="flex items-center gap-1">
                          <span
                            className={`text-xs font-semibold ${
                              s.completionPct >= 100
                                ? "text-green-400"
                                : s.projectedPct >= 50
                                  ? "text-accent"
                                  : "text-red-400"
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
                        <div className="h-1.5 w-full rounded-full bg-white/10 min-w-15">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              s.completionPct >= 100
                                ? "bg-green-500"
                                : s.projectedPct >= 50
                                  ? "bg-accent"
                                  : "bg-red-500"
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
            <div className="flex items-center justify-between text-sm text-white/50">
              <span>
                {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, totalFiltered)} of {totalFiltered}
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={buildUrl({ page: String(page - 1) })}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20 transition-colors"
                  >
                    ← Prev
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={buildUrl({ page: String(page + 1) })}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20 transition-colors"
                  >
                    Next →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Student Detail Panel */}
        {selectedStudent && (
          <aside className="w-1/2 shrink-0 space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-white">
                    {selectedStudent.full_name}
                  </p>
                  <p className="text-xs text-white/40">{selectedStudent.email}</p>
                  {selectedStudent.section && (
                    <p className="text-xs text-white/40">
                      {selectedStudent.section}
                    </p>
                  )}
                </div>
                <Link
                  href={buildUrl({ student: undefined })}
                  className="text-xs text-white/40 hover:text-white/70"
                >
                  ✕ Close
                </Link>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-white/5 p-3">
                  <p className="text-lg font-bold text-accent">
                    {selectedStudent.totalCases}
                  </p>
                  <p className="text-xs text-white/40">Cases</p>
                </div>
                <div className="rounded-lg bg-white/5 p-3">
                  <p
                    className={`text-lg font-bold ${selectedStudent.pendingUploads > 0 ? "text-accent" : "text-white/60"}`}
                  >
                    {selectedStudent.pendingUploads}
                  </p>
                  <p className="text-xs text-white/40">Pending</p>
                </div>
                <div className="rounded-lg bg-white/5 p-3">
                  <p
                    className={`text-lg font-bold ${selectedStudent.completionPct >= 100 ? "text-green-400" : "text-white/60"}`}
                  >
                    {selectedStudent.completionPct}%
                  </p>
                  <p className="text-xs text-white/40">Complete</p>
                </div>
              </div>

              {/* Per Case Type Progress */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                  Requirements
                </p>
                {caseTypes.length === 0 ? (
                  <p className="text-xs text-white/30">No requirements set.</p>
                ) : (
                  caseTypes.map((ct) => {
                    const req = reqMap[ct.id] ?? 0;
                    const done = selectedStudent.casesByType[ct.id] ?? 0;
                    const pct =
                      req > 0
                        ? Math.min(100, Math.round((done / req) * 100))
                        : 0;
                    const met = req > 0 && done >= req;
                    return (
                      <div key={ct.id}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-white/70">{ct.name}</span>
                          <span
                            className={`text-xs font-semibold ${met ? "text-green-400" : "text-accent"}`}
                          >
                            {done}/{req || "—"}
                          </span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-white/10">
                          <div
                            className={`h-2.5 rounded-full transition-all ${met ? "bg-green-500" : "bg-accent"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Warning Badge */}
              {selectedStudent.isBehind && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                  <p className="text-xs font-semibold text-red-400">
                    ⚠ Falling Behind
                  </p>
                  <p className="text-xs text-red-400/80 mt-0.5">
                    This student has not met 50% of their required case
                    exposure.
                  </p>
                </div>
              )}

              {/* Recent Cases */}
              {selectedLogs.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                    Recent Cases
                  </p>
                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {selectedLogs
                      .slice()
                      .sort((a, b) => (b.date > a.date ? 1 : -1))
                      .slice(0, 10)
                      .map((log, i) => (
                        <div
                          key={i}
                          className="flex justify-between border-b border-white/5 py-1 text-xs"
                        >
                          <span className="text-white/60">
                            {caseTypes.find((c) => c.id === log.case_type_id)
                              ?.name ?? "—"}
                          </span>
                          <span className="text-white/40">
                            {log.date
                              ? new Date(log.date).toLocaleDateString("en-AU", {
                                  day: "numeric",
                                  month: "short",
                                })
                              : "—"}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex gap-2 pt-1">
                <Link
                  href={`/admin/logging?student=${selectedStudent.id}`}
                  className="flex-1 rounded-lg bg-accent/20 py-2 text-center text-xs font-semibold text-accent hover:bg-accent/30 transition-colors"
                >
                  Log Case
                </Link>
                <Link
                  href={`/admin/assignments?student=${selectedStudent.id}`}
                  className="flex-1 rounded-lg bg-white/10 py-2 text-center text-xs font-semibold text-white/70 hover:bg-white/20 transition-colors"
                >
                  Assign
                </Link>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Distribution Charts (hidden when student panel is open) */}
      {!selectedStudent && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Case Type Distribution */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-accent" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50">
                Cases by Type
              </h2>
            </div>
            {caseTypes.length === 0 ? (
              <p className="text-xs text-white/30">No data.</p>
            ) : (
              caseTypes.map((ct) => {
                const count = caseCountByType[ct.id] ?? 0;
                const pct =
                  totalCasesLogged > 0
                    ? Math.round((count / totalCasesLogged) * 100)
                    : 0;
                return (
                  <div key={ct.id} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 truncate text-xs text-white/70">
                      {ct.name}
                    </span>
                    <div className="flex-1 rounded-full bg-white/10 h-3">
                      <div
                        className="h-3 rounded-full bg-accent/70 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-xs font-medium text-white/50">
                      {count} <span className="text-white/30">({pct}%)</span>
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Location Distribution */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50">
                Top Locations
              </h2>
            </div>
            {locationEntries.length === 0 ? (
              <p className="text-xs text-white/30">No data.</p>
            ) : (
              locationEntries.map(([loc, count]) => {
                const pct =
                  totalCasesLogged > 0
                    ? Math.round((count / totalCasesLogged) * 100)
                    : 0;
                return (
                  <div key={loc} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 truncate text-xs text-white/70">
                      {loc}
                    </span>
                    <div className="flex-1 rounded-full bg-white/10 h-3">
                      <div
                        className="h-3 rounded-full bg-accent/60 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-xs font-medium text-white/50">
                      {count} <span className="text-white/30">({pct}%)</span>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
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
        highlight
          ? "border-accent/30 bg-accent/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
          highlight ? "bg-accent/20 text-accent" : "bg-white/10 text-white/50"
        }`}>
          {icon}
        </div>
        <p
          className={`text-3xl font-bold ${highlight ? "text-accent" : "text-white"}`}
        >
          {value}
        </p>
      </div>
      <p className="text-xs font-medium text-white/50">{label}</p>
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
