// src/app/api/files/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/files/[id] — get file with content
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const file = await prisma.codeFile.findUnique({
    where: { id },
    include: {
      workspace: {
        select: { id: true },
      },
    },
  });

  if (!file) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "File not found" },
      { status: 404 }
    );
  }

  // Verify membership
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: file.workspace.id,
        userId:      session.user.id,
      },
    },
  });
  if (!membership) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  return NextResponse.json<ApiResponse<typeof file>>({
    success: true,
    data: file,
  });
}

// PATCH /api/files/[id] — rename file
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { name, path } = await req.json();

  const file = await prisma.codeFile.findUnique({
    where: { id },
    select: { workspaceId: true },
  });
  if (!file) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "File not found" },
      { status: 404 }
    );
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: file.workspaceId,
        userId:      session.user.id,
      },
    },
  });
  if (!membership) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const updated = await prisma.codeFile.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(path && { path }),
    },
  });

  return NextResponse.json<ApiResponse<typeof updated>>({
    success: true,
    data: updated,
  });
}

// DELETE /api/files/[id]
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const file = await prisma.codeFile.findUnique({
    where: { id },
    select: { workspaceId: true, creatorId: true },
  });
  if (!file) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "File not found" },
      { status: 404 }
    );
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: file.workspaceId,
        userId:      session.user.id,
      },
    },
  });

  const canDelete =
    file.creatorId === session.user.id ||
    ["OWNER", "ADMIN"].includes(membership?.role ?? "");

  if (!canDelete) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  await prisma.codeFile.delete({ where: { id } });

  return NextResponse.json<ApiResponse<{ deleted: true }>>({
    success: true,
    data: { deleted: true },
  });
}