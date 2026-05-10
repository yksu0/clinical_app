import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Email is now confirmed — create the profile so the student appears
      // in the admin pending list for the first time.
      const { data: { user } } = await supabase.auth.getUser();

      if (user?.email) {
        const serviceClient = createServiceClient();

        // Idempotent — skip if profile already exists (e.g. re-confirmation click)
        const { data: existing } = await serviceClient
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (!existing) {
          const rosterId = user.user_metadata?.roster_id as string | undefined;
          if (rosterId) {
            const { data: rosterEntry } = await serviceClient
              .from("student_roster")
              .select("id, full_name, section")
              .eq("id", rosterId)
              .single();

            if (rosterEntry) {
              const normalizedEmail = user.email.toLowerCase();

              // Remove orphaned profile rows with the same email but a different id.
              await serviceClient
                .from("profiles")
                .delete()
                .eq("email", normalizedEmail)
                .neq("id", user.id);

              await serviceClient.from("profiles").upsert(
                {
                  id: user.id,
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
            }
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — redirect to login with an error indicator
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
