import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import StudentsTable from "./StudentsTable";

interface PageProps {
  searchParams: Promise<{ search?: string; section?: string }>;
}

export default async function AdminStudentsPage({ searchParams }: PageProps) {
  const supabase = await createClient();

  const params = await searchParams;
  const search = params.search ?? "";
  const sectionFilter = params.section ?? "";

  const [profilesRes, requirementsRes, caseLogsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, section, is_verified")
      .eq("role", "student")
      .eq("is_active", true),
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

  const sections = [...new Set(profiles.map((p) => p.section).filter(Boolean))] as string[];
  sections.sort();

  let filtered = rows;

  if (sectionFilter) {
    filtered = filtered.filter((r) => r.section === sectionFilter);
  }

  if (search) {
    filtered = filtered.filter(
      (r) =>
        r.full_name.toLowerCase().includes(search.toLowerCase()) ||
        r.email.toLowerCase().includes(search.toLowerCase())
    );
  }

  const sorted = filtered.slice().sort((a, b) => a.pct - b.pct);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Students</h1>
        <p className="text-sm text-(--text-muted) mt-1">
          {sorted.length} student{sorted.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Search + Section Filter */}
      <form method="GET" action="/admin/students" className="flex gap-2">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by name or email…"
          className="flex-1 rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground placeholder-(--text-muted) focus:border-accent focus:outline-none"
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
          className="rounded-lg bg-elevated px-4 py-2 text-sm text-(--text-secondary) hover:bg-border transition-colors"
        >
          Search
        </button>
        {(search || sectionFilter) && (
          <Link
            href="/admin/students"
            className="rounded-lg bg-elevated px-3 py-2 text-sm text-(--text-muted) hover:bg-border transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <StudentsTable students={sorted} />
    </div>
  );
}
