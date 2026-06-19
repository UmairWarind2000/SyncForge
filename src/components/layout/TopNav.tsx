// src/components/layout/TopNav.tsx
"use client";

import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { LogOut, Settings, ChevronDown } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { UserAvatar } from "./UserAvatar";

export function TopNav() {
  const { data: session } = useSession();

  return (
    <header
      className="h-12 flex items-center justify-between px-4 shrink-0"
      style={{
        borderBottom: "1px solid var(--color-border-subtle)",
        background:   "var(--color-surface)",
      }}
    >
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5 group">
        <div
          className="h-7 w-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
          style={{ background: "var(--color-accent)" }}
        >
          SF
        </div>
        <span className="font-semibold text-sm hidden sm:block" style={{ color: "var(--color-text-primary)" }}>
          SyncForge
        </span>
      </Link>

      {/* User menu */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <UserAvatar
              name={session?.user?.name}
              image={session?.user?.image}
              size="sm"
            />
            <span className="text-sm hidden sm:block" style={{ color: "var(--color-text-primary)" }}>
              {session?.user?.name?.split(" ")[0] ?? "Account"}
            </span>
            <ChevronDown className="h-3.5 w-3.5 hidden sm:block" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="z-50 min-w-[200px] rounded-xl p-1.5 shadow-xl"
            style={{
              background: "var(--color-surface-2)",
              border:     "1px solid var(--color-border)",
            }}
            align="end"
            sideOffset={6}
          >
            <div className="px-3 py-2 mb-1">
              <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                {session?.user?.name}
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {session?.user?.email}
              </p>
            </div>

            <DropdownMenu.Separator
              className="my-1 h-px"
              style={{ background: "var(--color-border)" }}
            />

            <DropdownMenu.Item asChild>
              <Link
                href="/settings"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors"
                style={{ color: "var(--color-text-secondary)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--color-surface-3)";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-text-primary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-text-secondary)";
                }}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenu.Item>

            <DropdownMenu.Separator
              className="my-1 h-px"
              style={{ background: "var(--color-border)" }}
            />

            <DropdownMenu.Item
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors"
              style={{ color: "var(--color-danger)" }}
              onSelect={() => signOut({ callbackUrl: "/login" })}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "var(--color-danger-muted)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "transparent")
              }
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </header>
  );
}