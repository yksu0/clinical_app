import { createClient } from "@/lib/supabase/server";
import AnnouncementForm from "./AnnouncementForm";
import { deleteAnnouncement } from "./actions";

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; toast?: string }>;
}) {
  const { error, toast } = await searchParams;
  const success = toast === "success";
  const supabase = await createClient();
  const { data, error: queryError } = await supabase
    .from("announcements")
    .select("id, title, content, created_at, image_url, profiles(full_name)")
    .order("created_at", { ascending: false });

  if (queryError) console.error("[AnnouncementsPage] query error:", queryError);

  type Announcement = {
    id: string;
    title: string;
    content: string;
    created_at: string;
    image_url: string | null;
    profiles: { full_name: string } | null;
  };

  const announcements = (data ?? []) as unknown as Announcement[];

  return (
    <div className="flex gap-8 p-6 max-w-6xl">
      {/* Left: Post Form */}
      <aside className="w-80 shrink-0">
        <div className="sticky top-6 rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">
            New Announcement
          </h2>
          <AnnouncementForm error={error} success={success} />
        </div>
      </aside>

      {/* Right: Feed */}
      <div className="flex-1 space-y-4">
        <h1 className="text-2xl font-bold text-white">Announcements</h1>
        {queryError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-xs text-red-400 font-mono">DB error: {queryError.message}</p>
          </div>
        )}
        {announcements.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
            <p className="text-sm text-white/40">
              No announcements yet. Post one to notify all students and CIs.
            </p>
          </div>
        ) : (
          announcements.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-2"
            >
              {a.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.image_url} alt={a.title} className="w-full rounded-lg object-cover max-h-48 mb-1" />
              )}
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-semibold text-white">{a.title}</h3>
                <form
                  action={async () => {
                    "use server";
                    await deleteAnnouncement(a.id);
                  }}
                >
                  <button
                    type="submit"
                    className="text-xs text-red-400/60 hover:text-red-400 transition-colors shrink-0"
                  >
                    Delete
                  </button>
                </form>
              </div>
              <p className="text-sm text-white/70 whitespace-pre-wrap">{a.content}</p>
              <p className="text-xs text-white/30">
                {a.profiles?.full_name ?? "Admin"} &middot;{" "}
                {new Date(a.created_at).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
