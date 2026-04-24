"use client";

import { useActionState } from "react";
import { updateStorageThreshold } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";

type ActionState = { error: string | null; success: boolean };
const initialState: ActionState = { error: null, success: false };

export default function ThresholdForm({
  currentGb,
}: {
  currentGb: number;
}) {
  const [state, formAction] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      const result = await updateStorageThreshold(formData);
      if (result.error) return { error: result.error, success: false };
      return { error: null, success: true };
    },
    initialState
  );

  return (
    <form action={formAction} className="flex items-end gap-3">
      <div className="flex-1">
        <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
          Warn when tracked storage exceeds (GB)
        </label>
        <input
          type="number"
          name="threshold_gb"
          required
          min={1}
          max={1000}
          step={0.5}
          defaultValue={currentGb}
          className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <SubmitButton label="Update" variant="ghost" />
      {state.success && (
        <span className="text-xs text-green-400 pb-2">Saved</span>
      )}
      {state.error && (
        <span className="text-xs text-red-400 pb-2">{state.error}</span>
      )}
    </form>
  );
}
