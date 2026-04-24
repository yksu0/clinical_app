"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function logCase(formData: FormData) {
  const studentId = formData.get("student_id") as string;
  const uploadId = (formData.get("upload_id") as string) || null;
  const caseTypeId = formData.get("case_type_id") as string;
  const areaOfDutyId = formData.get("area_of_duty_id") as string;
  const date = formData.get("date") as string;
  const notes = ((formData.get("notes") as string) ?? "").trim() || null;
  const rotationId = (formData.get("rotation_id") as string) || null;

  if (!studentId || !caseTypeId || !areaOfDutyId || !date) {
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
      area_of_duty_id: areaOfDutyId,
      rotation_id: rotationId,
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

  // Auto-complete a matching open assignment (same student + case type + date)
  let assignmentCompleted = false;
  const { data: matchingAssignment } = await supabase
    .from("assignments")
    .select("id")
    .eq("student_id", studentId)
    .eq("case_type_id", caseTypeId)
    .eq("scheduled_date", date)
    .in("status", ["assigned", "cancel_requested"])
    .limit(1)
    .maybeSingle();

  if (matchingAssignment) {
    const { error: updateErr } = await supabase
      .from("assignments")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", matchingAssignment.id);
    if (!updateErr) {
      assignmentCompleted = true;
      await supabase.from("audit_logs").insert({
        action_type: "assignment_completed",
        performed_by: user.id,
        target_table: "assignments",
        target_id: matchingAssignment.id,
        details: { auto_completed_via: "case_log", case_log_id: caseLog.id },
      });
    }
  }

  revalidatePath("/admin/logging");
  return { success: true, assignmentCompleted };
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

/** Generate a signed preview URL for an upload (admin only). */
export async function getUploadPreviewUrl(uploadId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  // Verify caller is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return { error: "Forbidden." };

  // Fetch file_path from uploads table
  const { data: upload, error: fetchErr } = await supabase
    .from("uploads")
    .select("file_path")
    .eq("id", uploadId)
    .single();
  if (fetchErr || !upload) return { error: "Upload not found." };

  // Use service client to bypass storage RLS
  const service = createServiceClient();
  const { data, error } = await service.storage
    .from("case-uploads")
    .createSignedUrl(upload.file_path, 3600); // 1 hour

  if (error || !data?.signedUrl) return { error: "Could not generate preview URL." };

  return { url: data.signedUrl };
}
