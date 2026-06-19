// src/app/(dashboard)/dashboard/page.tsx

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkspaceCard } from "@/components/workspace/WorkspaceCard";
import { CreateWorkspaceModal } from "@/components/workspace/CreateWorkspaceModal";
import { Plus } from "lucide-react";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();

  const workspaces = await prisma.workspace.findMany({
    where: {
      OR: [
        { ownerId: session!.user.id },
        { members: { some: { userId: session!.user.id } } },
      ],
    },
    include: {
      owner:   { select: { id: true, name: true, email: true, image: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      _count: { select: { tasks: true, members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1
            className="text-xl sm:text-2xl font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Good to see you, {session?.user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            {workspaces.length === 0
              ? "Create your first workspace to get started"
              : `${workspaces.length} workspace${workspaces.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <CreateWorkspaceModal />
      </div>

      {/* Empty state */}
      {workspaces.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-24 text-center rounded-2xl"
          style={{ border: "1px dashed var(--color-border)" }}
        >
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: "var(--color-surface-2)",
              border:     "1px solid var(--color-border)",
            }}
          >
            <Plus className="h-6 w-6" style={{ color: "var(--color-text-muted)" }} />
          </div>
          <h2 className="font-medium mb-2" style={{ color: "var(--color-text-primary)" }}>
            No workspaces yet
          </h2>
          <p className="text-sm max-w-xs" style={{ color: "var(--color-text-secondary)" }}>
            Create a workspace to start collaborating with your team.
          </p>
        </div>
      )}

      {/* Grid */}
      {workspaces.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {workspaces.map((ws) => (
            <WorkspaceCard key={ws.id} workspace={ws} />
          ))}
        </div>
      )}
    </div>
  );
}