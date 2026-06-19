// src/app/api/workspaces/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";
import type { ApiResponse, WorkspaceWithMembers } from "@/types";

// GET /api/workspaces — get all workspaces the current user belongs to
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const workspaces = await prisma.workspace.findMany({
    where: {
      // Find workspaces where user is owner OR a member
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true, image: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
      _count: {
        select: { tasks: true, members: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json<ApiResponse<WorkspaceWithMembers[]>>({
    success: true,
    data: workspaces,
  });
}

// POST /api/workspaces — create a new workspace
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { name, description, color } = body;

  // Validate required fields
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Name must be at least 2 characters" },
      { status: 400 }
    );
  }

  // Generate a unique slug
  let slug = generateSlug(name);
  const existingSlug = await prisma.workspace.findUnique({ where: { slug } });
  if (existingSlug) {
    // Append random suffix if slug already taken
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  // Create the workspace AND default Kanban columns in one transaction
  const workspace = await prisma.$transaction(async (tx: any) => {
    const ws = await tx.workspace.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        color: color || "#6366f1",
        ownerId: session.user.id,
        // Auto-add the creator as OWNER member
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
    });

    // Create default Kanban columns for every new workspace
    await tx.column.createMany({
      data: [
        { name: "To Do",       order: 0, workspaceId: ws.id, color: "#e2e8f0" },
        { name: "In Progress", order: 1, workspaceId: ws.id, color: "#fef3c7" },
        { name: "In Review",   order: 2, workspaceId: ws.id, color: "#dbeafe" },
        { name: "Done",        order: 3, workspaceId: ws.id, color: "#dcfce7" },
      ],
    });

    return ws;
  });

  return NextResponse.json<ApiResponse<typeof workspace>>(
    { success: true, data: workspace },
    { status: 201 }
  );
}