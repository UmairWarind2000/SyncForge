// src/app/api/files/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

// GET /api/files?workspaceId=xxx — list all files for a workspace
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
      { success: false, error: "workspaceId required" },
      { status: 400 }
    );
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
  });
  if (!membership) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const files = await prisma.codeFile.findMany({
    where: { workspaceId },
    select: {
      id:        true,
      name:      true,
      path:      true,
      language:  true,
      createdAt: true,
      updatedAt: true,
      creator:   { select: { id: true, name: true } },
    },
    orderBy: { path: "asc" },
  });

  return NextResponse.json<ApiResponse<typeof files>>({
    success: true,
    data: files,
  });
}

// POST /api/files — create a new file
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { workspaceId, name, path, language } = await req.json();

  if (!workspaceId || !name || !path) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "workspaceId, name, and path are required" },
      { status: 400 }
    );
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
  });
  if (!membership) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  // Check path is unique in this workspace
  const existing = await prisma.codeFile.findUnique({
    where: { workspaceId_path: { workspaceId, path } },
  });
  if (existing) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "A file already exists at that path" },
      { status: 409 }
    );
  }

  const file = await prisma.codeFile.create({
    data: {
      name,
      path,
      language:    language || detectLanguage(name),
      content:     getDefaultContent(name),
      workspaceId,
      creatorId:   session.user.id,
    },
  });

  return NextResponse.json<ApiResponse<typeof file>>(
    { success: true, data: file },
    { status: 201 }
  );
}

// Detect language from file extension
function detectLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: "typescript", tsx: "typescript",
    js: "javascript", jsx: "javascript",
    py: "python",     rb: "ruby",
    go: "go",         rs: "rust",
    css: "css",       scss: "scss",
    html: "html",     json: "json",
    md: "markdown",   sql: "sql",
    sh: "shell",      yml: "yaml", yaml: "yaml",
  };
  return map[ext ?? ""] || "plaintext";
}

// Default content per file type
function getDefaultContent(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "ts" || ext === "tsx") return "// " + filename + "\n\n";
  if (ext === "js" || ext === "jsx") return "// " + filename + "\n\n";
  if (ext === "py") return "# " + filename + "\n\n";
  if (ext === "md") return "# " + filename.replace(/\.md$/, "") + "\n\n";
  if (ext === "json") return "{\n  \n}\n";
  return "";
}