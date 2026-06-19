// src/components/workspace/WorkspaceCard.tsx
"use client";
import Link from "next/link";
import { CheckSquare, Users, ArrowUpRight } from "lucide-react";
import { UserAvatar } from "@/components/layout/UserAvatar";
import type { WorkspaceWithMembers } from "@/types";

interface WorkspaceCardProps {
  workspace: WorkspaceWithMembers;
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  const visibleMembers = workspace.members.slice(0, 4);
  const extraCount     = workspace.members.length - visibleMembers.length;

  return (
    <Link href={`/workspace/${workspace.id}`}>
      <div
        className="rounded-xl p-4 sm:p-5 group cursor-pointer transition-all duration-150 h-full flex flex-col"
        style={{
          background: "var(--color-surface)",
          border:     "1px solid var(--color-border)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-subtle)";
          (e.currentTarget as HTMLElement).style.background  = "var(--color-surface-2)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
          (e.currentTarget as HTMLElement).style.background  = "var(--color-surface)";
        }}
      >
        {/* Color dot + name */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm shrink-0"
              style={{ background: workspace.color }}
            >
              {workspace.name[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3
                className="font-medium text-sm truncate"
                style={{ color: "var(--color-text-primary)" }}
              >
                {workspace.name}
              </h3>
              {workspace.description && (
                <p
                  className="text-xs truncate mt-0.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {workspace.description}
                </p>
              )}
            </div>
          </div>
          <ArrowUpRight
            className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: "var(--color-accent)" }}
          />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 mb-4">
          {[
            { icon: CheckSquare, value: workspace._count.tasks,   label: "tasks" },
            { icon: Users,       value: workspace._count.members, label: "members" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" style={{ color: "var(--color-text-muted)" }} />
              <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                {value} {label}
              </span>
            </div>
          ))}
        </div>

        {/* Member avatars */}
        <div className="flex items-center mt-auto">
          <div className="flex -space-x-2">
            {visibleMembers.map(({ user }) => (
              <UserAvatar
                key={user.id}
                name={user.name}
                image={user.image}
                size="xs"
                className="ring-2 ring-[var(--color-surface)]"
              />
            ))}
            {extraCount > 0 && (
              <div
                className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-medium ring-2 ring-[var(--color-surface)]"
                style={{
                  background: "var(--color-surface-3)",
                  color:      "var(--color-text-secondary)",
                }}
              >
                +{extraCount}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}