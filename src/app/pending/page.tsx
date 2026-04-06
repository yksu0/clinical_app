import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "@/lib/actions/auth";

export default async function PendingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not logged in, send to login
  if (!user) redirect("/login");

  // If somehow verified already, route normally
  const role = (user.app_metadata?.role as string) ?? "student";
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_verified, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.is_verified) {
    if (role === "admin") redirect("/admin");
    else if (role === "ci") redirect("/ci");
    else redirect("/student");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-2xl text-center">
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-accent/30 bg-accent/10">
          <svg
            className="h-7 w-7 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-foreground">Pending Approval</h1>
        <p className="mt-2 text-sm text-(--text-secondary)">
          Hi{profile?.full_name ? ` ${profile.full_name}` : ""}, your account
          has been created and your email is confirmed.
        </p>
        <p className="mt-1 text-sm text-(--text-secondary)">
          An admin needs to verify your account before you can access the
          system. Please check back later.
        </p>

        <div className="mt-6 rounded-lg border border-border bg-elevated px-4 py-3 text-left">
          <p className="text-xs text-(--text-muted) leading-relaxed">
            If you believe this is taking too long, contact your instructor or
            programme coordinator and provide your registered email address.
          </p>
        </div>

        <form action={logout} className="mt-6">
          <button
            type="submit"
            className="text-sm font-medium text-(--text-muted) hover:text-foreground transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
