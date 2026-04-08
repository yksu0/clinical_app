"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { signup, findSimilarNames } from "@/lib/actions/auth";

export default function SignupForm({ errorMsg }: { errorMsg: string | null }) {
  const [fullName, setFullName] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNameChange = useCallback((value: string) => {
    setFullName(value);
    setSuggestions([]);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (value.trim().length < 3) return;

    timerRef.current = setTimeout(() => {
      startTransition(async () => {
        const results = await findSimilarNames(value);
        setSuggestions(results);
      });
    }, 600);
  }, []);

  const applySuggestion = (name: string) => {
    setFullName(name);
    setSuggestions([]);
  };

  return (
    <>
      {errorMsg && (
        <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-xs text-red-400">{errorMsg}</p>
        </div>
      )}

      <form action={signup} className="space-y-5">
        <div>
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-(--text-secondary) mb-1.5"
          >
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            autoComplete="name"
            placeholder="As listed in the student roster"
            value={fullName}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-elevated px-4 py-2.5 text-sm text-foreground placeholder-(--text-muted) outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          />
          {suggestions.length > 0 && (
            <div className="mt-2 rounded-lg border border-accent/30 bg-elevated px-3 py-2.5">
              <p className="text-xs text-(--text-muted) mb-1.5">Did you mean:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => applySuggestion(name)}
                    className="rounded-md border border-accent/40 px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/10 transition-colors"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

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
            placeholder="you@example.com"
            className="w-full rounded-lg border border-border bg-elevated px-4 py-2.5 text-sm text-foreground placeholder-(--text-muted) outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-(--text-secondary) mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              minLength={8}
              className="w-full rounded-lg border border-border bg-elevated px-4 py-2.5 pr-10 text-sm text-foreground placeholder-(--text-muted) outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-3 flex items-center text-(--text-muted) hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-accent-muted bg-accent-muted px-4 py-3">
          <p className="text-xs text-accent leading-relaxed">
            After signing up, an admin must verify your account before you can log in.
          </p>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface"
        >
          Create account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-(--text-muted)">
        Already have an account?{" "}
        <a
          href="/login"
          className="font-medium text-accent hover:text-accent-hover transition-colors"
        >
          Sign in
        </a>
      </p>
    </>
  );
}
