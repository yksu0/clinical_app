import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import LogCaseForm from "./LogCaseForm";
import BatchUploadActions from "./BatchUploadActions";
import UploadPreviewModal from "./UploadPreviewModal";
import StudentSelector from "./StudentSelector";
import { rejectUpload } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";

const STATUS_ICON = {
  pending: <Clock className="h-3.5 w-3.5 text-(--status-pending)" />,
  processed: <CheckCircle className="h-3.5 w-3.5 text-(--status-processed)" />,
  rejected: <XCircle className="h-3.5 w-3.5 text-(--status-rejected)" />,
};

export default async function LoggingPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const { student: selectedStudentId } = await searchParams;

  const supabase = await createClient();

  const [
    { data: students },
    { data: caseTypes },
    { data: areasOfDuty },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, section")
      .eq("role", "student")
      .eq("is_active", true)
      .order("full_name"),
    supabase
      .from("case_types")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("areas_of_duty")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
  ]);

  const studentList = students ?? [];
  const selectedStudent = selectedStudentId
    ? studentList.find((s) => s.id === selectedStudentId)
    : null;

  const { data: uploads } = selectedStudentId
    ? await supabase
        .from("uploads")
        .select("id, file_name, status, uploaded_at")
        .eq("student_id", selectedStudentId)
        .order("uploaded_at", { ascending: false })
    : { data: null };

  const pendingUploads = (uploads ?? []).filter((u) => u.status === "pending");
  const allUploads = uploads ?? [];

  return (
    <div className="flex flex-col gap-4 md:flex-row md:gap-6 md:h-full">
      {/* Mobile: dropdown student selector */}
      <div className="md:hidden">
        <StudentSelector
          students={studentList}
          selectedId={selectedStudentId ?? null}
        />
      </div>

      {/* Desktop: sidebar student list */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col gap-2 overflow-y-auto">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-(--text-secondary)">
          Students
        </h2>
        {studentList.length === 0 ? (
          <p className="text-xs text-(--text-muted)">No active students.</p>
        ) : (
          studentList.map((s) => (
            <a
              key={s.id}
              href={`/admin/logging?student=${s.id}`}
              className={`rounded-lg px-3 py-2.5 text-sm transition-colors ${
                s.id === selectedStudentId
                  ? "bg-accent text-black font-semibold"
                  : "bg-surface text-foreground hover:bg-elevated"
              }`}
            >
              <p className="font-medium truncate">{s.full_name}</p>
              {s.section && (
                <p className={`text-xs truncate ${s.id === selectedStudentId ? "text-black/70" : "text-(--text-muted)"}`}>
                  {s.section}
                </p>
              )}
            </a>
          ))
        )}
      </aside>

      {/* Detail panel */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {!selectedStudent ? (
          <div className="flex h-48 md:h-64 items-center justify-center rounded-xl border border-dashed border-border">
            <p className="text-sm text-(--text-muted)">
              Select a student to begin logging
            </p>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            <div>
              <h1 className="text-lg md:text-xl font-bold text-foreground">
                {selectedStudent.full_name}
              </h1>
              {selectedStudent.section && (
                <p className="text-sm text-(--text-secondary)">
                  Section {selectedStudent.section}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
              {/* Uploads panel */}
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-(--text-secondary)">
                  Uploaded Proofs
                </h2>

                {/* Batch actions for pending uploads */}
                <BatchUploadActions uploads={allUploads} />

                {allUploads.length === 0 ? (
                  <div className="flex items-center justify-center rounded-xl border border-dashed border-border py-8 md:py-12 mt-2">
                    <p className="text-xs text-(--text-muted)">No uploads yet</p>
                  </div>
                ) : (
                  <ul className="space-y-2 mt-2">
                    {allUploads.filter((u) => u.status !== "pending").map((u) => (
                      <li
                        key={u.id}
                        className="flex items-center justify-between gap-2 sm:gap-3 rounded-xl border border-border bg-surface px-3 sm:px-4 py-2.5 sm:py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {u.file_name}
                          </p>
                          <p className="text-xs text-(--text-muted)">
                            {format(new Date(u.uploaded_at), "MMM d, yyyy · h:mm a")}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                          <UploadPreviewModal uploadId={u.id} fileName={u.file_name} />
                          <span className="flex items-center gap-1 text-xs capitalize text-(--text-secondary)">
                            {STATUS_ICON[u.status as keyof typeof STATUS_ICON]}
                            <span className="hidden sm:inline">{u.status}</span>
                          </span>
                          {u.status === "pending" && (
                            <form action={rejectUpload}>
                              <input type="hidden" name="upload_id" value={u.id} />
                              <SubmitButton variant="danger" label="Reject" />
                            </form>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Log form */}
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-(--text-secondary)">
                  Log a Case
                </h2>
                <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
                  <LogCaseForm
                    studentId={selectedStudentId!}
                    caseTypes={caseTypes ?? []}
                    areasOfDuty={areasOfDuty ?? []}
                    uploads={pendingUploads}
                  />
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
