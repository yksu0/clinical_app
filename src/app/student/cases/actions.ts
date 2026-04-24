"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function submitCase(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  const assignmentId = (formData.get("assignment_id") as string) || null;
  const caseTypeId = formData.get("case_type_id") as string;
  const areaOfDutyId = formData.get("area_of_duty_id") as string;
  const rotationId = (formData.get("rotation_id") as string) || null;
  const uploadId = (formData.get("upload_id") as string) || null;
  const date = formData.get("date") as string;
  const notes = ((formData.get("notes") as string) ?? "").trim() || null;

  if (!caseTypeId || !areaOfDutyId || !date) {
    return { error: "Case type, area of duty, and date are required." };
  }

  const { error } = await supabase.from("case_submissions").insert({
    student_id: user.id,
    assignment_id: assignmentId,
    case_type_id: caseTypeId,
    area_of_duty_id: areaOfDutyId,
    rotation_id: rotationId,
    upload_id: uploadId,
    date,
    notes,
    status: "pending",
  });

  if (error) return { error: error.message };

  revalidatePath("/student/cases");
  return { success: true };
}

export async function resubmitCase(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  const submissionId = formData.get("submission_id") as string;
  const caseTypeId = formData.get("case_type_id") as string;
  const areaOfDutyId = formData.get("area_of_duty_id") as string;
  const rotationId = (formData.get("rotation_id") as string) || null;
  const uploadId = (formData.get("upload_id") as string) || null;
  const date = formData.get("date") as string;
  const notes = ((formData.get("notes") as string) ?? "").trim() || null;

  if (!submissionId || !caseTypeId || !areaOfDutyId || !date) {
    return { error: "All fields are required." };
  }

  // Verify ownership and editable status (RLS also enforces this)
  const { data: existing } = await supabase
    .from("case_submissions")
    .select("id, status")
    .eq("id", submissionId)
    .eq("student_id", user.id)
    .single();

  if (!existing) return { error: "Submission not found." };
  if (!["pending", "rejected"].includes(existing.status)) {
    return { error: "Only pending or rejected submissions can be edited." };
  }

  const { error } = await supabase
    .from("case_submissions")
    .update({
      case_type_id: caseTypeId,
      area_of_duty_id: areaOfDutyId,
      rotation_id: rotationId,
      upload_id: uploadId,
      date,
      notes,
      status: "pending",
      admin_note: null,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", submissionId)
    .eq("student_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/student/cases");
  return { success: true };
}
