import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CancelRequestForm from "./CancelRequestForm";

type Assignment = {
  id: string;
  case_type_id: string;
  location_id: string;
  scheduled_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  status: "assigned" | "completed" | "missed" | "cancel_requested" | "cancelled";
  notes: string | null;
  cancellation_reason: string | null;
  case_types: { name: string } | null;
  locations: { name: string } | null;
};

const STATUS_STYLES: Record<string, string> = {
  assigned: "bg-accent/20 text-accent",
  completed: "bg-green-500/20 text-green-400",
  missed: "bg-red-500/20 text-red-400",
  cancel_requested: "bg-amber-500/20 text-amber-400",
  cancelled: "bg-neutral-500/20 text-white/40",
};

export default async function StudentAssignmentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("assignments")
    .select(
      "id, case_type_id, location_id, scheduled_date, end_date, start_time, end_time, status, notes, cancellation_reason, case_types(name), locations(name)"
    )
    .eq("student_id", user.id)
    .order("scheduled_date", { ascending: false });

  const assignments: Assignment[] = (data ?? []) as unknown as Assignment[];

  const open = assignments.filter((a) => a.status === "assigned" || a.status === "cancel_requested");
  const past = assignments.filter((a) => a.status !== "assigned" && a.status !== "cancel_requested");

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">My Assignments</h1>
        <p className="text-sm text-white/50 mt-1">
          Clinical rotations assigned by your instructor.
        </p>
      </div>

      {/* Open Assignments */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
          Upcoming ({open.length})
        </h2>
        {open.length === 0 ? (
          <EmptyState message="No upcoming assignments." />
        ) : (
          open.map((a) => <AssignmentCard key={a.id} assignment={a} />)
        )}
      </section>

      {/* Past Assignments */}
      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
            Past ({past.length})
          </h2>
          {past.map((a) => (
            <AssignmentCard key={a.id} assignment={a} />
          ))}
        </section>
      )}
    </div>
  );
}

function AssignmentCard({ assignment: a }: { assignment: Assignment }) {
  const dateStr = a.scheduled_date
    ? new Date(a.scheduled_date).toLocaleDateString("en-AU", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start justify-between gap-4">
      <div className="space-y-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">
          {a.case_types?.name ?? "Unknown Case Type"}
        </p>
        <p className="text-xs text-white/50">
          {a.locations?.name ?? "Unknown Location"} &middot; {dateStr}
          {a.end_date && a.end_date !== a.scheduled_date && (
            <> – {new Date(a.end_date).toLocaleDateString("en-AU", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}</>
          )}
          {a.start_time && <> {a.start_time.slice(0, 5)}</>}
          {a.end_time && <>–{a.end_time.slice(0, 5)}</>}
        </p>
        {a.notes && (
          <p className="text-xs text-white/40 mt-1 line-clamp-2">{a.notes}</p>
        )}
        {a.cancellation_reason && (
          <p className="text-xs text-amber-400/70 mt-1">
            Cancel reason: {a.cancellation_reason}
          </p>
        )}
        {a.status === "assigned" && (
          <CancelRequestForm assignmentId={a.id} />
        )}
      </div>
      <span
        className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
          STATUS_STYLES[a.status] ?? "bg-white/10 text-white/60"
        }`}
      >
        {a.status === "cancel_requested" ? "Pending Cancel" : a.status}
      </span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
      <p className="text-sm text-white/40">{message}</p>
    </div>
  );
}
