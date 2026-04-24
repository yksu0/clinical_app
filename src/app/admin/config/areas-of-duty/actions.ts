"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addAreaOfDuty(formData: FormData) {
  const name = (formData.get("name") as string).trim();
  if (!name) return;

  const supabase = await createClient();
  await supabase.from("areas_of_duty").insert({ name });
  revalidatePath("/admin/config/areas-of-duty");
}

export async function renameAreaOfDuty(formData: FormData) {
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string).trim();
  if (!id || !name) return;

  const supabase = await createClient();
  await supabase.from("areas_of_duty").update({ name }).eq("id", id);
  revalidatePath("/admin/config/areas-of-duty");
}

export async function toggleAreaOfDuty(formData: FormData) {
  const id = formData.get("id") as string;
  const currentActive = formData.get("is_active") === "true";

  const supabase = await createClient();
  await supabase
    .from("areas_of_duty")
    .update({ is_active: !currentActive })
    .eq("id", id);
  revalidatePath("/admin/config/areas-of-duty");
}
