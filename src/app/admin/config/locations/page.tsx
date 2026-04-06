import { createClient } from "@/lib/supabase/server";
import { addLocation, renameLocation, toggleLocation } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";
import type { Location } from "@/types";

export default async function LocationsPage() {
  const supabase = await createClient();
  const { data: locations } = await supabase
    .from("locations")
    .select("*")
    .order("name");

  const items = (locations ?? []) as Location[];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Locations</h1>
        <p className="mt-1 text-sm text-(--text-secondary)">
          Define the hospital areas and units used in case assignments.
        </p>
      </div>

      {/* Add form */}
      <form
        action={addLocation}
        className="mb-6 flex gap-3 rounded-xl border border-border bg-surface p-4"
      >
        <input
          name="name"
          type="text"
          required
          placeholder="e.g. Ward A, OR, ER, Delivery Room"
          className="flex-1 rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground placeholder-(--text-muted) outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
        <SubmitButton label="Add" loadingLabel="Adding…" />
      </form>

      {/* List */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-(--text-muted)">
            No locations yet. Add one above.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((loc) => (
              <li key={loc.id} className="flex items-center gap-3 px-4 py-3">
                <form action={renameLocation} className="flex flex-1 gap-2">
                  <input type="hidden" name="id" value={loc.id} />
                  <input
                    name="name"
                    type="text"
                    defaultValue={loc.name}
                    required
                    className={`flex-1 rounded-lg border border-border bg-elevated px-3 py-1.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent ${
                      loc.is_active
                        ? "text-foreground"
                        : "text-(--text-muted) line-through"
                    }`}
                  />
                  <SubmitButton label="Save" variant="ghost" />
                </form>

                <form action={toggleLocation}>
                  <input type="hidden" name="id" value={loc.id} />
                  <input
                    type="hidden"
                    name="is_active"
                    value={String(loc.is_active)}
                  />
                  <SubmitButton
                    label={loc.is_active ? "Deactivate" : "Restore"}
                    loadingLabel="…"
                    variant={loc.is_active ? "danger" : "ghost"}
                  />
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      {items.length > 0 && (
        <p className="mt-3 text-xs text-(--text-muted)">
          {items.filter((l) => l.is_active).length} active ·{" "}
          {items.filter((l) => !l.is_active).length} inactive
        </p>
      )}
    </div>
  );
}
