// src/app/api/auth/[...nextauth]/route.ts

import { handlers } from "@/lib/auth";

// NextAuth v5 exports GET and POST handlers directly
export const { GET, POST } = handlers;