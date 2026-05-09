"use client";

import { useActionState, useState } from "react";
import {
  createClinicalInstructor,
  updateClinicalInstructor,
  deleteClinicalInstructor,
  toggleClinicalInstructor,
  resendCICredentials,
} from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";

export type ClinicalInstructor = {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
};

type ActionState = { error?: string | null; success?: boolean; link?: string };
const init: ActionState = {};

function CreateForm() {
  const [state, action, pending] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      const result = await createClinicalInstructor(formData);
      return result ?? {};
    },
    init,
  );

  return (
    <form
      action={action}
      className="mb-6 rounded-xl border border-border bg-surface p-4 space-y-3"
    >
      <div>
        <h2 className="text-sm font-semibold text-foreground">Add Clinical Instructor</h2>
        <p className="mt-0.5 text-xs text-(--text-muted)">
          An invitation email with login instructions will be sent to the instructor automatically.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          name="full_name"
          type="text"
          required
          disabled={pending}
          placeholder="Full name"
          className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground placeholder-(--text-muted) outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50"
        />
        <input
          name="email"
          type="email"
          required
          disabled={pending}
          placeholder="Email address"
          className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground placeholder-(--text-muted) outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50"
        />
      </div>
      {state.error && (
        <p className="text-xs text-(--status-rejected)">{state.error}</p>
      )}
      {state.success && (
        <p className="text-xs text-(--status-processed)">
          Invitation sent — the instructor will receive a login link by email.
        </p>
      )}
      <SubmitButton label="Create & Send Invite" loadingLabel="Sending invite…" />
    </form>
  );
}

function CIRow({ ci }: { ci: ClinicalInstructor }) {
  const [editing, setEditing] = useState(false);
  const [loginLink, setLoginLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [editState, editAction] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      const result = await updateClinicalInstructor(formData);
      if (!result?.error) setEditing(false);
      return result ?? {};
    },
    init,
  );

  const [deleteState, deleteAction] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> =>
      (await deleteClinicalInstructor(formData)) ?? {},
    init,
  );

  const [resendState, resendAction] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      const result = await resendCICredentials(formData);
      if (result?.link) {
        setLoginLink(result.link);
        setCopied(false);
      }
      return result ?? {};
    },
    init,
  );

  function copyLink() {
    if (!loginLink) return;
    navigator.clipboard.writeText(loginLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <li className="px-4 py-3 space-y-2">
      {editing ? (
        <form action={editAction} className="space-y-2">
          <input type="hidden" name="id" value={ci.id} />
          <div className="flex gap-2">
            <input
              name="full_name"
              type="text"
              required
              defaultValue={ci.full_name}
              className="flex-1 rounded-lg border border-border bg-elevated px-3 py-1.5 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
            <SubmitButton label="Save" loadingLabel="Saving…" variant="ghost" />
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-(--text-muted) hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
          {editState.error && (
            <p className="text-xs text-(--status-rejected)">{editState.error}</p>
          )}
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-medium ${
                ci.is_active ? "text-foreground" : "text-(--text-muted) line-through"
              }`}
            >
              {ci.full_name}
            </p>
            <p className="text-xs text-(--text-muted)">{ci.email}</p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-(--text-secondary) hover:text-foreground transition-colors"
            >
              Edit
            </button>

            <form action={toggleClinicalInstructor}>
              <input type="hidden" name="id" value={ci.id} />
              <input type="hidden" name="is_active" value={String(ci.is_active)} />
              <SubmitButton
                label={ci.is_active ? "Deactivate" : "Restore"}
                loadingLabel="…"
                variant={ci.is_active ? "danger" : "ghost"}
              />
            </form>

            <form action={resendAction}>
              <input type="hidden" name="email" value={ci.email} />
              <SubmitButton label="Resend Login" loadingLabel="Generating…" variant="ghost" />
            </form>

            <form action={deleteAction}>
              <input type="hidden" name="id" value={ci.id} />
              <SubmitButton label="Remove" loadingLabel="Removing…" variant="danger" />
            </form>
          </div>
        </div>
      )}

      {/* Generated login link */}
      {loginLink && (
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 space-y-1.5">
          <p className="text-xs font-semibold text-accent">
            Login link generated — share this with the instructor:
          </p>
          <p className="break-all rounded bg-elevated px-2 py-1.5 font-mono text-[11px] text-foreground">
            {loginLink}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={copyLink}
              className="text-xs font-medium text-accent hover:underline"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
            <button
              type="button"
              onClick={() => setLoginLink(null)}
              className="text-xs text-(--text-muted) hover:text-foreground transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {resendState.error && (
        <p className="text-xs text-(--status-rejected)">{resendState.error}</p>
      )}
      {deleteState.error && (
        <p className="text-xs text-(--status-rejected)">{deleteState.error}</p>
      )}
    </li>
  );
}

export default function ClinicalInstructorsClient({
  items,
}: {
  items: ClinicalInstructor[];
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Clinical Instructors</h1>
        <p className="mt-1 text-sm text-(--text-secondary)">
          Create instructor accounts here. Instructors do not need to sign up — an invitation
          email with login instructions is sent automatically when you add them.
        </p>
      </div>

      <CreateForm />

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-(--text-muted)">
            No clinical instructors yet. Add one above.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((ci) => (
              <CIRow key={ci.id} ci={ci} />
            ))}
          </ul>
        )}
      </div>

      {items.length > 0 && (
        <p className="mt-3 text-xs text-(--text-muted)">
          {items.filter((ci) => ci.is_active).length} active ·{" "}
          {items.filter((ci) => !ci.is_active).length} inactive
        </p>
      )}
    </div>
  );
}
