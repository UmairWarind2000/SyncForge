// src/app/(auth)/login/page.tsx
import { LoginForm } from "@/components/auth/LoginForm";
import { Suspense } from "react";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--color-background)" }}
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}