"use client";

import { useActionState } from "react";
import { createAnnouncement } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";

type State = { error: string | null; success: boolean };

const INITIAL: State = { error: null, success: false };

export default function AnnouncementForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const [state, formAction] = useActionState(createAnnouncement, INITIAL);

  if (state.success && onSuccess) onSuccess();

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-white/60 mb-1.5">
          Title
        </label>
        <input
          name="title"
          required
          placeholder="Announcement title"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-white/60 mb-1.5">
          Content
        </label>
        <textarea
          name="content"
          required
          rows={4}
          placeholder="Write your announcement here…"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-accent focus:outline-none resize-none"
        />
      </div>

      {state.error && (
        <p className="text-xs text-red-400">{state.error}</p>
      )}
      {state.success && (
        <p className="text-xs text-green-400">Announcement posted.</p>
      )}

      <SubmitButton label="Post Announcement" loadingLabel="Posting…" />
    </form>
  );
}
