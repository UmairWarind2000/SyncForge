// src/lib/ai.ts

import OpenAI from "openai";

// Singleton OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ─── Simple in-memory rate limiter ───────────────────────────────────────────
// Prevents a single user draining free credits in one session
// In production you'd use Redis, but this works perfectly for a portfolio project

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_MAX      = 20;   // max requests per window
const RATE_LIMIT_WINDOW   = 60 * 60 * 1000; // 1 hour in ms

export function checkRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now    = Date.now();
  const record = rateLimitMap.get(userId);

  // First request or window expired — reset
  if (!record || now > record.resetAt) {
    rateLimitMap.set(userId, {
      count:   1,
      resetAt: now + RATE_LIMIT_WINDOW,
    });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt: now + RATE_LIMIT_WINDOW };
  }

  // Over limit
  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  // Increment counter
  record.count++;
  return {
    allowed:   true,
    remaining: RATE_LIMIT_MAX - record.count,
    resetAt:   record.resetAt,
  };
}

// Shared system prompt — tells the AI about SyncForge context
export const SYSTEM_PROMPT = `You are an AI assistant embedded inside SyncForge, a collaborative development workspace.
You help software developers by explaining code, suggesting refactors, expanding task descriptions, and summarizing sprint progress.
Be concise and practical. Format code blocks with the appropriate language identifier.
Never add unnecessary preamble like "Sure!" or "Of course!" — go straight to the answer.`;