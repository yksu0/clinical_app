"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { Eye, X, Loader2, FileText } from "lucide-react";
import { getUploadPreviewUrl } from "./actions";

interface Props {
  uploadId: string;
  fileName: string;
}

export default function UploadPreviewModal({ uploadId, fileName }: Props) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isPdf = fileName.toLowerCase().endsWith(".pdf");

  const handleOpen = () => {
    setOpen(true);
    setError(null);
    if (!url) {
      startTransition(async () => {
        const result = await getUploadPreviewUrl(uploadId);
        if (result.url) {
          setUrl(result.url);
        } else {
          setError(result.error ?? "Failed to load preview.");
        }
      });
    }
  };

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleOpen();
        }}
        title="Preview"
        className="rounded-md p-1 text-(--text-muted) hover:text-accent hover:bg-elevated transition-colors"
      >
        <Eye className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        >
          <div
            className="relative mx-4 flex max-h-[90vh] max-w-4xl flex-col rounded-xl border border-border bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <p className="truncate text-sm font-medium text-foreground pr-4">
                {fileName}
              </p>
              <div className="flex items-center gap-2">
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-elevated px-3 py-1.5 text-xs font-medium text-(--text-secondary) hover:text-foreground transition-colors"
                  >
                    Open in new tab
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg p-1.5 text-(--text-muted) hover:text-foreground hover:bg-elevated transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto p-4">
              {isPending && (
                <div className="flex flex-col items-center justify-center gap-2 py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                  <p className="text-xs text-(--text-muted)">Loading preview…</p>
                </div>
              )}

              {error && (
                <div className="flex flex-col items-center justify-center gap-2 py-20">
                  <p className="text-sm text-(--status-rejected)">{error}</p>
                </div>
              )}

              {url && !isPending && !error && (
                isPdf ? (
                  <div className="flex flex-col items-center gap-4">
                    <FileText className="h-16 w-16 text-(--text-muted)" />
                    <p className="text-sm text-(--text-secondary)">PDF preview</p>
                    <iframe
                      src={url}
                      className="h-[70vh] w-full rounded-lg border border-border"
                      title={fileName}
                    />
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt={fileName}
                    className="mx-auto max-h-[75vh] rounded-lg object-contain"
                  />
                )
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
