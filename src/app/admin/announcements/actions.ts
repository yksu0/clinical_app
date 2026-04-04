"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createAnnouncement(
  _: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated.", success: false };

  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();

  if (!title) return { error: "Title is required.", success: false };
  if (!content) return { error: "Content is required.", success: false };

  const { error } = await supabase.from("announcements").insert({
    title,
    content,
    created_by: user.id,
  });

  if (error) return { error: error.message, success: false };

  revalidatePath("/admin/announcements");
  revalidatePath("/ci");
  revalidatePath("/student/dashboard");
  return { error: null, success: true };
}

export async function deleteAnnouncement(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/announcements");
  revalidatePath("/ci");
  revalidatePath("/student/dashboard");
  return { error: null };
}
