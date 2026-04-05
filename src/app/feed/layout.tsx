import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/Sidebar";
import CINav from "@/components/ci/CINav";
import StudentNav from "@/components/student/StudentNav";

export default async function FeedLayout({
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

  // Profile query only if needed for display name — runs after auth check
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const displayName = profile?.full_name ?? user.email ?? "User";

  if (role === "admin") {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <AdminSidebar />
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <header className="flex h-16 shrink-0 items-center justify-end border-b border-border bg-surface px-4 md:px-6">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">{displayName}</p>
                <p className="text-xs text-(--text-muted) capitalize">Admin</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-black">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    );
  }

  if (role === "ci") {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <CINav displayName={displayName} role={role} />
        <main className="flex-1 overflow-y-auto min-w-0">{children}</main>
      </div>
    );
  }

  // Student layout
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <StudentNav displayName={displayName} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
