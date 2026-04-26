"use client";

import { useFormStatus } from "react-dom";
import { requestPasswordReset } from "@/lib/actions/auth";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Sending…
        </span>
      ) : (
        "Send reset link"
      )}
    </button>
  );
}

export default function ForgotPasswordForm({
  error,
  success,
}: {
  error: string | null;
  success: boolean;
}) {
  if (success) {
    return (
      <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-5 text-center space-y-1">
        <p className="text-sm font-semibold text-green-400">Check your email</p>
        <p className="text-xs text-(--text-secondary)">
          If an account with that address exists, you&apos;ll receive a password reset link shortly.
        </p>
      </div>
    );
  }

  return (
    <form action={requestPasswordReset} className="space-y-5">
      {error === "missing_email" && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-xs text-red-400">Please enter your email address.</p>
        </div>
      )}
      {error === "link_expired" && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <p className="text-xs text-amber-400">Your reset link has expired or already been used. Request a new one below.</p>
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-(--text-secondary) mb-1.5"
        >
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          placeholder="you@example.com"
          className="w-full rounded-lg border border-border bg-elevated px-4 py-2.5 text-sm text-foreground placeholder:text-(--text-muted) outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </div>

      <SubmitBtn />
    </form>
  );
}
