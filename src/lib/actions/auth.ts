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
 * Token-overlap distance: returns 0 if every meaningful word in the input exists
 * in the roster name (handles natural-order input like "Juan Dela Cruz" matching
 * the stored "DELA CRUZ, JUAN A."). Returns Infinity if the tokens don't overlap.
 */
function tokenOverlapDist(input: string, rosterName: string): number {
  const toTokens = (s: string) =>
    s.toUpperCase().replace(/[^A-Z\s]/g, " ").split(/\s+/).filter((t) => t.length >= 2);
  const inputTokens = toTokens(input);
  if (inputTokens.length < 2) return Infinity;
  const rosterSet = new Set(toTokens(rosterName));
  const matched = inputTokens.filter((t) => rosterSet.has(t)).length;
  return matched === inputTokens.length ? 0 : Infinity;
}

/**
 * Called client-side on the signup form to surface "did you mean?" suggestions.
 * Returns up to 3 similar names from the roster; empty array if the input
 * already matches exactly or is too short.
 * Handles both exact-format ("DELA CRUZ, JUAN A.") and natural-order ("Juan Dela Cruz") input.
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
    .map((r) => {
      const levDist = levenshtein(normalized, r.full_name.toLowerCase());
      const tokDist = tokenOverlapDist(input, r.full_name);
      return { name: r.full_name, dist: Math.min(levDist, tokDist) };
    })
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
    .select("id, full_name, section, email")
    .ilike("full_name", trimmedName)
    .limit(1);

  const rosterEntry = rosterRows?.[0] ?? null;

  if (!rosterEntry) {
    redirect("/signup?error=name_not_found");
  }

  // If the admin pre-assigned an email for this student, enforce it
  const rosterEmail = (rosterEntry as { id: string; full_name: string; section: string | null; email: string | null }).email;
  if (rosterEmail && rosterEmail.toLowerCase() !== email.toLowerCase().trim()) {
    redirect("/signup?error=email_mismatch");
  }

  const headersList = await headers();
  const origin = headersList.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data: signUpData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: rosterEntry.full_name, roster_id: rosterEntry.id },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  // Supabase returns user_repeated_signup (email already registered) as a silent
  // "success" — identities array is empty, no email is sent, no error returned.
  // Detect this and surface it as email_in_use before doing anything else.
  const identities = signUpData?.user?.identities;
  if (signUpData?.user && Array.isArray(identities) && identities.length === 0) {
    redirect("/signup?error=email_in_use");
  }

  // Upsert profile BEFORE checking for errors — even if the confirmation email
  // fails (SMTP issue), the user may still be created in auth.users and needs a
  // matching profile row so admin can see them in "Pending Approval".
  const userId = signUpData?.user?.id;
  if (userId) {
    const serviceClient = createServiceClient();
    const normalizedEmail = email.toLowerCase().trim();

    // Remove any orphaned profile row with the same email but a different id.
    // This can occur when a test/dev account is deleted from auth.users without
    // the CASCADE reaching the profile (e.g. manual dashboard deletion).
    await serviceClient
      .from("profiles")
      .delete()
      .eq("email", normalizedEmail)
      .neq("id", userId);

    const { error: upsertError } = await serviceClient.from("profiles").upsert(
      {
        id: userId,
        full_name: rosterEntry.full_name,
        email: normalizedEmail,
        roster_id: rosterEntry.id,
        role: "student",
        section: (rosterEntry as { id: string; full_name: string; section: string | null }).section ?? null,
        is_verified: false,
        is_active: true,
      },
      { onConflict: "id" },
    );
    if (upsertError) {
      console.error("[signup] profile upsert failed for", userId, upsertError.message);
    }
  }

  if (error) {
    const msg = error.message.toLowerCase();

    // If the auth user was created (userId exists), the account is good even if
    // Supabase returned a non-critical error (e.g. SMTP delivery acknowledgement
    // quirks). Only hard-stop on errors that mean the account was NOT created.
    if (!userId) {
      let code = "signup_failed";
      if (msg.includes("rate limit")) code = "email_rate_limit";
      else if (msg.includes("already registered") || msg.includes("already been registered")) code = "email_in_use";
      redirect(`/signup?error=${code}`);
    }

    // userId exists — account created. If it's a true duplicate, surface that.
    if (msg.includes("already registered") || msg.includes("already been registered")) {
      redirect("/signup?error=email_in_use");
    }
    // Otherwise treat as success (email likely sent despite error response).
  }

  // Account created — pending admin verification
  redirect("/signup?success=check_email");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/** Send a password-reset email. Always shows success to prevent email enumeration. */
export async function requestPasswordReset(formData: FormData) {
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  if (!email) redirect("/forgot-password?error=missing_email");

  const headersList = await headers();
  const origin = headersList.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  // Always redirect to success — never reveal whether the email exists
  redirect("/forgot-password?success=check_email");
}

/** Update the authenticated user's password (called from /reset-password). */
export async function resetPassword(formData: FormData) {
  const password = (formData.get("password") as string) ?? "";
  const confirm = (formData.get("confirm") as string) ?? "";

  if (!password || password.length < 8) {
    redirect("/reset-password?error=too_short");
  }
  if (password !== confirm) {
    redirect("/reset-password?error=mismatch");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect("/reset-password?error=update_failed");
  }

  redirect("/login?success=password_reset");
}
