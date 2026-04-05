import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: Promise<{
    action?: string;
    user?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}

type AuditLog = {
  id: string;
  action_type: string;
  created_at: string;
  target_table: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  profiles: { full_name: string; email: string } | null;
};

const ACTION_STYLES: Record<string, string> = {
  case_logged: "bg-blue-500/20 text-blue-400",
  case_rejected: "bg-red-500/20 text-red-400",
  assignment_created: "bg-accent/20 text-accent",
  assignment_completed: "bg-green-500/20 text-green-400",
  assignment_missed: "bg-orange-500/20 text-orange-400",
};

export default async function AuditPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const role = (user.app_metadata?.role as string) ?? "student";
  if (role !== "admin") redirect("/");

  const params = await searchParams;
  const actionFilter = params.action ?? "";
  const userFilter = params.user ?? "";
  const fromFilter = params.from ?? "";
  const toFilter = params.to ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  // Build query
  let query = supabase
    .from("audit_logs")
    .select(
      "id, action_type, created_at, target_table, target_id, details, profiles(full_name, email)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (actionFilter) query = query.eq("action_type", actionFilter);
  if (userFilter) query = query.eq("performed_by", userFilter);
  if (fromFilter) query = query.gte("created_at", fromFilter);
  if (toFilter) query = query.lte("created_at", toFilter + "T23:59:59");

  const from = (page - 1) * PAGE_SIZE;
  query = query.range(from, from + PAGE_SIZE - 1);

  // Run all three queries in parallel
  const [mainResult, actionTypesResult, performersResult] = await Promise.all([
    query,
    supabase.from("audit_logs").select("action_type"),
    supabase.from("audit_logs").select("performed_by, profiles(full_name, email)"),
  ]);

  const logs = (mainResult.data ?? []) as unknown as AuditLog[];
  const totalPages = Math.max(1, Math.ceil((mainResult.count ?? 0) / PAGE_SIZE));

  const actionTypes = [
    ...new Set((actionTypesResult.data ?? []).map((r) => r.action_type as string)),
  ].sort();

  type Performer = {
    performed_by: string;
    profiles: { full_name: string; email: string } | null;
  };
  const performers = (performersResult.data ?? []) as unknown as Performer[];
  const uniquePerformers = performers.filter(
    (p, i, arr) => arr.findIndex((x) => x.performed_by === p.performed_by) === i
  );

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p: Record<string, string> = {};
    if (actionFilter) p.action = actionFilter;
    if (userFilter) p.user = userFilter;
    if (fromFilter) p.from = fromFilter;
    if (toFilter) p.to = toFilter;
    if (page !== 1) p.page = String(page);
    const merged = { ...p, ...overrides };
    const qs = Object.entries(merged)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join("&");
    return `/admin/audit${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
        <p className="text-sm text-white/50 mt-1">
          {mainResult.count ?? 0} total records
        </p>
      </div>

      {/* Filters */}
      <form method="GET" action="/admin/audit" className="flex flex-wrap gap-3">
        {/* Action type */}
        <select
          name="action"
          defaultValue={actionFilter}
          className="rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
        >
          <option value="">All Actions</option>
          {actionTypes.map((a) => (
            <option key={a} value={a}>
              {a.replace(/_/g, " ")}
            </option>
          ))}
        </select>

        {/* Performed by */}
        <select
          name="user"
          defaultValue={userFilter}
          className="rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
        >
          <option value="">All Users</option>
          {uniquePerformers.map((p) => (
            <option key={p.performed_by} value={p.performed_by}>
              {p.profiles?.full_name ?? p.profiles?.email ?? p.performed_by.slice(0, 8)}
            </option>
          ))}
        </select>

        {/* Date range */}
        <input
          type="date"
          name="from"
          defaultValue={fromFilter}
          className="rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
        />
        <input
          type="date"
          name="to"
          defaultValue={toFilter}
          className="rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
        />

        <button
          type="submit"
          className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/20 transition-colors"
        >
          Filter
        </button>
        {(actionFilter || userFilter || fromFilter || toFilter) && (
          <Link
            href="/admin/audit"
            className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white/60 hover:bg-white/20 transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Log Table */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
        <div className="grid grid-cols-[160px_1fr_1fr_140px] gap-3 border-b border-white/10 bg-white/5 px-4 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Action</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Performed By</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Details</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Time</span>
        </div>

        {logs.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-white/40">
            No audit logs found.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {logs.map((log) => (
              <div
                key={log.id}
                className="grid grid-cols-[160px_1fr_1fr_140px] gap-3 items-start px-4 py-3"
              >
                <span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                      ACTION_STYLES[log.action_type] ?? "bg-white/10 text-white/60"
                    }`}
                  >
                    {log.action_type.replace(/_/g, " ")}
                  </span>
                </span>
                <span className="text-sm text-white/70">
                  {log.profiles?.full_name ?? log.profiles?.email ?? "—"}
                </span>
                <span className="text-xs text-white/50 font-mono break-all">
                  {log.target_table && (
                    <span className="text-white/60">{log.target_table} </span>
                  )}
                  {log.details ? (
                    <span>
                      {Object.entries(log.details)
                        .slice(0, 3)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" · ")}
                    </span>
                  ) : null}
                </span>
                <span className="text-xs text-white/40">
                  {new Date(log.created_at).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-white/50">
          <span>
            Page {page} of {totalPages} ({mainResult.count} total)
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
  );
}
