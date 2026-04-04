"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addCaseType(formData: FormData) {
  const name = (formData.get("name") as string).trim();
  if (!name) return;

  const supabase = await createClient();
  await supabase.from("case_types").insert({ name });
  revalidatePath("/admin/config/case-types");
}

export async function renameCaseType(formData: FormData) {
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string).trim();
  if (!id || !name) return;

  const supabase = await createClient();
  await supabase.from("case_types").update({ name }).eq("id", id);
  revalidatePath("/admin/config/case-types");
}

export async function toggleCaseType(formData: FormData) {
  const id = formData.get("id") as string;
  const currentActive = formData.get("is_active") === "true";

  const supabase = await createClient();
  await supabase
    .from("case_types")
    .update({ is_active: !currentActive })
    .eq("id", id);
  revalidatePath("/admin/config/case-types");
}
