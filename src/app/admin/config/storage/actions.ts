"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function getSignedUrls(
  uploadIds: string[]
): Promise<{ id: string; fileName: string; url: string }[]> {
  if (uploadIds.length === 0) return [];

  const supabase = await createClient();
  const service = createServiceClient();

  const { data: uploads } = await supabase
    .from("uploads")
    .select("id, file_name, file_path")
    .in("id", uploadIds)
    .eq("archived", false);

  if (!uploads || uploads.length === 0) return [];

  const paths = uploads.map((u) => u.file_path);
  const { data: signedData } = await service.storage
    .from("case-uploads")
    .createSignedUrls(paths, 3600);

  if (!signedData) return [];

  return uploads
    .map((u) => {
      const entry = signedData.find((s) => s.path === u.file_path);
      if (!entry?.signedUrl) return null;
      return { id: u.id, fileName: u.file_name, url: entry.signedUrl };
    })
    .filter((x): x is { id: string; fileName: string; url: string } => x !== null);
}

export async function archiveUploads(
  uploadIds: string[]
): Promise<{ archivedCount: number } | { error: string }> {
  if (uploadIds.length === 0) return { archivedCount: 0 };

  const supabase = await createClient();
  const service = createServiceClient();

  // Verify admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  const { data: uploads } = await supabase
    .from("uploads")
    .select("id, file_path")
    .in("id", uploadIds)
    .eq("archived", false);

  if (!uploads || uploads.length === 0) return { archivedCount: 0 };

  // Delete from storage (best-effort; continue even if some files are missing)
  const paths = uploads.map((u) => u.file_path);
  await service.storage.from("case-uploads").remove(paths);

  // Mark archived in DB
  const { error } = await supabase
    .from("uploads")
    .update({ archived: true, archived_at: new Date().toISOString() })
    .in("id", uploadIds);

  if (error) return { error: error.message };

  // Audit log
  await supabase.from("audit_logs").insert({
    action_type: "uploads_archived",
    performed_by: user.id,
    target_table: "uploads",
    target_id: uploadIds[0],
    details: { archived_count: uploads.length, upload_ids: uploadIds },
  });

  revalidatePath("/admin/config/storage");
  return { archivedCount: uploads.length };
}

export async function updateStorageThreshold(
  formData: FormData
): Promise<{ error: string | null }> {
  const gbStr = formData.get("threshold_gb") as string;
  const gb = parseFloat(gbStr);
  if (isNaN(gb) || gb <= 0 || gb > 1000) {
    return { error: "Threshold must be a positive number up to 1000 GB." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  const { error } = await supabase
    .from("system_settings")
    .update({ value: String(gb), updated_at: new Date().toISOString() })
    .eq("key", "storage_threshold_gb");

  if (error) return { error: error.message };

  revalidatePath("/admin/config/storage");
  return { error: null };
}
