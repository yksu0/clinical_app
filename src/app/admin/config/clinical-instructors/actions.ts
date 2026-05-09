"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

type Result = { error?: string; success?: boolean; link?: string };

export async function createClinicalInstructor(formData: FormData): Promise<Result> {
  const fullName = (formData.get("full_name") as string ?? "").trim();
  const email = (formData.get("email") as string ?? "").trim().toLowerCase();

  if (!fullName || !email) return { error: "Name and email are required." };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const serviceClient = createServiceClient();

  // Invite user — Supabase sends the invite email automatically
  const { data, error } = await serviceClient.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: `${siteUrl}/auth/callback`,
  });

  if (error) return { error: error.message };

  const userId = data.user.id;

  // Create/ensure the profile row with role ci
  const { error: profileError } = await serviceClient.from("profiles").upsert(
    {
      id: userId,
      full_name: fullName,
      email,
      role: "ci",
      is_verified: true,
      is_active: true,
    },
    { onConflict: "id" },
  );

  if (profileError) return { error: profileError.message };

  revalidatePath("/admin/config/clinical-instructors");
  return { success: true };
}

export async function updateClinicalInstructor(formData: FormData): Promise<Result> {
  const id = formData.get("id") as string;
  const fullName = (formData.get("full_name") as string ?? "").trim();

  if (!id || !fullName) return { error: "Name is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", id)
    .eq("role", "ci");

  if (error) return { error: error.message };

  revalidatePath("/admin/config/clinical-instructors");
  return { success: true };
}

export async function deleteClinicalInstructor(formData: FormData): Promise<Result> {
  const id = formData.get("id") as string;
  if (!id) return { error: "Missing ID." };

  const serviceClient = createServiceClient();
  const { error } = await serviceClient.auth.admin.deleteUser(id);

  if (error) return { error: error.message };

  revalidatePath("/admin/config/clinical-instructors");
  return { success: true };
}

export async function toggleClinicalInstructor(formData: FormData) {
  const id = formData.get("id") as string;
  const currentActive = formData.get("is_active") === "true";

  const supabase = await createClient();
  await supabase.from("profiles").update({ is_active: !currentActive }).eq("id", id);
  revalidatePath("/admin/config/clinical-instructors");
}

export async function resendCICredentials(formData: FormData): Promise<Result> {
  const email = formData.get("email") as string;
  if (!email) return { error: "Missing email." };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const serviceClient = createServiceClient();

  // Generate a password-reset link the admin can share with the CI
  const { data, error } = await serviceClient.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${siteUrl}/auth/callback?next=/ci` },
  });

  if (error) return { error: error.message };

  return { success: true, link: data.properties.action_link };
}
