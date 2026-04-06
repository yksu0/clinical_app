import { createClient } from "@/lib/supabase/server";
import { setRequirement } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";

export default async function RequirementsPage() {
  const supabase = await createClient();

  const [{ data: caseTypes }, { data: requirements }] = await Promise.all([
    supabase
      .from("case_types")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
    supabase.from("requirements").select("case_type_id, required_count"),
  ]);

  // Build a quick lookup: case_type_id → required_count
  const reqMap = new Map(
    (requirements ?? []).map((r) => [r.case_type_id, r.required_count])
  );

  const items = caseTypes ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Requirements</h1>
        <p className="mt-1 text-sm text-(--text-secondary)">
          Set the minimum number of cases each student must complete per type.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface px-5 py-10 text-center">
          <p className="text-sm text-(--text-muted)">
            No active case types found.{" "}
            <a
              href="/admin/config/case-types"
              className="text-accent hover:text-accent-hover"
            >
              Add case types first.
            </a>
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <ul className="divide-y divide-border">
            {items.map((ct) => {
              const current = reqMap.get(ct.id) ?? "";
              return (
                <li
                  key={ct.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <span className="text-sm font-medium text-foreground">
                    {ct.name}
                  </span>
                  <form action={setRequirement} className="flex items-center gap-2">
                    <input type="hidden" name="case_type_id" value={ct.id} />
                    <input
                      name="required_count"
                      type="number"
                      min={1}
                      max={99}
                      defaultValue={current}
                      required
                      placeholder="0"
                      className="w-20 rounded-lg border border-border bg-elevated px-3 py-1.5 text-sm text-foreground text-center outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                    />
                    <SubmitButton label="Set" loadingLabel="…" variant="ghost" />
                  </form>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
