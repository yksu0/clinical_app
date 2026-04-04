"use client";

import { useFormStatus } from "react-dom";

interface SubmitButtonProps {
  label: string;
  loadingLabel?: string;
  variant?: "primary" | "danger" | "ghost";
  className?: string;
}

export default function SubmitButton({
  label,
  loadingLabel,
  variant = "primary",
  className = "",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface";

  const variants = {
    primary:
      "bg-accent text-black hover:bg-accent-hover focus:ring-accent",
    danger:
      "bg-red-500/10 text-red-400 hover:bg-red-500/20 focus:ring-red-500",
    ghost:
      "border border-border text-foreground hover:bg-elevated focus:ring-border",
  };

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {pending ? (loadingLabel ?? "Saving…") : label}
    </button>
  );
}
