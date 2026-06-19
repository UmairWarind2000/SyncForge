// src/app/(dashboard)/workspace/[id]/settings/page.tsx

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { WorkspaceSettingsClient } from "@/components/workspace/WorkspaceSettingsClient";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const workspace = await prisma.workspace.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: `${workspace?.name ?? "Settings"} — Settings` };
}

export default async function WorkspaceSettingsPage({ params }: PageProps) {
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
    include: {
      owner: { select: { id: true, name: true, email: true, image: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!workspace) notFound();

  const isOwner = workspace.ownerId === session!.user.id;
  const userRole = workspace.members.find(
    (m) => m.userId === session!.user.id
  )?.role ?? "MEMBER";

  return (
    <WorkspaceSettingsClient
      workspace={workspace}
      currentUserId={session!.user.id}
      isOwner={isOwner}
      userRole={userRole}
    />
  );
}