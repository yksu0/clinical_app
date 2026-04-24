import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import ReviewForm from "./ReviewForm";

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: submissionRaw },
    { data: caseTypes },
    { data: areasOfDuty },
    { data: rotations },
  ] = await Promise.all([
    supabase
      .from("case_submissions")
      .select(
        `id, case_type_id, area_of_duty_id, rotation_id, upload_id,
         date, notes, status, submitted_at,
         profiles!student_id(full_name, section),
         case_types(name),
         areas_of_duty(name)`
      )
      .eq("id", id)
      .single(),
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
  ]);

  if (!submissionRaw) notFound();

  const sub = submissionRaw as unknown as {
    id: string;
    case_type_id: string;
    area_of_duty_id: string;
    rotation_id: string | null;
    upload_id: string | null;
    date: string;
    notes: string | null;
    status: string;
    submitted_at: string;
    profiles: { full_name: string; section: string | null } | null;
    case_types: { name: string } | null;
    areas_of_duty: { name: string } | null;
  };

  if (sub.status !== "pending") redirect("/admin/cases/review");

  // Fetch linked upload name if any
  let upload: { id: string; file_name: string } | null = null;
  if (sub.upload_id) {
    const { data } = await supabase
      .from("uploads")
      .select("id, file_name")
      .eq("id", sub.upload_id)
      .single();
    upload = data;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <Link
          href="/admin/cases/review"
          className="inline-flex items-center gap-1.5 text-xs text-(--text-secondary) hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to Review Queue
        </Link>
        <h1 className="text-2xl font-bold text-white">Review Submission</h1>
        <p className="text-sm text-white/50 mt-1">
          Review and approve or reject this student case submission.
        </p>
      </div>

      {/* Submission metadata */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1.5">
        <p className="text-sm font-semibold text-white">
          {sub.profiles?.full_name ?? "Unknown Student"}
          {sub.profiles?.section && (
            <span className="ml-2 text-xs text-white/40 font-normal">
              {sub.profiles.section}
            </span>
          )}
        </p>
        <p className="text-xs text-white/50">
          Submitted on{" "}
          {new Date(sub.submitted_at).toLocaleDateString("en-AU", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
        <p className="text-xs text-white/40">
          Originally reported: {sub.case_types?.name ?? "—"} at{" "}
          {sub.areas_of_duty?.name ?? "—"}
        </p>
      </div>

      <ReviewForm
        submission={{
          id: sub.id,
          case_type_id: sub.case_type_id,
          area_of_duty_id: sub.area_of_duty_id,
          rotation_id: sub.rotation_id,
          upload_id: sub.upload_id,
          date: sub.date,
          notes: sub.notes,
        }}
        caseTypes={caseTypes ?? []}
        areasOfDuty={areasOfDuty ?? []}
        rotations={rotations ?? []}
        upload={upload}
      />
    </div>
  );
}
