"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createUploadRecord } from "@/lib/actions/uploads";
import { Upload, FileText, ImageIcon, X } from "lucide-react";

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

export default function UploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success">("idle");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setError(null);
    setStatus("idle");
    if (!f) {
      setFile(null);
      return;
    }
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
  }

  function handleClear() {
    setFile(null);
    setError(null);
    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleUpload() {
    if (!file || status === "uploading") return;
    setStatus("uploading");
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expired. Please log in again.");

      const blob =
        file.type !== "application/pdf" ? await compressImage(file) : file;

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/${Date.now()}-${safeName}`;

      const { error: storageErr } = await supabase.storage
        .from("case-uploads")
        .upload(path, blob, { contentType: file.type });

      if (storageErr) throw new Error(storageErr.message);

      await createUploadRecord(path, file.name);

      setStatus("success");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Upload failed. Please try again."
      );
      setStatus("idle");
    }
  }

  const isImage = file?.type.startsWith("image/");

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h2 className="mb-4 text-sm font-semibold text-foreground">
        Upload Case Proof
      </h2>

      {/* Drop zone */}
      <div
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background py-10 transition-colors hover:border-accent/60"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mb-3 h-8 w-8 text-(--text-muted)" />
        <p className="text-sm font-medium text-foreground">Click to browse</p>
        <p className="mt-1 text-xs text-(--text-muted)">
          JPG, PNG or PDF · max 10 MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Selected file */}
      {file && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-border bg-elevated px-4 py-3">
          <div className="flex items-center gap-3">
            {isImage ? (
              <ImageIcon className="h-5 w-5 shrink-0 text-accent" />
            ) : (
              <FileText className="h-5 w-5 shrink-0 text-accent" />
            )}
            <div>
              <p className="max-w-xs truncate text-sm font-medium text-foreground">
                {file.name}
              </p>
              <p className="text-xs text-(--text-muted)">{formatBytes(file.size)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-(--text-muted) transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-3 text-sm text-(--status-rejected)">{error}</p>
      )}

      {/* Success */}
      {status === "success" && (
        <p className="mt-3 text-sm text-(--status-processed)">
          Uploaded successfully — pending admin review.
        </p>
      )}

      <button
        type="button"
        disabled={!file || status === "uploading"}
        onClick={handleUpload}
        className="mt-4 w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-black transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        {status === "uploading" ? "Uploading…" : "Upload"}
      </button>
    </div>
  );
}
