import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";

type Student = {
  id: string;
  full_name: string;
  section: string | null;
};

export default async function StudentDirectoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, section")
    .eq("role", "student")
    .eq("is_active", true)
    .eq("is_verified", true)
    .order("full_name");

  const students: Student[] = data ?? [];

  // Group by first letter of full_name for alphabetical sections
  const groups = new Map<string, Student[]>();
  for (const s of students) {
    const letter = s.full_name.charAt(0).toUpperCase();
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter)!.push(s);
  }

  const sortedLetters = Array.from(groups.keys()).sort();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Student Directory</h1>
        <p className="text-sm text-white/50 mt-1">
          {students.length} enrolled student{students.length !== 1 ? "s" : ""}
        </p>
      </div>

      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-16 text-center">
          <Users className="h-8 w-8 text-white/20 mb-3" />
          <p className="text-sm font-medium text-white">No students enrolled yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedLetters.map((letter) => (
            <section key={letter} className="space-y-1">
              <h2 className="text-xs font-bold uppercase tracking-widest text-white/30 px-1 pb-1 border-b border-white/5">
                {letter}
              </h2>
              <div className="divide-y divide-white/5 rounded-xl border border-white/10 overflow-hidden">
                {groups.get(letter)!.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/[0.08] transition-colors"
                  >
                    <span className="text-sm font-medium text-white">
                      {s.full_name}
                    </span>
                    {s.section && (
                      <span className="text-xs text-white/40 shrink-0 ml-4">
                        {s.section}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
