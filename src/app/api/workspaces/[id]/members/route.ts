// src/app/api/workspaces/[id]/members/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/workspaces/[id]/members — invite a user by email
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Only OWNER or ADMIN can invite members
  const inviterMembership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: id,
        userId: session.user.id,
      },
    },
  });

  if (!inviterMembership || !["OWNER", "ADMIN"].includes(inviterMembership.role)) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Email is required" },
      { status: 400 }
    );
  }

  // Find the user to invite
  const userToInvite = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!userToInvite) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "No user found with that email" },
      { status: 404 }
    );
  }

  // Check they're not already a member
  const existingMember = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: id,
        userId: userToInvite.id,
      },
    },
  });

  if (existingMember) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "User is already a member" },
      { status: 409 }
    );
  }

  // Add them as a MEMBER
  const member = await prisma.workspaceMember.create({
    data: {
      workspaceId: id,
      userId: userToInvite.id,
      role: "MEMBER",
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  return NextResponse.json<ApiResponse<typeof member>>(
    { success: true, data: member },
    { status: 201 }
  );
}

// Add this DELETE handler to the existing members route file

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { userId } = await req.json();

  // Only owner can remove members
  const workspace = await prisma.workspace.findFirst({
    where: { id, ownerId: session.user.id },
  });
  if (!workspace) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  // Can't remove the owner
  if (userId === workspace.ownerId) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Cannot remove workspace owner" },
      { status: 400 }
    );
  }

  await prisma.workspaceMember.delete({
    where: { workspaceId_userId: { workspaceId: id, userId } },
  });

  return NextResponse.json<ApiResponse<{ removed: true }>>({
    success: true,
    data: { removed: true },
  });
}