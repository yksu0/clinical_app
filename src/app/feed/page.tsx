import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnnouncementCard, { type Comment } from "@/components/shared/AnnouncementCard";
import { Users, ClipboardList, Megaphone } from "lucide-react";

type Announcement = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  image_url: string | null;
  profiles: { full_name: string } | null;
  announcement_comments: Comment[];
};

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const role = (user.app_metadata?.role as string) ?? "student";

  // Run ALL queries in parallel — no sequential waits
  const [profileRes, announcementsRes, studentsRes, casesRes] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase
      .from("announcements")
      .select(`
        id,
        title,
        content,
        created_at,
        image_url,
        profiles(full_name),
        announcement_comments(
          id,
          content,
          created_at,
          user_id,
          profiles(full_name)
        )
      `)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("case_logs").select("id", { count: "exact", head: true }),
  ]);

  const displayName = profileRes.data?.full_name ?? "there";
  const announcements = (announcementsRes.data ?? []) as unknown as Announcement[];
  const totalStudents = studentsRes.count ?? 0;
  const totalCases = casesRes.count ?? 0;
  const totalAnnouncements = announcements.length;

  return (
    <div className="min-h-full">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-border bg-background">
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle, var(--color-foreground, #fff) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Accent glow top-right */}
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
        {/* Soft glow bottom-left */}
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent/8 blur-2xl pointer-events-none" />

        <div className="relative mx-auto max-w-3xl px-6 py-12 md:py-16">
          {/* Brand chip */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-accent">
              NurseSync
            </span>
          </div>

          {/* Heading — Space Grotesk display font */}
          <h1
            className="text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight mb-4"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            <span className="text-foreground">Clinicals,{" "}</span>
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, var(--color-accent, #38bdf8) 0%, #818cf8 100%)" }}
            >
              simplified.
            </span>
          </h1>

          <p className="text-sm md:text-base text-(--text-secondary) max-w-md leading-relaxed">
            Area assignments, shift schedules, case logs and clinical advisories — synced in one central hub.
          </p>

          {/* Stats row */}
          <div className="mt-8 flex flex-wrap gap-3">
            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface/80 backdrop-blur px-4 py-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15">
                <Users className="h-3.5 w-3.5 text-accent" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground leading-none">{totalStudents}</p>
                <p className="text-[11px] text-(--text-muted) mt-0.5">Students</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface/80 backdrop-blur px-4 py-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15">
                <ClipboardList className="h-3.5 w-3.5 text-accent" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground leading-none">{totalCases}</p>
                <p className="text-[11px] text-(--text-muted) mt-0.5">Cases Logged</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface/80 backdrop-blur px-4 py-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15">
                <Megaphone className="h-3.5 w-3.5 text-accent" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground leading-none">{totalAnnouncements}</p>
                <p className="text-[11px] text-(--text-muted) mt-0.5">Announcements</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feed ── */}
      <section className="mx-auto max-w-2xl px-4 md:px-6 py-8 space-y-6">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Updates &amp; Announcements
          </h2>
        </div>

        {announcements.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-16 text-center">
            <Megaphone className="mx-auto h-8 w-8 text-(--text-muted) mb-3" />
            <p className="text-sm text-(--text-secondary)">No announcements yet.</p>
            {role === "admin" && (
              <p className="text-xs text-(--text-muted) mt-1">
                Post one from the{" "}
                <a href="/admin/announcements" className="text-accent hover:underline">
                  Announcements
                </a>{" "}
                page.
              </p>
            )}
          </div>
        ) : (
          announcements.map((a) => (
            <AnnouncementCard
              key={a.id}
              id={a.id}
              title={a.title}
              content={a.content}
              created_at={a.created_at}
              image_url={a.image_url}
              profiles={a.profiles}
              comments={a.announcement_comments}
              currentUserId={user.id}
              currentUserRole={role}
            />
          ))
        )}
      </section>
    </div>
  );
}
