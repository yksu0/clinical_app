"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Search } from "lucide-react";

type Student = { id: string; full_name: string; section: string | null };

interface Props {
  students: Student[];
  selectedId: string | null;
}

export default function StudentSelector({ students, selectedId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = students.find((s) => s.id === selectedId);

  const filtered = search
    ? students.filter((s) =>
        s.full_name.toLowerCase().includes(search.toLowerCase())
      )
    : students;

  const handleSelect = (id: string) => {
    setOpen(false);
    setSearch("");
    router.push(`/admin/logging?student=${id}`);
  };

  const handleClose = useCallback(() => {
    setOpen(false);
    setSearch("");
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, handleClose]);

  // Focus search when opened
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-left transition-colors hover:bg-elevated"
      >
        <div className="min-w-0">
          {selected ? (
            <>
              <p className="truncate text-sm font-semibold text-foreground">
                {selected.full_name}
              </p>
              {selected.section && (
                <p className="text-xs text-(--text-muted)">
                  Section {selected.section}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-(--text-muted)">Select a student…</p>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-(--text-muted) transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-1 flex max-h-72 flex-col rounded-xl border border-border bg-surface shadow-xl">
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-(--text-muted)" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full bg-transparent text-sm text-foreground placeholder-[--text-muted] outline-none"
            />
          </div>

          {/* List */}
          <ul className="flex-1 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-center text-xs text-(--text-muted)">
                No match
              </li>
            ) : (
              filtered.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(s.id)}
                    className={`flex w-full flex-col px-4 py-2.5 text-left transition-colors ${
                      s.id === selectedId
                        ? "bg-accent/15 text-accent"
                        : "text-foreground hover:bg-elevated"
                    }`}
                  >
                    <span className="truncate text-sm font-medium">
                      {s.full_name}
                    </span>
                    {s.section && (
                      <span className="text-xs text-(--text-muted)">
                        Section {s.section}
                      </span>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
