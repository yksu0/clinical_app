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

export async function editComment(commentId: string, newContent: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  if (!newContent.trim()) return { error: "Comment cannot be empty." };
  if (newContent.length > 500) return { error: "Comment must be 500 characters or less." };

  // Check ownership and 15-min window
  const { data: comment } = await supabase
    .from("announcement_comments")
    .select("id, user_id, created_at")
    .eq("id", commentId)
    .single();

  if (!comment || comment.user_id !== user.id) {
    return { error: "Cannot edit this comment." };
  }

  const createdAt = new Date(comment.created_at).getTime();
  const now = Date.now();
  const fifteenMin = 15 * 60 * 1000;
  if (now - createdAt > fifteenMin) {
    return { error: "Comments can only be edited within 15 minutes." };
  }

  const { error } = await supabase
    .from("announcement_comments")
    .update({ content: newContent.trim() })
    .eq("id", commentId);

  if (error) return { error: error.message };

  revalidatePath("/feed");
  refresh();
  return { error: null };
}
