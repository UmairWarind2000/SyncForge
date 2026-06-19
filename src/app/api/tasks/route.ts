// src/app/api/tasks/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse, TaskWithRelations } from "@/types";

// POST /api/tasks — create a new task
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { workspaceId, columnId, title, description, priority, assigneeId, dueDate } = body;

  if (!workspaceId || !columnId || !title?.trim()) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "workspaceId, columnId, and title are required" },
      { status: 400 }
    );
  }

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

  // Get current max order in column so new task goes to bottom
  const lastTask = await prisma.task.findFirst({
    where: { columnId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const order = lastTask ? lastTask.order + 1 : 0;

  const task = await prisma.task.create({
    data: {
      title:       title.trim(),
      description: description?.trim() || null,
      priority:    priority || "MEDIUM",
      order,
      workspaceId,
      columnId,
      creatorId:   session.user.id,
      assigneeId:  assigneeId || null,
      dueDate:     dueDate ? new Date(dueDate) : null,
    },
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      creator:  { select: { id: true, name: true, image: true } },
      labels:   true,
      column:   { select: { id: true, name: true } },
    },
  });

  return NextResponse.json<ApiResponse<TaskWithRelations>>(
    { success: true, data: task },
    { status: 201 }
  );
}