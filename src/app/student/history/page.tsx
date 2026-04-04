import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type CaseLog = {
  id: string;
  date: string;
  notes: string | null;
  case_types: { name: string } | null;
  locations: { name: string } | null;
};

export default async function StudentHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("case_logs")
    .select("id, date, notes, case_types(name), locations(name)")
    .eq("student_id", user.id)
    .order("date", { ascending: false });

  const logs: CaseLog[] = (data ?? []) as unknown as CaseLog[];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Case History</h1>
        <p className="text-sm text-white/50 mt-1">
          All clinical cases logged for your account — {logs.length} total.
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
          <p className="text-sm text-white/40">
            No cases have been logged yet. Submit an upload so your instructor
            can log a case for you.
          </p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_140px] gap-4 px-4 py-2.5 border-b border-white/10 bg-white/5">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              Case Type
            </span>
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              Location
            </span>
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              Date
            </span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/5">
            {logs.map((log) => {
              const dateStr = log.date
                ? new Date(log.date).toLocaleDateString("en-AU", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "—";
              return (
                <div
                  key={log.id}
                  className="grid grid-cols-[1fr_1fr_140px] gap-4 px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <span className="text-sm text-white truncate">
                    {log.case_types?.name ?? "—"}
                  </span>
                  <span className="text-sm text-white/70 truncate">
                    {log.locations?.name ?? "—"}
                  </span>
                  <span className="text-sm text-white/50">{dateStr}</span>
                  {log.notes && (
                    <p className="col-span-3 text-xs text-white/40 -mt-1 pb-1 line-clamp-2">
                      {log.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
