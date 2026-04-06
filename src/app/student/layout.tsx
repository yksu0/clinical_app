import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StudentNav from "@/components/student/StudentNav";

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
    .select("full_name, is_verified")
    .eq("id", user.id)
    .single();

  // Block unverified students — admin must approve their account first
  if (!profile?.is_verified) redirect("/pending");

  const displayName = profile?.full_name ?? user.email ?? "Student";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <StudentNav displayName={displayName} />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
    </div>
  );
}
