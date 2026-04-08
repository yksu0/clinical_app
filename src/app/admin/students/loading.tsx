export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6 animate-pulse">
      <div className="h-8 w-40 rounded bg-elevated" />
      <div className="h-4 w-24 rounded bg-elevated" />
      <div className="h-10 rounded-lg bg-elevated" />
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_60px_90px] gap-2 px-4 py-4 border-b border-border last:border-b-0"
          >
            <div className="space-y-1.5">
              <div className="h-4 w-36 rounded bg-elevated" />
              <div className="h-3 w-48 rounded bg-elevated" />
            </div>
            <div className="h-4 w-8 rounded bg-elevated mx-auto" />
            <div className="h-4 w-10 rounded bg-elevated ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
