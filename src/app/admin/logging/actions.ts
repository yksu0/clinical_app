"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function logCase(formData: FormData) {
  const studentId = formData.get("student_id") as string;
  const uploadId = (formData.get("upload_id") as string) || null;
  const caseTypeId = formData.get("case_type_id") as string;
  const locationId = formData.get("location_id") as string;
  const date = formData.get("date") as string;
  const notes = ((formData.get("notes") as string) ?? "").trim() || null;

  if (!studentId || !caseTypeId || !locationId || !date) {
    return { error: "All fields are required." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  // Insert case log — DB unique constraint catches duplicates
  const { data: caseLog, error: logError } = await supabase
    .from("case_logs")
    .insert({
      student_id: studentId,
      case_type_id: caseTypeId,
      location_id: locationId,
      upload_id: uploadId,
      date,
      notes,
      logged_by: user.id,
    })
    .select("id")
    .single();

  if (logError) {
    if (logError.code === "23505") {
      return { error: "A case log already exists for this student, date, and case type." };
    }
    return { error: logError.message };
  }

  // Mark upload as processed if one was linked
  if (uploadId) {
    await supabase
      .from("uploads")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("id", uploadId);
  }

  // Audit log
  await supabase.from("audit_logs").insert({
    action_type: "case_log_created",
    performed_by: user.id,
    target_table: "case_logs",
    target_id: caseLog.id,
    details: { student_id: studentId, case_type_id: caseTypeId, date },
  });

  revalidatePath("/admin/logging");
  return { success: true };
}

export async function rejectUpload(formData: FormData) {
  const uploadId = formData.get("upload_id") as string;
  if (!uploadId) return;

  const supabase = await createClient();
  await supabase
    .from("uploads")
    .update({ status: "rejected", processed_at: new Date().toISOString() })
    .eq("id", uploadId);

  revalidatePath("/admin/logging");
}

export async function batchUpdateUploads(uploadIds: string[], status: "processed" | "rejected") {
  if (uploadIds.length === 0) return { error: "No uploads selected." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  const { error } = await supabase
    .from("uploads")
    .update({ status, processed_at: new Date().toISOString() })
    .in("id", uploadIds);

  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    action_type: status === "processed" ? "upload_approved" : "upload_rejected",
    performed_by: user.id,
    target_table: "uploads",
    target_id: uploadIds[0],
    details: { upload_ids: uploadIds, count: uploadIds.length, status },
  });

  revalidatePath("/admin/logging");
  return { success: true, count: uploadIds.length };
}
