// src/app/api/auth/register/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  // Validate all fields
  if (!name || !email || !password) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "All fields are required" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  // Check email not already registered
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (existing) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  // Hash password with bcrypt (cost factor 12 = secure but not too slow)
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  return NextResponse.json<ApiResponse<typeof user>>(
    { success: true, data: user },
    { status: 201 }
  );
}