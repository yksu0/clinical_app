import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Users, ClipboardList, CalendarClock, AlertTriangle, BarChart3, MapPin } from "lucide-react";

export default async function CIDashboard() {
  const supabase = await createClient();

  const [
    profilesRes,
    caseTypesRes,
    requirementsRes,
    caseLogsRes,
    assignmentsRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, section")
      .eq("role", "student")
      .eq("is_active", true)
      .eq("is_verified", true),
    supabase.from("case_types").select("id, name").eq("is_active", true),
    supabase.from("requirements").select("case_type_id, required_count"),
    supabase
      .from("case_logs")
      .select("student_id, case_type_id, areas_of_duty(name)"),
    supabase
      .from("assignments")
      .select("student_id, status"),
  ]);

  const profiles = profilesRes.data ?? [];
  const caseTypes = caseTypesRes.data ?? [];
  const requirements = requirementsRes.data ?? [];
  const allLogs = caseLogsRes.data ?? [];
  const allAssignments = assignmentsRes.data ?? [];

  // Requirement map
  const reqMap: Record<string, number> = {};
  for (const r of requirements) {
    reqMap[r.case_type_id] = (reqMap[r.case_type_id] ?? 0) + r.required_count;
  }
  const totalRequired = Object.values(reqMap).reduce((s, n) => s + n, 0);

  // Per-student completed
  const completedByStudent: Record<string, Record<string, number>> = {};
  for (const log of allLogs) {
    const s = (completedByStudent[log.student_id] ??= {});
    s[log.case_type_id] = (s[log.case_type_id] ?? 0) + 1;
  }

  // Case type distribution
  const countByType: Record<string, number> = {};
  for (const log of allLogs) {
    countByType[log.case_type_id] = (countByType[log.case_type_id] ?? 0) + 1;
  }

  // Location distribution
  const countByLocation: Record<string, number> = {};
  for (const log of allLogs) {
    const loc =
      (log.areas_of_duty as unknown as { name: string } | null)?.name ?? "Unknown";
    countByLocation[loc] = (countByLocation[loc] ?? 0) + 1;
  }
  const topLocations = Object.entries(countByLocation)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Students sorted by completion %
  const studentStats = profiles.map((p) => {
    const byType = completedByStudent[p.id] ?? {};
    const completedReq = Object.entries(reqMap).reduce(
      (sum, [ctId, req]) => sum + Math.min(byType[ctId] ?? 0, req),
      0
    );
    const pct =
      totalRequired > 0
        ? Math.round((completedReq / totalRequired) * 100)
        : 0;
    return { ...p, pct, total: allLogs.filter((l) => l.student_id === p.id).length };
  });

  const behind = studentStats.filter(
    (s) => totalRequired > 0 && s.pct < 50
  ).length;
  const openAssignments = allAssignments.filter(
    (a) => a.status === "assigned"
  ).length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-sm text-white/50 mt-1">Read-only view of student progress.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Students" value={profiles.length} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Cases Logged" value={allLogs.length} icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard label="Open Assignments" value={openAssignments} icon={<CalendarClock className="h-5 w-5" />} />
        <StatCard label="Students Behind" value={behind} highlight={behind > 0} icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      {/* Student Progress List */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 bg-white/5">
          <h2 className="text-sm font-semibold text-white/70">Student Progress</h2>
        </div>
        <div className="grid grid-cols-[1fr_60px_90px] gap-2 px-4 py-2 border-b border-white/10 bg-white/3">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/40">Name</span>
          <span className="text-center text-xs font-semibold uppercase tracking-wider text-white/40">Cases</span>
          <span className="text-center text-xs font-semibold uppercase tracking-wider text-white/40">Complete</span>
        </div>
        {studentStats.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-white/40">
            No verified students yet.
          </p>
        ) : (
          <div className="divide-y divide-white/5">
            {studentStats
              .sort((a, b) => a.pct - b.pct)
              .slice(0, 50)
              .map((s) => (
                <Link
                  key={s.id}
                  href={`/ci/students/${s.id}`}
                  className="grid grid-cols-[1fr_60px_90px] items-center gap-2 px-4 py-3 text-sm hover:bg-white/8 transition-colors"
                >
                  <span>
                    <p className="font-medium text-white">{s.full_name}</p>
                    {s.section && <p className="text-xs text-white/40">{s.section}</p>}
                  </span>
                  <span className="text-center text-white/70">{s.total}</span>
                  <span className="flex justify-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        s.pct >= 100
                          ? "bg-green-500/20 text-green-400"
                          : s.pct >= 50
                            ? "bg-accent/20 text-accent"
                            : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {s.pct}%
                    </span>
                  </span>
                </Link>
              ))}
          </div>
        )}
        {studentStats.length > 50 && (
          <div className="border-t border-white/10 px-4 py-3 text-center">
            <Link href="/ci/students" className="text-xs text-accent hover:underline">
              View all {studentStats.length} students →
            </Link>
          </div>
        )}
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              const count = countByType[ct.id] ?? 0;
              const pct =
                allLogs.length > 0
                  ? Math.round((count / allLogs.length) * 100)
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
                  <span className="w-12 text-right text-xs font-medium text-white/50">{count} <span className="text-white/30">({pct}%)</span></span>
                </div>
              );
            })
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-accent" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Top Areas of Duty
            </h2>
          </div>
          {topLocations.length === 0 ? (
            <p className="text-xs text-white/30">No data.</p>
          ) : (
            topLocations.map(([loc, count]) => {
              const pct =
                allLogs.length > 0
                  ? Math.round((count / allLogs.length) * 100)
                  : 0;
              return (
                <div key={loc} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate text-xs text-white/70">{loc}</span>
                  <div className="flex-1 rounded-full bg-white/10 h-3">
                    <div
                      className="h-3 rounded-full bg-accent/60 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-xs font-medium text-white/50">{count} <span className="text-white/30">({pct}%)</span></span>
                </div>
              );
            })
          )}
        </div>
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
        highlight ? "border-accent/30 bg-accent/10" : "border-white/10 bg-white/5"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
          highlight ? "bg-accent/20 text-accent" : "bg-white/10 text-white/50"
        }`}>
          {icon}
        </div>
        <p className={`text-3xl font-bold ${highlight ? "text-accent" : "text-white"}`}>
          {value}
        </p>
      </div>
      <p className="text-xs font-medium text-white/50">{label}</p>
    </div>
  );
}

