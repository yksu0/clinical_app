import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PlusCircle, Clock, CheckCircle, XCircle } from "lucide-react";

type Submission = {
  id: string;
  date: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  admin_note: string | null;
  case_types: { name: string } | null;
  areas_of_duty: { name: string } | null;
};

const STATUS_CONFIG = {
  pending: {
    label: "Pending Review",
    className: "bg-amber-500/20 text-amber-400",
    Icon: Clock,
  },
  approved: {
    label: "Approved",
    className: "bg-green-500/20 text-green-400",
    Icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-500/20 text-red-400",
    Icon: XCircle,
  },
};

export default async function StudentCasesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("case_submissions")
    .select(
      "id, date, status, submitted_at, admin_note, case_types(name), areas_of_duty(name)"
    )
    .eq("student_id", user.id)
    .order("submitted_at", { ascending: false });

  const submissions = (data ?? []) as unknown as Submission[];

  const pending = submissions.filter((s) => s.status === "pending");
  const rejected = submissions.filter((s) => s.status === "rejected");
  const approved = submissions.filter((s) => s.status === "approved");

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Case Submissions</h1>
          <p className="text-sm text-white/50 mt-1">
            Cases you&apos;ve submitted for admin review.
          </p>
        </div>
        <Link
          href="/student/cases/submit"
          className="shrink-0 flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black hover:bg-accent/90 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          Submit Case
        </Link>
      </div>

      {submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-16 text-center">
          <p className="text-sm font-medium text-white">No submissions yet</p>
          <p className="mt-1 text-xs text-white/40">
            Submit your clinical cases for instructor review.
          </p>
          <Link
            href="/student/cases/submit"
            className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black"
          >
            Submit Your First Case
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Rejected — needs attention first */}
          {rejected.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-red-400">
                Needs Resubmission ({rejected.length})
              </h2>
              {rejected.map((s) => (
                <SubmissionCard key={s.id} submission={s} />
              ))}
            </section>
          )}

          {/* Pending */}
          {pending.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Awaiting Review ({pending.length})
              </h2>
              {pending.map((s) => (
                <SubmissionCard key={s.id} submission={s} />
              ))}
            </section>
          )}

          {/* Approved */}
          {approved.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Approved ({approved.length})
              </h2>
              {approved.map((s) => (
                <SubmissionCard key={s.id} submission={s} />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function SubmissionCard({ submission: s }: { submission: Submission }) {
  const cfg = STATUS_CONFIG[s.status];
  const Icon = cfg.Icon;

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {s.case_types?.name ?? "Unknown Case Type"}
          </p>
          <p className="text-xs text-white/50">
            {s.areas_of_duty?.name ?? "Unknown Area"} &middot;{" "}
            {new Date(s.date).toLocaleDateString("en-AU", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
          <p className="text-xs text-white/30">
            Submitted{" "}
            {new Date(s.submitted_at).toLocaleDateString("en-AU", {
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.className}`}
        >
          <Icon className="h-3 w-3" />
          {cfg.label}
        </span>
      </div>

      {s.status === "rejected" && s.admin_note && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
          <p className="text-xs text-red-300">
            <span className="font-semibold">Rejection note:</span> {s.admin_note}
          </p>
        </div>
      )}

      {s.status === "rejected" && (
        <Link
          href={`/student/cases/submit?resubmit=${s.id}`}
          className="inline-block rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-black hover:bg-accent/90 transition-colors"
        >
          Edit &amp; Resubmit
        </Link>
      )}
    </div>
  );
}
