"use client";

import { useRef, useState } from "react";
import { createAnnouncement } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";
import { ImageIcon, X } from "lucide-react";

export default function AnnouncementForm({ error, success }: { error?: string | null; success?: boolean }) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  function clearImage() {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <form action={createAnnouncement} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-white/60 mb-1.5">
          Title
        </label>
        <input
          name="title"
          required
          placeholder="Announcement title"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-white/60 mb-1.5">
          Content
        </label>
        <textarea
          name="content"
          required
          rows={4}
          placeholder="Write your announcement here…"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-accent focus:outline-none resize-none"
        />
      </div>

      {/* Optional image */}
      <div>
        <label className="block text-xs font-medium text-white/60 mb-1.5">
          Image <span className="text-white/30">(optional)</span>
        </label>
        {/* Single persistent input — never unmounts so selected file is preserved on re-render */}
        <input ref={fileRef} id="image-upload" name="image" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        {preview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="w-full rounded-lg object-cover max-h-48"
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <label htmlFor="image-upload" className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/20 p-3 hover:border-white/40 transition-colors">
            <ImageIcon className="h-4 w-4 text-white/40" />
            <span className="text-xs text-white/40">Click to attach an image (JPG, PNG, GIF, WEBP · max 5 MB)</span>
          </label>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
      {success && (
        <p className="text-xs text-green-400">Announcement posted successfully.</p>
      )}

      <SubmitButton label="Post Announcement" loadingLabel="Posting…" />
    </form>
  );
}
