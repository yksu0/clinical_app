"use client";

import { useState, useActionState } from "react";
import { createRotation, updateRotation, deleteRotation } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";

type Rotation = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  inclusive_days: number[];
};

const DAYS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function DayCheckboxes({ name, defaultChecked }: { name: string; defaultChecked?: number[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {DAYS.map((d) => (
        <label
          key={d.value}
          className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-elevated px-2.5 py-1 text-xs font-medium text-foreground has-[:checked]:border-accent has-[:checked]:bg-accent/10 has-[:checked]:text-accent"
        >
          <input
            type="checkbox"
            name={name}
            value={String(d.value)}
            defaultChecked={defaultChecked?.includes(d.value)}
            className="sr-only"
          />
          {d.label}
        </label>
      ))}
    </div>
  );
}

type ActionState = { error?: string | null; success?: boolean };
const initialState: ActionState = {};

function CreateForm() {
  const [state, action] = useActionState(
    async (_prev: ActionState, fd: FormData) => {
      const res = await createRotation(fd);
      return res ?? {};
    },
    initialState,
  );

  return (
    <form
      action={action}
      className="rounded-xl border border-border bg-surface p-5 space-y-4"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wider text-(--text-secondary)">
        New Rotation
      </h2>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
          Name <span className="text-(--status-rejected)">*</span>
        </label>
        <input
          name="name"
          type="text"
          required
          placeholder="e.g. Rotation 1, Q1 2025"
          className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground placeholder-(--text-muted) outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
            Start Date <span className="text-(--status-rejected)">*</span>
          </label>
          <input
            name="start_date"
            type="date"
            required
            className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
            End Date <span className="text-(--status-rejected)">*</span>
          </label>
          <input
            name="end_date"
            type="date"
            required
            className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-(--text-secondary)">
          Duty Days (days of the week when assignments may be created)
        </label>
        <DayCheckboxes name="inclusive_days" />
        <p className="mt-1.5 text-[11px] text-(--text-muted)">
          Leave all unchecked to allow any day.
        </p>
      </div>

      {state.error && (
        <p className="text-sm text-(--status-rejected)">{state.error}</p>
      )}

      <SubmitButton label="Create Rotation" loadingLabel="Creating…" />
    </form>
  );
}

function EditForm({ rotation, onDone }: { rotation: Rotation; onDone: () => void }) {
  const [updateState, updateAction] = useActionState(
    async (_prev: ActionState, fd: FormData) => {
      const res = await updateRotation(fd);
      if (res?.success) onDone();
      return res ?? {};
    },
    initialState,
  );
  const [deleteState, deleteAction] = useActionState(
    async (_prev: ActionState, fd: FormData) => {
      const res = await deleteRotation(fd);
      if (res?.success) onDone();
      return res ?? {};
    },
    initialState,
  );

  return (
    <div className="space-y-4 py-3">
      {/* Update form */}
      <form action={updateAction} className="space-y-4">
        <input type="hidden" name="id" value={rotation.id} />

        <div>
          <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">Name</label>
          <input
            name="name"
            type="text"
            required
            defaultValue={rotation.name}
            className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">Start Date</label>
            <input
              name="start_date"
              type="date"
              required
              defaultValue={rotation.start_date}
              className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">End Date</label>
            <input
              name="end_date"
              type="date"
              required
              defaultValue={rotation.end_date}
              className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-(--text-secondary)">Duty Days</label>
          <DayCheckboxes name="inclusive_days" defaultChecked={rotation.inclusive_days} />
        </div>

        {updateState.error && <p className="text-sm text-(--status-rejected)">{updateState.error}</p>}

        <div className="flex gap-2">
          <SubmitButton label="Save" loadingLabel="Saving…" />
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-(--text-secondary) hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Delete form — separate to avoid nested forms */}
      <form action={deleteAction}>
        <input type="hidden" name="id" value={rotation.id} />
        {deleteState.error && <p className="mb-1 text-sm text-(--status-rejected)">{deleteState.error}</p>}
        <SubmitButton label="Delete Rotation" loadingLabel="Deleting…" variant="danger" />
      </form>
    </div>
  );
}

function RotationRow({ rotation }: { rotation: Rotation }) {
  const [editing, setEditing] = useState(false);

  const dayLabels =
    rotation.inclusive_days.length === 0
      ? "Any day"
      : rotation.inclusive_days
          .slice()
          .sort((a, b) => a - b)
          .map((d) => DAYS.find((x) => x.value === d)?.label ?? "")
          .join(", ");

  if (editing) {
    return (
      <li className="px-4">
        <EditForm rotation={rotation} onDone={() => setEditing(false)} />
      </li>
    );
  }

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{rotation.name}</p>
        <p className="text-xs text-(--text-muted) mt-0.5">
          {formatDate(rotation.start_date)} – {formatDate(rotation.end_date)}
        </p>
        <p className="text-xs text-(--text-muted) mt-0.5">Duty days: {dayLabels}</p>
      </div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="shrink-0 rounded-md border border-border px-2.5 py-1 text-xs text-(--text-secondary) hover:text-foreground hover:bg-elevated transition-colors"
      >
        Edit
      </button>
    </li>
  );
}

export default function RotationsClient({ rotations }: { rotations: Rotation[] }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Rotations</h1>
        <p className="mt-1 text-sm text-(--text-secondary)">
          Named scheduling periods that group assignments and case logs. Assign a rotation when
          creating assignments to enable rotation-based filtering.
        </p>
      </div>

      <CreateForm />

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {rotations.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-(--text-muted)">
            No rotations yet. Create one above.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {rotations.map((r) => (
              <RotationRow key={r.id} rotation={r} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
