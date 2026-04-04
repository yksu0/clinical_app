type Announcement = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  profiles: { full_name: string } | null;
};

export default function AnnouncementsFeed({
  announcements,
}: {
  announcements: Announcement[];
}) {
  if (announcements.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-sm text-white/40">No announcements.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map((a) => (
        <div
          key={a.id}
          className="rounded-xl border border-accent/20 bg-accent/5 p-4 space-y-1.5"
        >
          <p className="text-sm font-semibold text-white">{a.title}</p>
          <p className="text-sm text-white/70 whitespace-pre-wrap">{a.content}</p>
          <p className="text-xs text-white/30">
            {a.profiles?.full_name ?? "Admin"} &middot;{" "}
            {new Date(a.created_at).toLocaleDateString("en-AU", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      ))}
    </div>
  );
}
