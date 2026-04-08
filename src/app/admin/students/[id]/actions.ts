"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function upsertOverride(formData: FormData) {
  const studentId = formData.get("student_id") as string;
  const caseTypeId = formData.get("case_type_id") as string;
  const adjustedCount = parseInt(formData.get("adjusted_count") as string, 10);
  const reason = ((formData.get("reason") as string) ?? "").trim() || null;

  if (!studentId || !caseTypeId || isNaN(adjustedCount) || adjustedCount < 0) {
    return { error: "Invalid input." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  const { error } = await supabase
    .from("requirement_overrides")
    .upsert(
      {
        student_id: studentId,
        case_type_id: caseTypeId,
        adjusted_count: adjustedCount,
        reason,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "student_id,case_type_id" }
    );

  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    action_type: "requirement_override",
    performed_by: user.id,
    target_table: "requirement_overrides",
    target_id: studentId,
    details: { student_id: studentId, case_type_id: caseTypeId, adjusted_count: adjustedCount, reason },
  });

  revalidatePath(`/admin/students/${studentId}`);
  return { success: true };
}

export async function removeOverride(formData: FormData) {
  const studentId = formData.get("student_id") as string;
  const caseTypeId = formData.get("case_type_id") as string;

  if (!studentId || !caseTypeId) return { error: "Invalid input." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  const { error } = await supabase
    .from("requirement_overrides")
    .delete()
    .eq("student_id", studentId)
    .eq("case_type_id", caseTypeId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/students/${studentId}`);
  return { success: true };
}
