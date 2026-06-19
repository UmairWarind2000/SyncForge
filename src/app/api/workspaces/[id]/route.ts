// src/app/api/workspaces/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse, WorkspaceWithMembers } from "@/types";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/workspaces/[id]
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const workspace = await prisma.workspace.findFirst({
    where: {
      id,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, email: true, image: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      _count: { select: { tasks: true, members: true } },
    },
  });

  if (!workspace) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Workspace not found" },
      { status: 404 }
    );
  }

  return NextResponse.json<ApiResponse<WorkspaceWithMembers>>({
    success: true,
    data: workspace,
  });
}

// PATCH /api/workspaces/[id] — update name/description/color
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: id,
        userId: session.user.id,
      },
    },
  });

  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { name, description, color } = body;

  const updated = await prisma.workspace.update({
    where: { id },
    data: {
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(color && { color }),
    },
  });

  return NextResponse.json<ApiResponse<typeof updated>>({
    success: true,
    data: updated,
  });
}

// DELETE /api/workspaces/[id] — only owner can delete
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const workspace = await prisma.workspace.findFirst({
    where: { id, ownerId: session.user.id },
  });

  if (!workspace) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Not found or insufficient permissions" },
      { status: 404 }
    );
  }

  await prisma.workspace.delete({ where: { id } });

  return NextResponse.json<ApiResponse<{ deleted: true }>>({
    success: true,
    data: { deleted: true },
  });
}