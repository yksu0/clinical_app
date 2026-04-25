export default async function AdminExportPage() {

  return (
    <div className="max-w-4xl p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Data Export</h1>
        <p className="text-sm text-(--text-secondary) mt-1">
          Download student data as CSV files.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ExportCard
          title="Case Records"
          description="All logged cases with student name, case type, area of duty, date, and notes."
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
    <div className="rounded-xl border border-border bg-surface p-6 flex flex-col gap-4">
      <div>
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="text-sm text-(--text-secondary) mt-1">{description}</p>
      </div>
      <a
        href={href}
        download={filename}
        className="self-start rounded-lg bg-accent/20 px-5 py-2.5 text-sm font-semibold text-accent hover:bg-accent/30 transition-colors"
      >
        Download CSV
      </a>
    </div>
  );
}
