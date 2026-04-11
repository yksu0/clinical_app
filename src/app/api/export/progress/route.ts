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

  const [profilesRes, caseTypesRes, requirementsRes, caseLogsRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, section")
        .eq("role", "student")
        .eq("is_active", true)
        .eq("is_verified", true),
      supabase.from("case_types").select("id, name").eq("is_active", true),
      supabase.from("requirements").select("case_type_id, required_count"),
      supabase.from("case_logs").select("student_id, case_type_id"),
    ]);

  if (profilesRes.error || caseTypesRes.error) {
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  const profiles = profilesRes.data ?? [];
  const caseTypes = caseTypesRes.data ?? [];
  const requirements = requirementsRes.data ?? [];
  const allLogs = caseLogsRes.data ?? [];

  // Requirement map
  const reqMap: Record<string, number> = {};
  for (const r of requirements) {
    reqMap[r.case_type_id] = (reqMap[r.case_type_id] ?? 0) + r.required_count;
  }
  const totalRequired = Object.values(reqMap).reduce((s, n) => s + n, 0);

  // Completed by student+type
  const completedMap: Record<string, Record<string, number>> = {};
  for (const log of allLogs) {
    const s = (completedMap[log.student_id] ??= {});
    s[log.case_type_id] = (s[log.case_type_id] ?? 0) + 1;
  }

  // Header: Name, Email, Section, Total Cases, Overall %, then one col per case type
  const typeHeaders = caseTypes.map((ct) => ct.name);
  const typeReqHeaders = caseTypes.map((ct) => `${ct.name} (Required)`);

  // Interleave done/required per type
  const perTypeCols: string[] = [];
  for (const ct of caseTypes) {
    perTypeCols.push(ct.name);
    perTypeCols.push(`${ct.name} Required`);
  }

  const header = buildRow([
    "Student Name",
    "Email",
    "Section",
    "Total Cases",
    "Total Required",
    "Completion %",
    ...perTypeCols,
  ]);

  // Suppress unused variable warning
  void typeHeaders;
  void typeReqHeaders;

  const body = profiles
    .map((p) => {
      const byType = completedMap[p.id] ?? {};
      const total = allLogs.filter((l) => l.student_id === p.id).length;
      const completedReq = Object.entries(reqMap).reduce(
        (sum, [ctId, req]) => sum + Math.min(byType[ctId] ?? 0, req),
        0
      );
      const pct =
        totalRequired > 0
          ? Math.round((completedReq / totalRequired) * 100)
          : 0;

      const perTypeValues: (number | string)[] = [];
      for (const ct of caseTypes) {
        perTypeValues.push(byType[ct.id] ?? 0);
        perTypeValues.push(reqMap[ct.id] ?? 0);
      }

      return buildRow([
        p.full_name,
        p.email,
        p.section,
        total,
        totalRequired,
        `${pct}%`,
        ...perTypeValues,
      ]);
    })
    .join("\n");

  const csv = `${header}\n${body}`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="progress-report-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
