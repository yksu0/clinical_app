import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function CIStudentsPage({ searchParams }: PageProps) {
  const supabase = await createClient();

  const params = await searchParams;
  const search = params.search ?? "";

  const [profilesRes, requirementsRes, caseLogsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, section")
      .eq("role", "student")
      .eq("is_active", true)
      .eq("is_verified", true),
    supabase.from("requirements").select("case_type_id, required_count"),
    supabase.from("case_logs").select("student_id, case_type_id"),
  ]);

  const profiles = profilesRes.data ?? [];
  const requirements = requirementsRes.data ?? [];
  const allLogs = caseLogsRes.data ?? [];

  const reqMap: Record<string, number> = {};
  for (const r of requirements) {
    reqMap[r.case_type_id] = (reqMap[r.case_type_id] ?? 0) + r.required_count;
  }
  const totalRequired = Object.values(reqMap).reduce((s, n) => s + n, 0);

  const completedByStudent: Record<string, Record<string, number>> = {};
  for (const log of allLogs) {
    const s = (completedByStudent[log.student_id] ??= {});
    s[log.case_type_id] = (s[log.case_type_id] ?? 0) + 1;
  }

  const rows = profiles.map((p) => {
    const byType = completedByStudent[p.id] ?? {};
    const completedReq = Object.entries(reqMap).reduce(
      (sum, [ctId, req]) => sum + Math.min(byType[ctId] ?? 0, req),
      0
    );
    const pct =
      totalRequired > 0 ? Math.round((completedReq / totalRequired) * 100) : 0;
    const total = allLogs.filter((l) => l.student_id === p.id).length;
    return { ...p, pct, total };
  });

  const filtered = search
    ? rows.filter(
        (r) =>
          r.full_name.toLowerCase().includes(search.toLowerCase()) ||
          r.email.toLowerCase().includes(search.toLowerCase())
      )
    : rows;

  const sorted = filtered.slice().sort((a, b) => a.pct - b.pct);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Students</h1>
        <p className="text-sm text-white/50 mt-1">
          {sorted.length} active verified student{sorted.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Search */}
      <form method="GET" action="/ci/students" className="flex gap-2">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by name or email…"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/20 transition-colors"
        >
          Search
        </button>
        {search && (
          <Link
            href="/ci/students"
            className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white/60 hover:bg-white/20 transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
        <div className="grid grid-cols-[1fr_60px_90px] gap-2 border-b border-white/10 bg-white/5 px-4 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Student
          </span>
          <span className="text-center text-xs font-semibold uppercase tracking-wider text-white/50">
            Cases
          </span>
          <span className="text-center text-xs font-semibold uppercase tracking-wider text-white/50">
            Complete
          </span>
        </div>
        {sorted.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-white/40">
            No students found.
          </p>
        ) : (
          <div className="divide-y divide-white/5">
            {sorted.map((s) => (
              <Link
                key={s.id}
                href={`/ci/students/${s.id}`}
                className="grid grid-cols-[1fr_60px_90px] items-center gap-2 px-4 py-3 text-sm hover:bg-white/5 transition-colors"
              >
                <span>
                  <p className="font-medium text-white">{s.full_name}</p>
                  <p className="text-xs text-white/40">{s.section ?? s.email}</p>
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
      </div>
    </div>
  );
}
