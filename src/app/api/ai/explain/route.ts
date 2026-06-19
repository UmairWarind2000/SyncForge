// src/app/api/ai/explain/route.ts

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

  // Check rate limit before hitting OpenAI
  const rateLimit = checkRateLimit(session.user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: `Rate limit reached. Resets in ${Math.ceil((rateLimit.resetAt - Date.now()) / 60000)} minutes.` },
      { status: 429 }
    );
  }

  const { code, language, fileName } = await req.json();

  if (!code?.trim()) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "No code provided" },
      { status: 400 }
    );
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",   // fast and cheap — perfect for explanations
      max_tokens: 600,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Explain the following ${language || "code"} from the file "${fileName || "unknown"}".
Be concise — 3-5 sentences maximum unless the code is complex. Focus on what it does and why, not just how.

\`\`\`${language || ""}
${code}
\`\`\``,
        },
      ],
    });

    const explanation = completion.choices[0]?.message?.content ?? "No explanation generated.";

    return NextResponse.json<ApiResponse<{ explanation: string; remaining: number }>>({
      success: true,
      data: {
        explanation,
        remaining: rateLimit.remaining,
      },
    });
  } catch (err: any) {
    console.error("[AI] Explain error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "AI request failed. Please try again." },
      { status: 500 }
    );
  }
}