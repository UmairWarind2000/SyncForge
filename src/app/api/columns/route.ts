// src/app/api/columns/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse, ColumnWithTasks } from "@/types";

// GET /api/columns?workspaceId=xxx
// Returns all columns with their tasks for a workspace
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "workspaceId is required" },
      { status: 400 }
    );
  }

  // Verify user is a member of this workspace
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

  const columns = await prisma.column.findMany({
    where: { workspaceId },
    orderBy: { order: "asc" },
    include: {
      tasks: {
        orderBy: { order: "asc" },
        include: {
          assignee: { select: { id: true, name: true, image: true } },
          creator:  { select: { id: true, name: true, image: true } },
          labels:   true,
          column:   { select: { id: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json<ApiResponse<ColumnWithTasks[]>>({
    success: true,
    data: columns,
  });
}