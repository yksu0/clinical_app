import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/actions/auth";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = (user.app_metadata?.role as string) ?? "student";
  if (role !== "student") redirect(role === "admin" ? "/admin" : "/ci");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const displayName = profile?.full_name ?? user.email ?? "Student";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
        <span className="text-sm font-semibold text-foreground">Clinical Cases</span>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{displayName}</p>
            <p className="text-xs text-(--text-muted)">Student</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-black">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <form action={logout}>
            <button className="text-xs text-(--text-secondary) hover:text-foreground transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
