// src/components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Kanban, Code2,
  MessageSquare, Settings, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const workspaceMatch = pathname.match(/\/workspace\/([^/]+)/);
  const workspaceId    = workspaceMatch?.[1];

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ...(workspaceId
      ? [
          { label: "Board",    href: `/workspace/${workspaceId}/board`,    icon: Kanban },
          { label: "Editor",   href: `/workspace/${workspaceId}/editor`,   icon: Code2 },
          { label: "Chat",     href: `/workspace/${workspaceId}/chat`,     icon: MessageSquare },
          { label: "Settings", href: `/workspace/${workspaceId}/settings`, icon: Settings },
        ]
      : []),
  ];

  return (
    <aside
      className="w-14 lg:w-52 shrink-0 flex flex-col h-full transition-all duration-200"
      style={{ borderRight: "1px solid var(--color-border-subtle)", background: "var(--color-surface)" }}
    >
      {workspaceId && (
        <div
          className="hidden lg:flex items-center gap-2 px-4 py-3 mx-2 mt-2 rounded-lg"
          style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
        >
          <div
            className="h-2 w-2 rounded-full shrink-0"
            style={{ background: "var(--color-accent)" }}
          />
          <span className="text-xs font-medium truncate" style={{ color: "var(--color-text-secondary)" }}>
            Workspace
          </span>
        </div>
      )}

      <nav className="flex-1 p-2 space-y-0.5 mt-2">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-all duration-150",
                isActive
                  ? "font-medium"
                  : "hover:bg-[var(--color-surface-2)]"
              )}
              style={{
                background: isActive ? "var(--color-accent-muted)" : undefined,
                color:      isActive ? "var(--color-accent)" : "var(--color-text-secondary)",
                border:     isActive ? "1px solid var(--color-accent-border)" : "1px solid transparent",
              }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden lg:block">{label}</span>
              {isActive && (
                <ChevronRight className="h-3 w-3 ml-auto hidden lg:block" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}