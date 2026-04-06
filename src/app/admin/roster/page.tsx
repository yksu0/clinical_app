import { createClient } from "@/lib/supabase/server";
import {
  addToRoster,
  verifyStudent,
  toggleStudentActive,
  removeFromRoster,
} from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";

export default async function RosterPage() {
  const supabase = await createClient();

  const [{ data: roster }, { data: students }] = await Promise.all([
    // Whitelist entries
    supabase.from("student_roster").select("*").order("full_name"),
    // Signed-up student profiles (not admin/ci)
    supabase
      .from("profiles")
      .select("id, full_name, email, section, is_verified, is_active, created_at")
      .eq("role", "student")
      .order("full_name"),
  ]);

  const rosterItems = roster ?? [];
  const studentProfiles = students ?? [];
  const pendingApproval = studentProfiles.filter((s) => !s.is_verified);
  const activeStudents = studentProfiles.filter((s) => s.is_verified);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-foreground">Student Roster</h1>
        <p className="mt-1 text-sm text-(--text-secondary)">
          Pre-register students so they can sign up. Approve accounts after sign-up.
        </p>
      </div>

      {/* ── Pending Approval ── */}
      {pendingApproval.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-accent uppercase tracking-wider">
            Pending Approval ({pendingApproval.length})
          </h2>
          <div className="rounded-xl border border-accent/30 bg-surface overflow-hidden">
            <ul className="divide-y divide-border">
              {pendingApproval.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {s.full_name}
                    </p>
                    <p className="text-xs text-(--text-muted)">
                      {s.email}
                      {s.section ? ` · ${s.section}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <form action={verifyStudent}>
                      <input type="hidden" name="id" value={s.id} />
                      <SubmitButton label="Approve" loadingLabel="…" />
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Active / Verified Students ── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-(--text-secondary) uppercase tracking-wider">
          Students ({activeStudents.length})
        </h2>
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          {activeStudents.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-(--text-muted)">
              No verified students yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {activeStudents.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        s.is_active ? "text-foreground" : "text-(--text-muted) line-through"
                      }`}
                    >
                      {s.full_name}
                    </p>
                    <p className="text-xs text-(--text-muted)">
                      {s.email}
                      {s.section ? ` · Section ${s.section}` : ""}
                    </p>
                  </div>
                  <form action={toggleStudentActive}>
                    <input type="hidden" name="id" value={s.id} />
                    <input
                      type="hidden"
                      name="is_active"
                      value={String(s.is_active)}
                    />
                    <SubmitButton
                      label={s.is_active ? "Deactivate" : "Restore"}
                      loadingLabel="…"
                      variant={s.is_active ? "danger" : "ghost"}
                    />
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── Pre-Registration Whitelist ── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-(--text-secondary) uppercase tracking-wider">
          Pre-Registration Whitelist ({rosterItems.length})
        </h2>

        {/* Add form */}
        <form
          action={addToRoster}
          className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-3"
        >
          <input
            name="full_name"
            type="text"
            required
            placeholder="Full name *"
            className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground placeholder-(--text-muted) outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
          <input
            name="email"
            type="email"
            placeholder="Email (optional)"
            className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground placeholder-(--text-muted) outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
          <div className="flex gap-2">
            <input
              name="section"
              type="text"
              placeholder="Section (optional)"
              className="flex-1 rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground placeholder-(--text-muted) outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
            <SubmitButton label="Add" loadingLabel="…" />
          </div>
        </form>

        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          {rosterItems.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-(--text-muted)">
              No students in whitelist. Add names above so they can sign up.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {rosterItems.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {r.full_name}
                    </p>
                    <p className="text-xs text-(--text-muted)">
                      {r.email ?? "No email"}
                      {r.section ? ` · ${r.section}` : ""}
                    </p>
                  </div>
                  <form action={removeFromRoster}>
                    <input type="hidden" name="id" value={r.id} />
                    <SubmitButton
                      label="Remove"
                      loadingLabel="…"
                      variant="danger"
                    />
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
