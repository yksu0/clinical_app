"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/** Levenshtein distance between two strings (optimised two-row approach) */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let curr = new Array<number>(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      curr[j] =
        a[i - 1] === b[j - 1]
          ? prev[j - 1]
          : 1 + Math.min(prev[j - 1], prev[j], curr[j - 1]);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/**
 * Called client-side on the signup form to surface "did you mean?" suggestions.
 * Returns up to 3 similar names from the roster; empty array if the input
 * already matches exactly or is too short.
 */
export async function findSimilarNames(rawInput: string): Promise<string[]> {
  const input = rawInput.trim();
  if (input.length < 3) return [];

  const supabase = await createClient();

  // If the name already matches exactly there is nothing to suggest
  const { data: exact } = await supabase
    .from("student_roster")
    .select("id")
    .ilike("full_name", input)
    .maybeSingle();
  if (exact) return [];

  const { data: all } = await supabase.from("student_roster").select("full_name");
  if (!all || all.length === 0) return [];

  const normalized = input.toLowerCase();
  // Allow up to 25 % of characters to differ, min 1, max 3
  const threshold = Math.max(1, Math.min(3, Math.floor(normalized.length * 0.25)));

  return all
    .map((r) => ({ name: r.full_name, dist: levenshtein(normalized, r.full_name.toLowerCase()) }))
    .filter((r) => r.dist <= threshold)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 3)
    .map((r) => r.name);
}

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
  const trimmedName = fullName?.trim();

  if (!trimmedName) {
    redirect("/signup?error=name_not_found");
  }

  // Verify the name exists in the pre-registered roster (case-insensitive)
  const { data: rosterRows } = await supabase
    .from("student_roster")
    .select("id")
    .ilike("full_name", trimmedName)
    .limit(1);

  const rosterEntry = rosterRows?.[0] ?? null;

  if (!rosterEntry) {
    redirect("/signup?error=name_not_found");
  }

  const headersList = await headers();
  const origin = headersList.get("origin") ?? "https://clinicalapp-vert.vercel.app";

  const { data: signUpData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: trimmedName, roster_id: rosterEntry.id },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    const code = error.message.toLowerCase().includes("rate limit") ? "email_rate_limit" : "signup_failed";
    redirect(`/signup?error=${code}`);
  }

  // Explicitly upsert profile in case the DB trigger fails silently
  if (signUpData.user) {
    const serviceClient = createServiceClient();
    await serviceClient.from("profiles").upsert(
      {
        id: signUpData.user.id,
        full_name: trimmedName,
        email: email.toLowerCase().trim(),
        roster_id: rosterEntry.id,
        role: "student",
        is_verified: false,
        is_active: true,
      },
      { onConflict: "id" },
    );
  }

  // Account created — pending admin verification
  redirect("/signup?success=check_email");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
