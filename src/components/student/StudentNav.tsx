"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import { LayoutDashboard, Upload, CalendarClock, ClipboardList } from "lucide-react";

const NAV = [
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/upload", label: "Upload", icon: Upload },
  { href: "/student/assignments", label: "Assignments", icon: CalendarClock },
  { href: "/student/history", label: "Case History", icon: ClipboardList },
];

export default function StudentNav({ displayName }: { displayName: string }) {
  const pathname = usePathname();

  return (
    <header className="shrink-0 border-b border-border bg-surface">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold text-foreground">Clinical Cases</span>
          <nav className="flex items-center gap-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  pathname.startsWith(href)
                    ? "bg-accent/15 text-accent font-medium"
                    : "text-(--text-secondary) hover:text-foreground hover:bg-elevated"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-black">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <p className="text-sm font-medium text-foreground hidden sm:block">{displayName}</p>
          <form action={logout}>
            <button className="text-xs text-(--text-secondary) hover:text-foreground transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
