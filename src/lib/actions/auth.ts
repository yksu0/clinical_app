"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=invalid_credentials");
  }

  redirect("/");
}

export async function signup(formData: FormData) {
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();

  // Verify the name exists in the pre-registered roster (case-insensitive)
  const { data: rosterEntry } = await supabase
    .from("student_roster")
    .select("id")
    .ilike("full_name", fullName.trim())
    .maybeSingle();

  if (!rosterEntry) {
    redirect("/signup?error=name_not_found");
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, roster_id: rosterEntry.id },
    },
  });

  if (error) {
    redirect("/signup?error=signup_failed");
  }

  // Account created — pending admin verification
  redirect("/signup?success=check_email");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
