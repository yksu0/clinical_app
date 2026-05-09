"use client";

import { useState, useActionState } from "react";
import { Pencil, X } from "lucide-react";
import { updateStudentProfile } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";

interface Props {
  studentId: string;
  fullName: string;
  section: string | null;
}

type State = { error?: string | null; success?: boolean };
const initial: State = {};

export default function EditProfileForm({ studentId, fullName, section }: Props) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(
    async (_prev: State, fd: FormData) => {
      const res = await updateStudentProfile(fd);
      if (res?.success) setOpen(false);
      return res ?? {};
    },
    initial,
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-(--text-secondary) hover:text-foreground hover:bg-elevated transition-colors"
      >
        <Pencil className="h-3 w-3" />
        Edit
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3 w-full sm:w-80">
      <input type="hidden" name="student_id" value={studentId} />

      <div>
        <label className="mb-1 block text-xs font-medium text-(--text-secondary)">Name</label>
        <input
          name="full_name"
          type="text"
          required
          defaultValue={fullName}
          className="w-full rounded-lg border border-border bg-elevated px-3 py-1.5 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-(--text-secondary)">Section</label>
        <input
          name="section"
          type="text"
          defaultValue={section ?? ""}
          placeholder="e.g. Section A"
          className="w-full rounded-lg border border-border bg-elevated px-3 py-1.5 text-sm text-foreground placeholder:(--text-muted) outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </div>

      {state.error && (
        <p className="text-xs text-red-400">{state.error}</p>
      )}

      <div className="flex gap-2">
        <SubmitButton label="Save" loadingLabel="Saving…" variant="ghost" />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-(--text-secondary) hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" />
          Cancel
        </button>
      </div>
    </form>
  );
}
