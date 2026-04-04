"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createAssignment(formData: FormData) {
  const studentId = formData.get("student_id") as string;
  const caseTypeId = formData.get("case_type_id") as string;
  const locationId = formData.get("location_id") as string;
  const scheduledDate = formData.get("scheduled_date") as string;

  if (!studentId || !caseTypeId || !locationId || !scheduledDate) {
    return { error: "All fields are required." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  const { data: assignment, error } = await supabase
    .from("assignments")
    .insert({
      student_id: studentId,
      case_type_id: caseTypeId,
      location_id: locationId,
      scheduled_date: scheduledDate,
      assigned_by: user.id,
      status: "assigned",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    action_type: "assignment_created",
    performed_by: user.id,
    target_table: "assignments",
    target_id: assignment.id,
    details: { student_id: studentId, case_type_id: caseTypeId, scheduled_date: scheduledDate },
  });

  revalidatePath("/admin/assignments");
  return { success: true };
}

export async function updateAssignmentStatus(formData: FormData) {
  const assignmentId = formData.get("assignment_id") as string;
  const status = formData.get("status") as string;
  if (!assignmentId || !status) return;

  const supabase = await createClient();
  await supabase
    .from("assignments")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", assignmentId);

  revalidatePath("/admin/assignments");
}
