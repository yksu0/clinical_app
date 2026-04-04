"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function createAnnouncement(formData: FormData): Promise<never> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const imageFile = formData.get("image") as File | null;

  if (!title) redirect("/admin/announcements?error=Title+is+required");
  if (!content) redirect("/admin/announcements?error=Content+is+required");

  // Handle optional image upload
  let imageUrl: string | null = null;
  if (imageFile && imageFile.size > 0) {
    if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
      redirect("/admin/announcements?error=Image+must+be+JPG%2C+PNG%2C+GIF%2C+or+WEBP");
    }
    if (imageFile.size > MAX_IMAGE_BYTES) {
      redirect("/admin/announcements?error=Image+must+be+under+5+MB");
    }
    const ext = imageFile.name.split(".").pop() ?? "jpg";
    const path = `${Date.now()}-${user.id}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("announcement-images")
      .upload(path, imageFile, { contentType: imageFile.type });
    if (uploadErr) redirect(`/admin/announcements?error=${encodeURIComponent(`Image upload failed: ${uploadErr.message}`)}`);
    const { data: urlData } = supabase.storage
      .from("announcement-images")
      .getPublicUrl(path);
    imageUrl = urlData.publicUrl;
  }

  const { error } = await supabase.from("announcements").insert({
    title,
    content,
    created_by: user.id,
    image_url: imageUrl,
  });

  if (error) redirect(`/admin/announcements?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/announcements");
  revalidatePath("/feed");
  revalidatePath("/ci");
  revalidatePath("/student/dashboard");
  redirect("/admin/announcements?toast=success&message=Announcement+posted");
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
  revalidatePath("/feed");
  revalidatePath("/ci");
  revalidatePath("/student/dashboard");
  redirect("/admin/announcements?toast=success&message=Announcement+deleted");
}

