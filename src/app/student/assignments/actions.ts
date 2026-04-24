"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function requestCancelAssignment(formData: FormData) {
  const assignmentId = formData.get("assignment_id") as string;
  const reason = ((formData.get("reason") as string) ?? "").trim();

  if (!assignmentId) return { error: "Missing assignment ID." };
  if (!reason) return { error: "Please provide a reason." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  // Verify ownership and status
  const { data: assignment } = await supabase
    .from("assignments")
    .select("id, student_id, status")
    .eq("id", assignmentId)
    .single();

  if (!assignment || assignment.student_id !== user.id) {
    return { error: "Assignment not found." };
  }

  if (assignment.status !== "scheduled") {
    return { error: "Only open assignments can be cancelled." };
  }

  const { error } = await supabase
    .from("assignments")
    .update({
      status: "cancel_requested",
      cancellation_reason: reason,
      cancellation_requested_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", assignmentId);

  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    action_type: "assignment_cancel_requested",
    performed_by: user.id,
    target_table: "assignments",
    target_id: assignmentId,
    details: { reason },
  });

  revalidatePath("/student/assignments");
  return { success: true };
}
