"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import {
  updateStudentSection,
  bulkUpdateStudentSection,
} from "@/app/admin/roster/actions";

export type StudentRow = {
  id: string;
  full_name: string;
  email: string;
  section: string | null;
  is_verified: boolean;
  pct: number;
  total: number;
};

export default function StudentsTable({ students }: { students: StudentRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkSection, setBulkSection] = useState("");
  const [isPending, startTransition] = useTransition();

  const allSelected = students.length > 0 && selected.size === students.length;
  const someSelected = selected.size > 0 && selected.size < students.length;

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(students.map((s) => s.id)));
  }

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function handleBulkAssign() {
    const fd = new FormData();
    for (const id of selected) fd.append("student_ids", id);
    fd.set("section", bulkSection);
    startTransition(async () => {
      await bulkUpdateStudentSection(fd);
      setSelected(new Set());
      setBulkSection("");
    });
  }

  function clearBulkSection() {
    const fd = new FormData();
    for (const id of selected) fd.append("student_ids", id);
    fd.set("section", "");
    startTransition(async () => {
      await bulkUpdateStudentSection(fd);
      setSelected(new Set());
    });
  }

  if (students.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
          <Users className="h-8 w-8 text-(--text-muted)" />
          <p className="text-sm text-(--text-muted)">No students found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      {/* Bulk action bar — visible when rows are selected */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-accent/30 bg-accent/10 px-4 py-2.5">
          <span className="text-xs font-semibold text-accent">
            {selected.size} student{selected.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <input
              value={bulkSection}
              onChange={(e) => setBulkSection(e.target.value)}
              placeholder="Assign section…"
              className="w-36 rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground placeholder:text-(--text-muted) focus:border-accent focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (bulkSection.trim()) handleBulkAssign();
                }
              }}
            />
            <button
              onClick={handleBulkAssign}
              disabled={isPending || !bulkSection.trim()}
              className="rounded-md bg-accent/20 px-3 py-1 text-xs font-semibold text-accent hover:bg-accent/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? "…" : "Assign"}
            </button>
            <button
              onClick={clearBulkSection}
              disabled={isPending}
              className="rounded-md border border-border bg-elevated px-3 py-1 text-xs text-(--text-secondary) hover:text-foreground transition-colors disabled:opacity-40"
              title="Remove section from selected students"
            >
              Clear section
            </button>
          </div>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-(--text-muted) hover:text-foreground transition-colors ml-auto"
          >
            Deselect all
          </button>
        </div>
      )}

      {/* Column headers */}
      <div className="grid grid-cols-[32px_1fr_60px_90px_160px] gap-2 border-b border-border bg-elevated px-4 py-2.5">
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected;
          }}
          onChange={toggleAll}
          className="mt-0.5 h-3.5 w-3.5 cursor-pointer rounded border-border accent-accent"
          aria-label="Select all"
        />
        <span className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Student</span>
        <span className="text-center text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Cases</span>
        <span className="text-right text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Progress</span>
        <span className="text-right text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Section</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {students.map((s) => {
          const isSelected = selected.has(s.id);
          return (
            <div
              key={s.id}
              className={`grid grid-cols-[32px_1fr_60px_90px_160px] gap-2 items-center px-4 py-3 transition-colors hover:bg-elevated group ${
                isSelected ? "bg-accent/5" : ""
              }`}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggle(s.id)}
                className="h-3.5 w-3.5 cursor-pointer rounded border-border accent-accent"
                aria-label={`Select ${s.full_name}`}
              />

              {/* Name + email */}
              <Link href={`/admin/students/${s.id}`} className="min-w-0 block">
                <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-accent">
                  {s.full_name}
                </p>
                <p className="truncate text-xs text-(--text-muted)">
                  {s.email}
                  {!s.is_verified && (
                    <span className="ml-2 text-amber-400">Unverified</span>
                  )}
                </p>
              </Link>

              {/* Cases */}
              <p className="text-center text-sm text-(--text-secondary)">{s.total || "—"}</p>

              {/* Progress */}
              <div className="text-right">
                <span
                  className={`text-sm font-semibold ${
                    s.pct >= 100
                      ? "text-green-400"
                      : s.pct >= 50
                        ? "text-accent"
                        : "text-red-400"
                  }`}
                >
                  {s.pct}%
                </span>
              </div>

              {/* Individual section edit */}
              <form
                action={updateStudentSection}
                className="flex items-center justify-end gap-1.5"
              >
                <input type="hidden" name="id" value={s.id} />
                <input
                  name="section"
                  defaultValue={s.section ?? ""}
                  placeholder="—"
                  className="w-20 rounded-md border border-border bg-elevated px-2 py-1 text-xs text-foreground placeholder:text-(--text-muted) focus:border-accent focus:outline-none"
                />
                <button
                  type="submit"
                  className="text-xs font-medium text-accent hover:text-accent/70 transition-colors"
                >
                  Set
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
