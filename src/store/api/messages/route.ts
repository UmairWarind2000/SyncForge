// src/app/api/messages/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse, MessageWithAuthor } from "@/types";

// GET /api/messages?workspaceId=xxx&cursor=xxx
// Paginated — load 50 messages at a time
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  const cursor      = req.nextUrl.searchParams.get("cursor"); // message ID for pagination

  if (!workspaceId) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "workspaceId required" },
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

  const messages = await prisma.message.findMany({
    where: { workspaceId },
    include: {
      author: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
    // Cursor-based pagination
    ...(cursor && {
      skip: 1,
      cursor: { id: cursor },
    }),
  });

  return NextResponse.json<ApiResponse<MessageWithAuthor[]>>({
    success: true,
    data: messages,
  });
}