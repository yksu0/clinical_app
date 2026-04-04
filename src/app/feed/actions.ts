"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { refresh } from "next/cache";

export async function addComment(
  _: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const announcementId = (formData.get("announcement_id") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();

  if (!announcementId) return { error: "Invalid announcement." };
  if (!content) return { error: "Comment cannot be empty." };
  if (content.length > 500) return { error: "Comment must be 500 characters or less." };

  const { error } = await supabase.from("announcement_comments").insert({
    announcement_id: announcementId,
    user_id: user.id,
    content,
  });

  if (error) return { error: error.message };

  revalidatePath("/feed");
  refresh();
  return { error: null };
}

export async function deleteComment(commentId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("announcement_comments")
    .delete()
    .eq("id", commentId);

  if (error) return { error: error.message };

  revalidatePath("/feed");
  refresh();
  return { error: null };
}

// Void-returning variant for use as a form action (bound with commentId)
export async function deleteCommentAction(
  commentId: string,
  _formData: FormData
): Promise<void> {
  await deleteComment(commentId);
}
