import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ search?: string; case_type?: string }>;
}

type CaseLog = {
  id: string;
  date: string;
  notes: string | null;
  student_id: string;
  case_type_id: string;
  case_types: { name: string } | null;
  areas_of_duty: { name: string } | null;
  profiles: { full_name: string } | null;
};

export default async function CICasesPage({ searchParams }: PageProps) {
  const supabase = await createClient();

  const params = await searchParams;
  const search = params.search ?? "";
  const caseTypeFilter = params.case_type ?? "";

  const [logsRes, caseTypesRes] = await Promise.all([
    supabase
      .from("case_logs")
      .select(
        "id, date, notes, student_id, case_type_id, case_types(name), areas_of_duty(name), profiles(full_name)"
      )
      .order("date", { ascending: false })
      .limit(200),
    supabase.from("case_types").select("id, name").eq("is_active", true),
  ]);

  const allLogs = (logsRes.data ?? []) as unknown as CaseLog[];
  const caseTypes = caseTypesRes.data ?? [];

  // Apply filters
  let filtered = allLogs;
  if (caseTypeFilter) {
    filtered = filtered.filter((l) => l.case_type_id === caseTypeFilter);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((l) =>
      l.profiles?.full_name.toLowerCase().includes(q)
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Case Logs</h1>
        <p className="text-sm text-white/50 mt-1">
          Read-only view of all logged cases — {filtered.length} shown.
        </p>
      </div>

      {/* Case Type Filter + Search */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/ci/cases"
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              !caseTypeFilter
                ? "bg-accent text-black"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            All Types
          </Link>
          {caseTypes.map((ct) => (
            <Link
              key={ct.id}
              href={`/ci/cases?case_type=${ct.id}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                caseTypeFilter === ct.id
                  ? "bg-accent text-black"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {ct.name}
            </Link>
          ))}
        </div>

        <form method="GET" action="/ci/cases" className="flex gap-2">
          {caseTypeFilter && (
            <input type="hidden" name="case_type" value={caseTypeFilter} />
          )}
          <input
            name="search"
            defaultValue={search}
            placeholder="Filter by student name…"
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
              href={`/ci/cases${caseTypeFilter ? `?case_type=${caseTypeFilter}` : ""}`}
              className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white/60 hover:bg-white/20 transition-colors"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
        <div className="grid grid-cols-[1fr_1fr_1fr_120px] gap-2 border-b border-white/10 bg-white/5 px-4 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Student
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Case Type
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Area of Duty
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Date
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-white/40">
            No case logs found.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((log) => (
              <div
                key={log.id}
                className="grid grid-cols-[1fr_1fr_1fr_120px] gap-2 items-start px-4 py-3"
              >
                <Link
                  href={`/ci/students/${log.student_id}`}
                  className="text-sm text-accent hover:underline font-medium truncate"
                >
                  {log.profiles?.full_name ?? "—"}
                </Link>
                <span className="text-sm text-white/80 truncate">
                  {log.case_types?.name ?? "—"}
                </span>
                <span className="text-sm text-white/60 truncate">
                  {log.areas_of_duty?.name ?? "—"}
                </span>
                <span className="text-sm text-white/50">
                  {log.date
                    ? new Date(log.date).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </span>
                {log.notes && (
                  <p className="col-span-4 text-xs text-white/40 -mt-1 pb-1 line-clamp-1">
                    {log.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
