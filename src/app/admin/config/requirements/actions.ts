"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setRequirement(formData: FormData) {
  const caseTypeId = formData.get("case_type_id") as string;
  const count = parseInt(formData.get("required_count") as string, 10);

  if (!caseTypeId || isNaN(count) || count < 1) return;

  const supabase = await createClient();

  // Upsert — update if exists, insert if not
  await supabase
    .from("requirements")
    .upsert(
      { case_type_id: caseTypeId, required_count: count },
      { onConflict: "case_type_id" }
    );

  revalidatePath("/admin/config/requirements");
}
