"use client";

import { deleteStudentAccount } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";
import { useRef } from "react";

export default function DeleteAccountButton({
  id,
  fullName,
}: {
  id: string;
  fullName: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={deleteStudentAccount}
      className="shrink-0"
      onSubmit={(e) => {
        if (
          !confirm(
            `Permanently delete ${fullName}'s account?\n\nTheir case history will be kept but their email will be freed for re-use. This cannot be undone.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <SubmitButton label="Delete" loadingLabel="Deleting…" variant="danger" />
    </form>
  );
}
