"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type BulkResult = { added: number; skipped: number };

/** Bulk-insert multiple students from a pasted list into the whitelist */
export async function bulkAddToRoster(
  _prev: BulkResult | null,
  formData: FormData,
): Promise<BulkResult> {
  const raw = formData.get("names") as string;
  if (!raw?.trim()) return { added: 0, skipped: 0 };

  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const parsed: { full_name: string; email: string | null; section: string | null }[] = [];

  for (const line of lines) {
    const parts = line.split("|").map((p) => p.trim());
    const fullName = parts[0];
    if (!fullName) continue;
    const email = parts[1]?.toLowerCase() || null;
    const section = parts[2] || null;
    parsed.push({ full_name: fullName, email, section });
  }

  if (parsed.length === 0) return { added: 0, skipped: 0 };

  const supabase = await createClient();
  const { data: existing } = await supabase.from("student_roster").select("full_name");
  const existingLower = new Set((existing ?? []).map((r) => r.full_name.toLowerCase()));

  const toInsert = parsed.filter((p) => !existingLower.has(p.full_name.toLowerCase()));
  const skipped = parsed.length - toInsert.length;

  if (toInsert.length > 0) {
    await supabase.from("student_roster").insert(toInsert);
  }

  revalidatePath("/admin/roster");
  return { added: toInsert.length, skipped };
}

/** Add a student to the pre-registration whitelist */
export async function addToRoster(formData: FormData) {
  const fullName = (formData.get("full_name") as string).trim();
  const email = (formData.get("email") as string).trim().toLowerCase() || null;
  const section = (formData.get("section") as string).trim() || null;

  if (!fullName) return;

  const supabase = await createClient();
  await supabase.from("student_roster").insert({ full_name: fullName, email, section });
  revalidatePath("/admin/roster");
}

/** Approve a signed-up student (set is_verified = true) */
export async function verifyStudent(formData: FormData) {
  const id = formData.get("id") as string;

  const supabase = await createClient();
  await supabase.from("profiles").update({ is_verified: true }).eq("id", id);
  revalidatePath("/admin/roster");
}

/** Toggle a student's active status */
export async function toggleStudentActive(formData: FormData) {
  const id = formData.get("id") as string;
  const currentActive = formData.get("is_active") === "true";

  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ is_active: !currentActive })
    .eq("id", id);
  revalidatePath("/admin/roster");
}

/** Remove an entry from the roster whitelist (only if no profile linked) */
export async function removeFromRoster(formData: FormData) {
  const id = formData.get("id") as string;

  const supabase = await createClient();
  await supabase.from("student_roster").delete().eq("id", id);
  revalidatePath("/admin/roster");
}
