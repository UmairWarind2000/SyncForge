// src/app/api/tasks/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse, TaskWithRelations } from "@/types";

type RouteParams = { params: Promise<{ id: string }> };

// PATCH /api/tasks/[id] — update task fields
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const task = await prisma.task.findUnique({
    where: { id },
    select: { workspaceId: true },
  });
  if (!task) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Task not found" },
      { status: 404 }
    );
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: task.workspaceId,
        userId: session.user.id,
      },
    },
  });
  if (!membership) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { title, description, priority, assigneeId, dueDate } = body;

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(title       !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(priority    !== undefined && { priority }),
      ...(assigneeId  !== undefined && { assigneeId: assigneeId || null }),
      ...(dueDate     !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
    },
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      creator:  { select: { id: true, name: true, image: true } },
      labels:   true,
      column:   { select: { id: true, name: true } },
    },
  });

  return NextResponse.json<ApiResponse<TaskWithRelations>>({
    success: true,
    data: updated,
  });
}

// DELETE /api/tasks/[id]
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const task = await prisma.task.findUnique({
    where: { id },
    select: { workspaceId: true, creatorId: true },
  });
  if (!task) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Task not found" },
      { status: 404 }
    );
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: task.workspaceId,
        userId: session.user.id,
      },
    },
  });

  const canDelete =
    task.creatorId === session.user.id ||
    ["OWNER", "ADMIN"].includes(membership?.role ?? "");

  if (!canDelete) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  await prisma.task.delete({ where: { id } });

  return NextResponse.json<ApiResponse<{ deleted: true }>>({
    success: true,
    data: { deleted: true },
  });
}