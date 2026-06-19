// src/app/(dashboard)/workspace/[id]/board/page.tsx

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { KanbanBoard } from "@/components/board/KanbanBoard";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const workspace = await prisma.workspace.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: `${workspace?.name ?? "Board"} — Board` };
}

export default async function BoardPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  const workspace = await prisma.workspace.findFirst({
    where: {
      id,
      OR: [
        { ownerId: session!.user.id },
        { members: { some: { userId: session!.user.id } } },
      ],
    },
    select: { id: true, name: true },
  });

  if (!workspace) notFound();

  return (
    <div className="h-full">
      <KanbanBoard workspaceId={workspace.id} />
    </div>
  );
}