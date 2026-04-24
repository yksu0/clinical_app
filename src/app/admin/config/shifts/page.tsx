import { createClient } from "@/lib/supabase/server";
import { addShift, renameShift, toggleShift } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";

type Shift = { id: string; name: string; is_active: boolean };

export default async function ShiftsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("shifts").select("*").order("name");
  const items = (data ?? []) as Shift[];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Shifts</h1>
        <p className="mt-1 text-sm text-(--text-secondary)">
          Define named shifts used when creating assignments (e.g. Day Shift, Night Shift).
        </p>
      </div>

      {/* Add form */}
      <form
        action={addShift}
        className="mb-6 flex gap-3 rounded-xl border border-border bg-surface p-4"
      >
        <input
          name="name"
          type="text"
          required
          placeholder="e.g. Day Shift, Night Shift, Graveyard Shift"
          className="flex-1 rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground placeholder-(--text-muted) outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
        <SubmitButton label="Add" loadingLabel="Adding…" />
      </form>

      {/* List */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-(--text-muted)">
            No shifts yet. Add one above.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((shift) => (
              <li key={shift.id} className="flex items-center gap-3 px-4 py-3">
                <form action={renameShift} className="flex flex-1 gap-2">
                  <input type="hidden" name="id" value={shift.id} />
                  <input
                    name="name"
                    type="text"
                    defaultValue={shift.name}
                    required
                    className={`flex-1 rounded-lg border border-border bg-elevated px-3 py-1.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent ${
                      shift.is_active ? "text-foreground" : "text-(--text-muted) line-through"
                    }`}
                  />
                  <SubmitButton label="Save" variant="ghost" />
                </form>

                <form action={toggleShift}>
                  <input type="hidden" name="id" value={shift.id} />
                  <input type="hidden" name="is_active" value={String(shift.is_active)} />
                  <SubmitButton
                    label={shift.is_active ? "Deactivate" : "Restore"}
                    loadingLabel="…"
                    variant={shift.is_active ? "danger" : "ghost"}
                  />
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      {items.length > 0 && (
        <p className="mt-3 text-xs text-(--text-muted)">
          {items.filter((s) => s.is_active).length} active ·{" "}
          {items.filter((s) => !s.is_active).length} inactive
        </p>
      )}
    </div>
  );
}
