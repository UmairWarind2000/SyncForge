// src/app/(dashboard)/workspace/[id]/layout.tsx
"use client";

// Note: this is a client component because it uses hooks
// Data fetching for workspace details still happens in child server components

import { use } from "react";
import { PresenceBar } from "@/components/presence/PresenceBar";
import { useSocket } from "@/hooks/useSocket";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

function WorkspaceLayoutInner({
  children,
  workspaceId,
}: {
  children: React.ReactNode;
  workspaceId: string;
}) {
  // Initializes socket connection for the entire workspace section
  useSocket(workspaceId);

  return (
    <div className="flex flex-col h-full">
      <PresenceBar workspaceId={workspaceId} />
      {children}
    </div>
  );
}

export default function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { id } = use(params);

  return (
    <WorkspaceLayoutInner workspaceId={id}>
      {children}
    </WorkspaceLayoutInner>
  );
}