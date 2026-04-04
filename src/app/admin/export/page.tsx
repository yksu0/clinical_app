import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminExportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const role = (user.app_metadata?.role as string) ?? "student";
  if (role !== "admin") redirect("/");

  return (
    <div className="max-w-2xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Data Export</h1>
        <p className="text-sm text-white/50 mt-1">
          Download student data as CSV files.
        </p>
      </div>

      <div className="space-y-4">
        <ExportCard
          title="Case Records"
          description="All logged cases with student name, case type, location, date, and notes."
          href="/api/export/cases"
          filename={`case-records-${new Date().toISOString().slice(0, 10)}.csv`}
        />
        <ExportCard
          title="Progress Report"
          description="Each student's completion percentage and case counts per case type vs requirements."
          href="/api/export/progress"
          filename={`progress-report-${new Date().toISOString().slice(0, 10)}.csv`}
        />
      </div>
    </div>
  );
}

function ExportCard({
  title,
  description,
  href,
  filename,
}: {
  title: string;
  description: string;
  href: string;
  filename: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-5 gap-4">
      <div>
        <p className="font-semibold text-white">{title}</p>
        <p className="text-sm text-white/50 mt-0.5">{description}</p>
      </div>
      <a
        href={href}
        download={filename}
        className="shrink-0 rounded-lg bg-accent/20 px-4 py-2 text-sm font-semibold text-accent hover:bg-accent/30 transition-colors"
      >
        Download CSV
      </a>
    </div>
  );
}
