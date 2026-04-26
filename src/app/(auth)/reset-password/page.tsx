import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ResetPasswordForm from "./ResetPasswordForm";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If no session (e.g. link expired or already used), send back to forgot-password
  if (!user) {
    redirect("/forgot-password?error=link_expired");
  }

  const { error } = await searchParams;

  return (
    <div className="rounded-xl border border-border bg-surface p-8 shadow-2xl">
      {/* Brand */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
          <svg
            className="h-7 w-7 text-black"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Set new password</h1>
        <p className="mt-1 text-sm text-(--text-secondary)">
          Choose a strong password for{" "}
          <span className="text-foreground">{user.email}</span>
        </p>
      </div>

      <ResetPasswordForm error={error ?? null} />

      <p className="mt-6 text-center text-sm text-(--text-muted)">
        <Link
          href="/login"
          className="font-medium text-accent hover:text-accent-hover transition-colors"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
