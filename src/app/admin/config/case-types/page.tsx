import { createClient } from "@/lib/supabase/server";
import { addCaseType, renameCaseType, toggleCaseType } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";
import type { CaseType } from "@/types";

export default async function CaseTypesPage() {
  const supabase = await createClient();
  const { data: caseTypes } = await supabase
    .from("case_types")
    .select("*")
    .order("name");

  const items = (caseTypes ?? []) as CaseType[];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Case Types</h1>
        <p className="mt-1 text-sm text-(--text-secondary)">
          Define the categories of clinical cases students can be logged for.
        </p>
      </div>

      {/* Add form */}
      <form
        action={addCaseType}
        className="mb-6 flex gap-3 rounded-xl border border-border bg-surface p-4"
      >
        <input
          name="name"
          type="text"
          required
          placeholder="e.g. Surgery, Delivery, ER"
          className="flex-1 rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground placeholder-(--text-muted) outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
        <SubmitButton label="Add" loadingLabel="Adding…" />
      </form>

      {/* List */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-(--text-muted)">
            No case types yet. Add one above.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((ct) => (
              <li key={ct.id} className="flex items-center gap-3 px-4 py-3">
                {/* Rename form */}
                <form action={renameCaseType} className="flex flex-1 gap-2">
                  <input type="hidden" name="id" value={ct.id} />
                  <input
                    name="name"
                    type="text"
                    defaultValue={ct.name}
                    required
                    className={`flex-1 rounded-lg border border-border bg-elevated px-3 py-1.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent ${
                      ct.is_active
                        ? "text-foreground"
                        : "text-(--text-muted) line-through"
                    }`}
                  />
                  <SubmitButton label="Save" variant="ghost" />
                </form>

                {/* Toggle active */}
                <form action={toggleCaseType}>
                  <input type="hidden" name="id" value={ct.id} />
                  <input
                    type="hidden"
                    name="is_active"
                    value={String(ct.is_active)}
                  />
                  <SubmitButton
                    label={ct.is_active ? "Deactivate" : "Restore"}
                    loadingLabel="…"
                    variant={ct.is_active ? "danger" : "ghost"}
                  />
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      {items.length > 0 && (
        <p className="mt-3 text-xs text-(--text-muted)">
          {items.filter((ct) => ct.is_active).length} active ·{" "}
          {items.filter((ct) => !ct.is_active).length} inactive
        </p>
      )}
    </div>
  );
}
