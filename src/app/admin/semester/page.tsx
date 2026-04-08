import { createClient } from "@/lib/supabase/server";
import { CalendarDays } from "lucide-react";
import { RolloverForm, CreateSemesterForm } from "./SemesterForms";
import { SemesterCard } from "./SemesterCard";

type Semester = {
  id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
};

export default async function SemesterPage() {
  const supabase = await createClient();

  const [semestersRes, studentsRes] = await Promise.all([
    supabase
      .from("semesters")
      .select("id, name, start_date, end_date, is_active, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "student")
      .eq("is_active", true),
  ]);

  const semesters = (semestersRes.data ?? []) as Semester[];
  const activeStudentCount = studentsRes.count ?? 0;
  const activeSemester = semesters.find((s) => s.is_active) ?? null;

  function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d + "T00:00:00").toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Semester Management</h1>
        <p className="text-sm text-(--text-muted) mt-1">
          Manage academic semesters and roll over to a new cohort.
        </p>
      </div>

      {/* Active Semester Banner */}
      {activeSemester ? (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="h-4 w-4 text-accent" />
            <p className="text-sm font-semibold text-accent">Active Semester</p>
          </div>
          <p className="text-xl font-bold text-foreground">{activeSemester.name}</p>
          <p className="text-sm text-(--text-muted) mt-1">
            {fmtDate(activeSemester.start_date)} – {fmtDate(activeSemester.end_date)}
          </p>
          <div className="mt-3 flex gap-4 text-sm">
            <span className="text-(--text-secondary)">
              <strong className="text-foreground">{activeStudentCount}</strong>{" "}
              active student{activeStudentCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
          <p className="text-sm font-medium text-amber-400">No active semester</p>
          <p className="text-xs text-(--text-muted) mt-1">
            Create a semester below and set it as active to enable scheduling date windows.
          </p>
        </div>
      )}

      {/* Create New Semester */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Add Semester</h2>
        <div className="rounded-xl border border-border bg-surface p-5">
          <CreateSemesterForm />
        </div>
      </div>

      {/* Semester List */}
      {semesters.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            All Semesters ({semesters.length})
          </h2>
          <div className="space-y-2">
            {semesters.map((s) => (
              <SemesterCard key={s.id} semester={s} />
            ))}
          </div>
        </div>
      )}

      {/* Rollover */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Semester Rollover</h2>
        <RolloverForm />
      </div>
    </div>
  );
}
