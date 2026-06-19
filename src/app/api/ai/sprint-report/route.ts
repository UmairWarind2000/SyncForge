// src/app/api/ai/sprint-report/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openai, checkRateLimit, SYSTEM_PROMPT } from "@/lib/ai";
import type { ApiResponse } from "@/types";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const rateLimit = checkRateLimit(session.user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Rate limit reached." },
      { status: 429 }
    );
  }

  const { workspaceId } = await req.json();

  if (!workspaceId) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "workspaceId required" },
      { status: 400 }
    );
  }

  // Verify membership
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
  });
  if (!membership) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  // Fetch workspace + all tasks with column info
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { name: true },
  });

  const columns = await prisma.column.findMany({
    where: { workspaceId },
    orderBy: { order: "asc" },
    include: {
      tasks: {
        include: {
          assignee: { select: { name: true } },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  // Build a structured summary for the AI prompt
  const taskSummary = columns
    .map((col) => {
      if (col.tasks.length === 0) return null;
      const taskList = col.tasks
        .map(
          (t) =>
            `  - ${t.title}${t.assignee ? ` (${t.assignee.name})` : ""}${t.priority !== "MEDIUM" ? ` [${t.priority}]` : ""}`
        )
        .join("\n");
      return `${col.name} (${col.tasks.length} tasks):\n${taskList}`;
    })
    .filter(Boolean)
    .join("\n\n");

  const totalTasks = columns.reduce((sum, col) => sum + col.tasks.length, 0);
  const doneTasks  = columns.find((c) =>
    c.name.toLowerCase().includes("done")
  )?.tasks.length ?? 0;

  try {
    const completion = await openai.chat.completions.create({
      model:      "gpt-4o-mini",
      max_tokens: 800,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Generate a sprint report for the project "${workspace?.name}".

Task breakdown:
${taskSummary}

Stats: ${totalTasks} total tasks, ${doneTasks} completed.

Write a professional sprint report with:
1. A 2-sentence executive summary
2. What was completed
3. What is in progress  
4. Blockers or high-priority items
5. A one-sentence recommendation for next steps

Format it clearly with section headers. Keep it under 300 words.`,
        },
      ],
    });

    const report = completion.choices[0]?.message?.content ?? "Could not generate report.";

    return NextResponse.json<ApiResponse<{ report: string; remaining: number }>>({
      success: true,
      data: { report, remaining: rateLimit.remaining },
    });
  } catch (err: any) {
    console.error("[AI] Sprint report error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "AI request failed." },
      { status: 500 }
    );
  }
}