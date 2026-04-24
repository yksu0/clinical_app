import { createClient } from "@/lib/supabase/server";
import UploadForm from "@/components/student/UploadForm";
import { format } from "date-fns";
import { Clock, CheckCircle, XCircle, Archive } from "lucide-react";

const STATUS_CONFIG = {
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

export default async function UploadPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: uploads } = await supabase
    .from("uploads")
    .select("id, file_name, status, uploaded_at, archived")
    .eq("student_id", user!.id)
    .order("uploaded_at", { ascending: false });

  const list = uploads ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-foreground">Upload Case Proof</h1>
        <p className="mt-1 text-sm text-(--text-secondary)">
          Upload scanned copies of your case forms for admin review.
        </p>
      </div>

      <UploadForm />

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
                STATUS_CONFIG[u.status as keyof typeof STATUS_CONFIG] ??
                STATUS_CONFIG.pending;
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
    </div>
  );
}
