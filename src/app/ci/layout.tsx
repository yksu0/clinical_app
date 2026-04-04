import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CINav from "@/components/ci/CINav";

export default async function CILayout({
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
  if (role !== "ci" && role !== "admin") redirect("/student");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const displayName = profile?.full_name ?? user.email ?? "Instructor";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <CINav displayName={displayName} role={role} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
