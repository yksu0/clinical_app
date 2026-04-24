"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addShift(formData: FormData) {
  const name = (formData.get("name") as string).trim();
  if (!name) return;

  const supabase = await createClient();
  await supabase.from("shifts").insert({ name });
  revalidatePath("/admin/config/shifts");
}

export async function renameShift(formData: FormData) {
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string).trim();
  if (!id || !name) return;

  const supabase = await createClient();
  await supabase.from("shifts").update({ name }).eq("id", id);
  revalidatePath("/admin/config/shifts");
}

export async function toggleShift(formData: FormData) {
  const id = formData.get("id") as string;
  const currentActive = formData.get("is_active") === "true";

  const supabase = await createClient();
  await supabase.from("shifts").update({ is_active: !currentActive }).eq("id", id);
  revalidatePath("/admin/config/shifts");
}
