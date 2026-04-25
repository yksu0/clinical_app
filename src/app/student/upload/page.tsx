import { createClient } from "@/lib/supabase/server";
import UploadForm from "@/components/student/UploadForm";
import { format } from "date-fns";
import { Clock, CheckCircle, XCircle, Archive, AlertCircle } from "lucide-react";

const UPLOAD_STATUS_CONFIG = {
  pending: {
    label: "Pending",
    colorClass: "text-(--status-pending)",
    bgStyle: { background: "rgba(245,196,0,0.12)" },
    Icon: Clock,
  },
  processed: {
    label: "Processed",
    colorClass: "text-(--status-processed)",
    bgStyle: { background: "rgba(34,197,94,0.12)" },
    Icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    colorClass: "text-(--status-rejected)",
    bgStyle: { background: "rgba(239,68,68,0.12)" },
    Icon: XCircle,
  },
};

const SUBMISSION_STATUS_CONFIG = {
  pending: { label: "Pending Review", colorClass: "text-(--status-pending)", bgStyle: { background: "rgba(245,196,0,0.12)" }, Icon: Clock },
  approved: { label: "Approved", colorClass: "text-(--status-processed)", bgStyle: { background: "rgba(34,197,94,0.12)" }, Icon: CheckCircle },
  rejected: { label: "Rejected", colorClass: "text-(--status-rejected)", bgStyle: { background: "rgba(239,68,68,0.12)" }, Icon: AlertCircle },
};

type Submission = {
  id: string;
  date: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  admin_note: string | null;
  case_types: { name: string } | null;
  areas_of_duty: { name: string } | null;
};

export default async function UploadPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: uploads },
    { data: caseTypes },
    { data: areasOfDuty },
    { data: rotations },
    { data: assignments },
    { data: submissions },
  ] = await Promise.all([
    supabase
      .from("uploads")
      .select("id, file_name, status, uploaded_at, archived")
      .eq("student_id", user!.id)
      .order("uploaded_at", { ascending: false }),
    supabase.from("case_types").select("id, name").eq("is_active", true).order("name"),
    supabase.from("areas_of_duty").select("id, name").eq("is_active", true).order("name"),
    supabase.from("rotations").select("id, name").order("start_date", { ascending: false }),
    supabase
      .from("assignments")
      .select("id, scheduled_date, areas_of_duty(name)")
      .eq("student_id", user!.id)
      .eq("status", "scheduled")
      .order("scheduled_date", { ascending: false }),
    supabase
      .from("case_submissions")
      .select("id, date, status, submitted_at, admin_note, case_types(name), areas_of_duty(name)")
      .eq("student_id", user!.id)
      .order("submitted_at", { ascending: false }),
  ]);

  const list = uploads ?? [];
  const subList = (submissions ?? []) as unknown as Submission[];
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-foreground">Submit a Case</h1>
        <p className="mt-1 text-sm text-(--text-secondary)">
          Upload your case proof and fill in the details for admin review.
        </p>
      </div>

      <UploadForm
        caseTypes={caseTypes ?? []}
        areasOfDuty={areasOfDuty ?? []}
        rotations={rotations ?? []}
        openAssignments={(assignments ?? []) as unknown as { id: string; scheduled_date: string; areas_of_duty: { name: string } | null }[]}
      />

      {/* History */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-(--text-secondary)">
          Upload History
        </h2>

        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
            <p className="text-sm font-medium text-foreground">No uploads yet</p>
            <p className="mt-1 text-xs text-(--text-muted)">
              Your uploaded files will appear here
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {list.map((u) => {
              const isArchived = (u as { archived?: boolean }).archived;
              const cfg =
                UPLOAD_STATUS_CONFIG[u.status as keyof typeof UPLOAD_STATUS_CONFIG] ??
                UPLOAD_STATUS_CONFIG.pending;
              const Icon = cfg.Icon;
              return (
                <li
                  key={u.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
                >
                  <div>
                    <p className={`text-sm font-medium ${isArchived ? "text-(--text-muted) line-through" : "text-foreground"}`}>
                      {u.file_name}
                    </p>
                    <p className="text-xs text-(--text-muted)">
                      {format(new Date(u.uploaded_at), "MMM d, yyyy · h:mm a")}
                    </p>
                  </div>
                  {isArchived ? (
                    <span
                      className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-(--text-muted)"
                      style={{ background: "rgba(255,255,255,0.05)" }}
                    >
                      <Archive className="h-3 w-3" />
                      Archived
                    </span>
                  ) : (
                    <span
                      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.colorClass}`}
                      style={cfg.bgStyle}
                    >
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Case Submissions */}
      <section id="submissions">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-(--text-secondary)">
          My Submissions
        </h2>

        {subList.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
            <p className="text-sm font-medium text-foreground">No submissions yet</p>
            <p className="mt-1 text-xs text-(--text-muted)">Submitted cases will appear here after review.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {subList.map((s) => {
              const cfg = SUBMISSION_STATUS_CONFIG[s.status] ?? SUBMISSION_STATUS_CONFIG.pending;
              const Icon = cfg.Icon;
              return (
                <li key={s.id} className="rounded-xl border border-border bg-surface px-4 py-3 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {s.case_types?.name ?? "Unknown Case Type"}
                      </p>
                      <p className="text-xs text-(--text-muted)">
                        {s.areas_of_duty?.name ?? "Unknown Area"} &middot;{" "}
                        {new Date(s.date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.colorClass}`}
                      style={cfg.bgStyle}
                    >
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </div>
                  {s.status === "rejected" && s.admin_note && (
                    <p className="text-xs text-(--status-rejected) bg-red-500/10 rounded px-2 py-1">
                      Admin note: {s.admin_note}
                    </p>
                  )}
                  <p className="text-xs text-(--text-muted)">
                    Submitted {format(new Date(s.submitted_at), "MMM d, yyyy")}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
