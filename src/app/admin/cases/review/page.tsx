import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Clock } from "lucide-react";

type Submission = {
  id: string;
  date: string;
  submitted_at: string;
  profiles: { full_name: string; section: string | null } | null;
  case_types: { name: string } | null;
  areas_of_duty: { name: string } | null;
};

export default async function CasesReviewPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("case_submissions")
    .select(
      `id, date, submitted_at,
       profiles!student_id(full_name, section),
       case_types(name),
       areas_of_duty(name)`
    )
    .eq("status", "pending")
    .order("submitted_at", { ascending: true });

  const pending = (data ?? []) as unknown as Submission[];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Case Submission Review
        </h1>
        <p className="text-sm text-white/50 mt-1">
          Student-submitted cases awaiting admin approval.
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-16 text-center">
          <Clock className="h-8 w-8 text-white/20 mb-3" />
          <p className="text-sm font-medium text-white">
            No pending submissions
          </p>
          <p className="mt-1 text-xs text-white/40">
            All student case submissions have been reviewed.
          </p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_1fr_120px_80px] gap-4 px-4 py-2.5 border-b border-white/10 bg-white/5">
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
            <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Action
            </span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/5">
            {pending.map((s) => (
              <div
                key={s.id}
                className="grid grid-cols-[1fr_1fr_1fr_120px_80px] gap-4 px-4 py-3 items-center hover:bg-white/[0.02]"
              >
                <div>
                  <p className="text-sm font-medium text-white truncate">
                    {s.profiles?.full_name ?? "Unknown"}
                  </p>
                  {s.profiles?.section && (
                    <p className="text-xs text-white/40">
                      {s.profiles.section}
                    </p>
                  )}
                </div>
                <p className="text-sm text-white/70 truncate">
                  {s.case_types?.name ?? "—"}
                </p>
                <p className="text-sm text-white/70 truncate">
                  {s.areas_of_duty?.name ?? "—"}
                </p>
                <p className="text-sm text-white/70">
                  {new Date(s.date).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <Link
                  href={`/admin/cases/review/${s.id}`}
                  className="rounded-lg bg-accent/20 text-accent hover:bg-accent/30 px-3 py-1.5 text-xs font-semibold text-center transition-colors"
                >
                  Review
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
