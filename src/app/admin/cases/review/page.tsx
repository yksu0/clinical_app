import { createClient } from "@/lib/supabase/server";
import CasesPanel from "./CasesPanel";

type Submission = {
  id: string;
  date: string;
  submitted_at: string;
  profiles: { full_name: string; section: string | null } | null;
  case_types: { name: string } | null;
  areas_of_duty: { name: string } | null;
};

type Student = { id: string; full_name: string; section: string | null };
type CaseType = { id: string; name: string };
type AreaOfDuty = { id: string; name: string };
type Rotation = { id: string; name: string };

export default async function CasesReviewPage() {
  const supabase = await createClient();

  const [
    { data: submissionsRaw },
    { data: studentsRaw },
    { data: caseTypesRaw },
    { data: areasOfDutyRaw },
    { data: rotationsRaw },
  ] = await Promise.all([
    supabase
      .from("case_submissions")
      .select(
        `id, date, submitted_at,
         profiles!student_id(full_name, section),
         case_types(name),
         areas_of_duty(name)`
      )
      .eq("status", "pending")
      .order("submitted_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, full_name, section")
      .eq("role", "student")
      .eq("is_active", true)
      .order("full_name"),
    supabase.from("case_types").select("id, name").eq("is_active", true).order("name"),
    supabase.from("areas_of_duty").select("id, name").eq("is_active", true).order("name"),
    supabase.from("rotations").select("id, name").order("start_date", { ascending: false }),
  ]);

  const pending = (submissionsRaw ?? []) as unknown as Submission[];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Cases</h1>
        <p className="mt-1 text-sm text-(--text-secondary)">
          Review student submissions or log cases directly on behalf of a student.
        </p>
      </div>

      <CasesPanel
        pending={pending}
        students={(studentsRaw ?? []) as Student[]}
        caseTypes={(caseTypesRaw ?? []) as CaseType[]}
        areasOfDuty={(areasOfDutyRaw ?? []) as AreaOfDuty[]}
        rotations={(rotationsRaw ?? []) as Rotation[]}
      />
    </div>
  );
}
