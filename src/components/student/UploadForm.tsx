"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createUploadAndSubmission } from "@/lib/actions/uploads";
import { Upload, FileText, X, CheckCircle } from "lucide-react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = document.createElement("img");
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX_DIM = 2048;
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(blob ?? file),
        file.type === "image/png" ? "image/png" : "image/jpeg",
        0.82
      );
    };
    img.src = url;
  });
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type CaseType = { id: string; name: string };
type AreaOfDuty = { id: string; name: string };
type Rotation = { id: string; name: string };
type OpenAssignment = {
  id: string;
  scheduled_date: string;
  areas_of_duty: { name: string } | null;
};

interface Props {
  caseTypes: CaseType[];
  areasOfDuty: AreaOfDuty[];
  rotations: Rotation[];
  openAssignments: OpenAssignment[];
}

export default function UploadForm({ caseTypes, areasOfDuty, rotations, openAssignments }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success">("idle");

  // Form field state
  const [caseTypeId, setCaseTypeId] = useState("");
  const [areaOfDutyId, setAreaOfDutyId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [rotationId, setRotationId] = useState("");
  const [assignmentId, setAssignmentId] = useState("");
  const [notes, setNotes] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setError(null);
    setStatus("idle");
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (!f) { setFile(null); return; }
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError("Only JPG, PNG, and PDF files are accepted.");
      setFile(null);
      e.target.value = "";
      return;
    }
    if (f.size > MAX_SIZE_BYTES) {
      setError(`File too large (${formatBytes(f.size)}). Maximum is 10 MB.`);
      setFile(null);
      e.target.value = "";
      return;
    }
    setFile(f);
    if (f.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(f));
    }
  }

  function handleClear() {
    setFile(null);
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
    setError(null);
    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || status === "uploading") return;
    if (!caseTypeId || !areaOfDutyId || !date) {
      setError("Case type, area of duty, and date are required.");
      return;
    }
    setStatus("uploading");
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expired. Please log in again.");

      const blob = file.type !== "application/pdf" ? await compressImage(file) : file;
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/${Date.now()}-${safeName}`;

      const { error: storageErr } = await supabase.storage
        .from("case-uploads")
        .upload(path, blob, { contentType: file.type });
      if (storageErr) throw new Error(storageErr.message);

      await createUploadAndSubmission(path, file.name, file.type, file.size, {
        caseTypeId,
        areaOfDutyId,
        date,
        rotationId: rotationId || null,
        assignmentId: assignmentId || null,
        notes: notes.trim() || null,
      });

      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setStatus("idle");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-8 text-center space-y-3">
        <CheckCircle className="mx-auto h-8 w-8 text-green-400" />
        <p className="text-sm font-semibold text-green-400">Uploaded and submitted for review.</p>
        <p className="text-xs text-(--text-secondary)">Your instructor will review the case details shortly.</p>
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setFile(null);
              if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
              setCaseTypeId(""); setAreaOfDutyId(""); setRotationId(""); setAssignmentId(""); setNotes("");
              setDate(new Date().toISOString().slice(0, 10));
              router.refresh();
            }}
            className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-elevated transition-colors"
          >
            Upload Another
          </button>
          <a href="/student/cases" className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-black hover:bg-accent/90 transition-colors">
            View My Cases
          </a>
        </div>
      </div>
    );
  }

  // No file selected â€” show dropzone only
  if (!file) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Upload Case Proof</h2>
        <div
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background py-12 transition-colors hover:border-accent/60"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mb-3 h-8 w-8 text-(--text-muted)" />
          <p className="text-sm font-medium text-foreground">Click to browse</p>
          <p className="mt-1 text-xs text-(--text-muted)">JPG, PNG or PDF Â· max 10 MB</p>
          <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={handleFileChange} />
        </div>
        {error && <p className="text-sm text-(--status-rejected)">{error}</p>}
      </div>
    );
  }

  // File selected â€” show two-panel layout
  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Upload &amp; Submit Case</h2>
        <button type="button" onClick={handleClear} className="text-(--text-muted) hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
        {/* Left: file preview */}
        <div className="p-5 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-(--text-secondary)">Preview</p>
          {previewUrl ? (
            <div className="rounded-lg overflow-hidden border border-border bg-background flex-1 min-h-48">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Upload preview" className="w-full h-full object-contain max-h-96" />
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-background flex flex-col items-center justify-center gap-2 py-12">
              <FileText className="h-10 w-10 text-(--text-muted)" />
              <p className="text-sm font-medium text-foreground text-center px-4">{file.name}</p>
              <p className="text-xs text-(--text-muted)">{formatBytes(file.size)}</p>
            </div>
          )}
          <p className="text-xs text-(--text-muted) truncate">{file.name} Â· {formatBytes(file.size)}</p>
        </div>

        {/* Right: case detail fields */}
        <div className="p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-(--text-secondary)">Case Details</p>

          {/* Link to assignment */}
          {openAssignments.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
                Link to Assignment (optional)
              </label>
              <select
                value={assignmentId}
                onChange={(e) => setAssignmentId(e.target.value)}
                className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">â€” Not linked to an assignment â€”</option>
                {openAssignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.areas_of_duty?.name ?? "Unknown"} â€”{" "}
                    {new Date(a.scheduled_date).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Case type */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
              Case Type <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={caseTypeId}
              onChange={(e) => setCaseTypeId(e.target.value)}
              className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Select case typeâ€¦</option>
              {caseTypes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Area of duty */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
              Area of Duty <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={areaOfDutyId}
              onChange={(e) => setAreaOfDutyId(e.target.value)}
              className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Select areaâ€¦</option>
              {areasOfDuty.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
              Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              required
              value={date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Rotation */}
          {rotations.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
                Rotation (optional)
              </label>
              <select
                value={rotationId}
                onChange={(e) => setRotationId(e.target.value)}
                className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">â€” No rotation â€”</option>
                {rotations.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-(--text-secondary)">
              Notes / Remarks (optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Brief description of the case, procedure, etc."
              className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground placeholder:text-(--text-muted) focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "uploading"}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-black transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === "uploading" ? "Uploadingâ€¦" : "Upload & Submit for Review"}
          </button>
        </div>
      </div>

      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={handleFileChange} />
    </form>
  );
}
