"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createRotation(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const startDate = formData.get("start_date") as string;
  const endDate = formData.get("end_date") as string;
  const inclusiveDaysRaw = formData.getAll("inclusive_days") as string[];
  const inclusiveDays = inclusiveDaysRaw.map(Number);

  if (!name || !startDate || !endDate) {
    return { error: "Name, start date, and end date are required." };
  }
  if (endDate < startDate) {
    return { error: "End date must be on or after start date." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  const { error } = await supabase.from("rotations").insert({
    name,
    start_date: startDate,
    end_date: endDate,
    inclusive_days: inclusiveDays,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/rotations");
  return { success: true };
}

export async function updateRotation(formData: FormData) {
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const startDate = formData.get("start_date") as string;
  const endDate = formData.get("end_date") as string;
  const inclusiveDaysRaw = formData.getAll("inclusive_days") as string[];
  const inclusiveDays = inclusiveDaysRaw.map(Number);

  if (!id || !name || !startDate || !endDate) {
    return { error: "All fields are required." };
  }
  if (endDate < startDate) {
    return { error: "End date must be on or after start date." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("rotations")
    .update({ name, start_date: startDate, end_date: endDate, inclusive_days: inclusiveDays })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/rotations");
  return { success: true };
}

export async function deleteRotation(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return { error: "Missing rotation ID." };

  const supabase = await createClient();
  const { error } = await supabase.from("rotations").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/rotations");
  return { success: true };
}
