"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function createUploadRecord(
  filePath: string,
  fileName: string,
  mimeType?: string,
  sizeBytes?: number,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Server-side validation — defence in depth against client bypass
  if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error("Invalid file type. Only JPG, PNG, and PDF are accepted.");
  }
  if (sizeBytes !== undefined && sizeBytes > MAX_SIZE_BYTES) {
    throw new Error("File exceeds 10 MB limit.");
  }

  const { error } = await supabase.from("uploads").insert({
    student_id: user.id,
    file_path: filePath,
    file_name: fileName,
    status: "pending",
  });

  if (error) throw new Error(error.message);

  revalidatePath("/student/upload");
}
