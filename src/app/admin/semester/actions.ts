"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

export type SemesterActionResult = {
  error?: string;
  success?: string;
};

export async function createSemester(
  _prev: SemesterActionResult,
  formData: FormData
): Promise<SemesterActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const name = (formData.get("name") as string)?.trim();
  const start_date = formData.get("start_date") as string;
  const end_date = (formData.get("end_date") as string) || null;

  if (!name || !start_date) return { error: "Name and start date are required." };

  const { error } = await supabase
    .from("semesters")
    .insert({ name, start_date, end_date: end_date || null, is_active: false });

  if (error) return { error: error.message };

  revalidatePath("/admin/semester");
  return { success: `Semester "${name}" created.` };
}

export async function activateSemester(id: string): Promise<SemesterActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Deactivate current active semester first
  await supabase.from("semesters").update({ is_active: false }).eq("is_active", true);

  const { error } = await supabase
    .from("semesters")
    .update({ is_active: true })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/semester");
  revalidatePath("/admin/assignments");
  return { success: "Semester activated." };
}

export async function updateSemesterDates(
  id: string,
  start_date: string,
  end_date: string | null
): Promise<SemesterActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("semesters")
    .update({ start_date, end_date: end_date || null })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/semester");
  revalidatePath("/admin/assignments");
  return { success: "Dates updated." };
}

export async function rolloverSemester(
  _prev: SemesterActionResult,
  formData: FormData
): Promise<SemesterActionResult> {
  const supabase = await createClient();
  const serviceClient = createServiceClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Double-check confirmation code
  const confirmCode = (formData.get("confirm_code") as string)?.trim();
  if (confirmCode !== "ROLLOVER") {
    return { error: 'Type ROLLOVER in the confirmation field to proceed.' };
  }

  const newSemesterName = (formData.get("new_semester_name") as string)?.trim();
  const newStartDate = formData.get("new_start_date") as string;

  if (!newSemesterName || !newStartDate) {
    return { error: "New semester name and start date are required." };
  }

  // 1. Close current active semester
  const { data: activeSemester } = await serviceClient
    .from("semesters")
    .select("id, name")
    .eq("is_active", true)
    .maybeSingle();

  if (activeSemester) {
    await serviceClient
      .from("semesters")
      .update({ is_active: false, end_date: new Date().toISOString().split("T")[0] })
      .eq("id", activeSemester.id);
  }

  // 2. Deactivate all verified students
  const { data: students } = await serviceClient
    .from("profiles")
    .select("id")
    .eq("role", "student")
    .eq("is_active", true);

  const studentCount = students?.length ?? 0;

  await serviceClient
    .from("profiles")
    .update({ is_active: false })
    .eq("role", "student")
    .eq("is_active", true);

  // 3. Create new semester as active
  await serviceClient.from("semesters").insert({
    name: newSemesterName,
    start_date: newStartDate,
    is_active: true,
  });

  // 4. Log to audit
  await serviceClient.from("audit_logs").insert({
    action_type: "semester_rollover",
    performed_by: user.id,
    target_table: "semesters",
    details: {
      previous_semester: activeSemester?.name ?? "none",
      new_semester: newSemesterName,
      students_archived: studentCount,
    },
  });

  revalidatePath("/admin/semester");
  revalidatePath("/admin");
  revalidatePath("/admin/roster");

  return {
    success: `Rolled over to "${newSemesterName}". ${studentCount} student${studentCount !== 1 ? "s" : ""} archived.`,
  };
}
