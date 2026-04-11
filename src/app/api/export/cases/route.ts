import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildRow(values: (string | number | null | undefined)[]): string {
  return values.map(escapeCsv).join(",");
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (user.app_metadata?.role as string) ?? "student";
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: logs, error } = await supabase
    .from("case_logs")
    .select(
      "id, date, notes, profiles(full_name, email, section), case_types(name), locations(name), created_at"
    )
    .order("date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type LogRow = {
    id: string;
    date: string;
    notes: string | null;
    created_at: string;
    profiles: { full_name: string; email: string; section: string | null } | null;
    case_types: { name: string } | null;
    locations: { name: string } | null;
  };

  const rows = (logs ?? []) as unknown as LogRow[];

  const header = buildRow([
    "ID",
    "Student Name",
    "Student Email",
    "Section",
    "Case Type",
    "Location",
    "Date",
    "Notes",
    "Logged At",
  ]);

  const body = rows
    .map((r) =>
      buildRow([
        r.id,
        r.profiles?.full_name,
        r.profiles?.email,
        r.profiles?.section,
        r.case_types?.name,
        r.locations?.name,
        r.date,
        r.notes,
        r.created_at,
      ])
    )
    .join("\n");

  const csv = `${header}\n${body}`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="case-records-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
