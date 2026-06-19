// src/app/api/ai/refactor/route.ts

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

  const { code, language, instructions } = await req.json();

  if (!code?.trim()) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "No code provided" },
      { status: 400 }
    );
  }

  try {
    const completion = await openai.chat.completions.create({
      model:      "gpt-4o-mini",
      max_tokens: 1200,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Refactor the following ${language || "code"}.
${instructions ? `Instructions: ${instructions}` : "Improve readability, maintainability, and follow best practices."}
Return ONLY the refactored code — no explanation, no markdown fences, just the raw code.

${code}`,
        },
      ],
    });

    const refactored = completion.choices[0]?.message?.content ?? code;

    return NextResponse.json<ApiResponse<{ refactored: string; remaining: number }>>({
      success: true,
      data: { refactored, remaining: rateLimit.remaining },
    });
  } catch (err: any) {
    console.error("[AI] Refactor error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "AI request failed. Please try again." },
      { status: 500 }
    );
  }
}