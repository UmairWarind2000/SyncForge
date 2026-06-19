// src/app/api/ai/expand-task/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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

  const { title, workspaceName } = await req.json();

  if (!title?.trim()) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Task title is required" },
      { status: 400 }
    );
  }

  try {
    const completion = await openai.chat.completions.create({
      model:      "gpt-4o-mini",
      max_tokens: 400,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Expand this task title into a clear task description for a software development team.
Project: "${workspaceName || "Software project"}"
Task title: "${title}"

Write 2-3 sentences describing what needs to be done, then list 2-4 acceptance criteria as bullet points.
Keep it practical and developer-focused. No fluff.`,
        },
      ],
    });

    const description = completion.choices[0]?.message?.content ?? "";

    return NextResponse.json<ApiResponse<{ description: string; remaining: number }>>({
      success: true,
      data: { description, remaining: rateLimit.remaining },
    });
  } catch (err: any) {
    console.error("[AI] Expand task error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "AI request failed." },
      { status: 500 }
    );
  }
}