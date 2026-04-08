"use client";

import { useState, useTransition } from "react";
import { requestCancelAssignment } from "./actions";

export default function CancelRequestForm({ assignmentId }: { assignmentId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await requestCancelAssignment(formData);
      if (result.success) {
        setMessage({ type: "success", text: "Cancellation requested." });
        setOpen(false);
      } else {
        setMessage({ type: "error", text: result.error ?? "Failed." });
      }
    });
  };

  if (message?.type === "success") {
    return <p className="text-xs text-amber-400">Cancel requested</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-red-400/70 hover:text-red-400 transition-colors"
      >
        Request Cancel
      </button>
    );
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-1.5 mt-1">
      <input type="hidden" name="assignment_id" value={assignmentId} />
      <textarea
        name="reason"
        required
        rows={2}
        placeholder="Reason for cancellation…"
        className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white placeholder-white/30 focus:border-accent focus:outline-none resize-none"
      />
      {message?.type === "error" && (
        <p className="text-[10px] text-red-400">{message.text}</p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
        >
          {isPending ? "…" : "Submit Request"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setMessage(null); }}
          className="text-xs text-white/40 hover:text-white/60 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
