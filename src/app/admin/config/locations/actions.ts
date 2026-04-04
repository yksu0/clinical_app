"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addLocation(formData: FormData) {
  const name = (formData.get("name") as string).trim();
  if (!name) return;

  const supabase = await createClient();
  await supabase.from("locations").insert({ name });
  revalidatePath("/admin/config/locations");
}

export async function renameLocation(formData: FormData) {
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string).trim();
  if (!id || !name) return;

  const supabase = await createClient();
  await supabase.from("locations").update({ name }).eq("id", id);
  revalidatePath("/admin/config/locations");
}

export async function toggleLocation(formData: FormData) {
  const id = formData.get("id") as string;
  const currentActive = formData.get("is_active") === "true";

  const supabase = await createClient();
  await supabase
    .from("locations")
    .update({ is_active: !currentActive })
    .eq("id", id);
  revalidatePath("/admin/config/locations");
}
