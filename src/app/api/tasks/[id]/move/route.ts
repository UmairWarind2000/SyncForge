// src/app/api/tasks/[id]/move/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/tasks/[id]/move
// Body: { columnId, order, workspaceId }
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { columnId, order, workspaceId } = await req.json();

  // Verify membership
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId: session.user.id },
    },
  });
  if (!membership) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  await prisma.$transaction(async (tx) => {
    // Move the task
    await tx.task.update({
      where: { id },
      data: { columnId, order },
    });

    // Get all tasks in destination column, sorted by order
    const tasksInColumn = await tx.task.findMany({
      where: { columnId },
      orderBy: { order: "asc" },
      select: { id: true },
    });

    // Re-number sequentially — prevents order gaps and collisions
    await Promise.all(
      tasksInColumn.map((t, i) =>
        tx.task.update({
          where: { id: t.id },
          data: { order: i },
        })
      )
    );
  });

  return NextResponse.json<ApiResponse<{ moved: true }>>({
    success: true,
    data: { moved: true },
  });
}