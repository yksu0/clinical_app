import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import SubmitCaseForm from "../SubmitCaseForm";

type OpenAssignment = {
  id: string;
  areas_of_duty: { name: string } | null;
  scheduled_date: string;
};

export default async function SubmitCasePage({
  searchParams,
}: {
  searchParams: Promise<{ resubmit?: string }>;
}) {
  const { resubmit: resubmitId } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: caseTypes },
    { data: areasOfDuty },
    { data: rotations },
    { data: uploads },
    { data: assignments },
  ] = await Promise.all([
    supabase
      .from("case_types")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("areas_of_duty")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("rotations")
      .select("id, name")
      .order("start_date", { ascending: false }),
    supabase
      .from("uploads")
      .select("id, file_name, uploaded_at")
      .eq("student_id", user.id)
      .eq("status", "pending")
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("assignments")
      .select("id, scheduled_date, areas_of_duty(name)")
      .eq("student_id", user.id)
      .eq("status", "scheduled")
      .order("scheduled_date", { ascending: false }),
  ]);

  let existingSubmission:
    | {
        id: string;
        case_type_id: string;
        area_of_duty_id: string;
        rotation_id: string | null;
        upload_id: string | null;
        date: string;
        notes: string | null;
        admin_note: string | null;
        status: string;
      }
    | undefined;

  if (resubmitId) {
    const { data } = await supabase
      .from("case_submissions")
      .select(
        "id, case_type_id, area_of_duty_id, rotation_id, upload_id, date, notes, admin_note, status"
      )
      .eq("id", resubmitId)
      .eq("student_id", user.id)
      .single();

    if (!data || !["pending", "rejected"].includes(data.status)) {
      redirect("/student/cases");
    }
    existingSubmission = data as typeof existingSubmission;
  }

  const isResubmit = !!existingSubmission;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div>
        <Link
          href="/student/cases"
          className="inline-flex items-center gap-1.5 text-xs text-(--text-secondary) hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          My Submissions
        </Link>
        <h1 className="text-2xl font-bold text-white">
          {isResubmit ? "Edit & Resubmit Case" : "Submit a Case"}
        </h1>
        <p className="text-sm text-white/50 mt-1">
          {isResubmit
            ? "Update your case details and resubmit for admin review."
            : "Fill in the details of a clinical case you completed. An admin will review and approve it."}
        </p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <SubmitCaseForm
          caseTypes={caseTypes ?? []}
          areasOfDuty={areasOfDuty ?? []}
          rotations={rotations ?? []}
          uploads={uploads ?? []}
          openAssignments={
            (assignments ?? []) as unknown as OpenAssignment[]
          }
          existingSubmission={existingSubmission}
        />
      </div>
    </div>
  );
}
