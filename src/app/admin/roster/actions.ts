"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Add a student to the pre-registration whitelist */
export async function addToRoster(formData: FormData) {
  const fullName = (formData.get("full_name") as string).trim();
  const email = (formData.get("email") as string).trim().toLowerCase() || null;
  const section = (formData.get("section") as string).trim() || null;

  if (!fullName) return;

  const supabase = await createClient();
  await supabase.from("student_roster").insert({ full_name: fullName, email, section });
  revalidatePath("/admin/roster");
}

/** Approve a signed-up student (set is_verified = true) */
export async function verifyStudent(formData: FormData) {
  const id = formData.get("id") as string;

  const supabase = await createClient();
  await supabase.from("profiles").update({ is_verified: true }).eq("id", id);
  revalidatePath("/admin/roster");
}

/** Toggle a student's active status */
export async function toggleStudentActive(formData: FormData) {
  const id = formData.get("id") as string;
  const currentActive = formData.get("is_active") === "true";

  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ is_active: !currentActive })
    .eq("id", id);
  revalidatePath("/admin/roster");
}

/** Remove an entry from the roster whitelist (only if no profile linked) */
export async function removeFromRoster(formData: FormData) {
  const id = formData.get("id") as string;

  const supabase = await createClient();
  await supabase.from("student_roster").delete().eq("id", id);
  revalidatePath("/admin/roster");
}
