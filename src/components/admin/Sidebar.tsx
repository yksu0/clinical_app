"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  CalendarPlus,
  Users,
  Settings,
  Megaphone,
  ScrollText,
  LogOut,
} from "lucide-react";
import { logout } from "@/lib/actions/auth";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/logging", label: "Case Logging", icon: ClipboardList },
  { href: "/admin/assignments", label: "Assignments", icon: CalendarPlus },
  { href: "/admin/roster", label: "Student Roster", icon: Users },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  {
    href: "/admin/config",
    label: "Configuration",
    icon: Settings,
    children: [
      { href: "/admin/config/case-types", label: "Case Types" },
      { href: "/admin/config/locations", label: "Locations" },
      { href: "/admin/config/requirements", label: "Requirements" },
    ],
  },
  { href: "/admin/audit", label: "Audit Logs", icon: ScrollText },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact = false) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent">
          <ClipboardList className="h-4 w-4 text-black" />
        </div>
        <span className="text-sm font-semibold text-foreground">
          Clinical Cases
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);

          if (item.children) {
            const groupActive = isActive(item.href);
            return (
              <div key={item.href}>
                <div
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    groupActive
                      ? "text-accent"
                      : "text-(--text-secondary) hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </div>
                <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-border pl-3">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`rounded-md px-2 py-1.5 text-xs transition-colors ${
                        pathname === child.href
                          ? "bg-accent-muted text-accent font-medium"
                          : "text-(--text-secondary) hover:text-foreground"
                      }`}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent-muted text-accent"
                  : "text-(--text-secondary) hover:bg-elevated hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-border p-3">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-elevated hover:text-foreground"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
