"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createUploadRecord(filePath: string, fileName: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("uploads").insert({
    student_id: user.id,
    file_path: filePath,
    file_name: fileName,
    status: "pending",
  });

  if (error) throw new Error(error.message);

  revalidatePath("/student/upload");
}
