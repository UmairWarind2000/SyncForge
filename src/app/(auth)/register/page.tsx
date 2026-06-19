// src/app/(auth)/register/page.tsx
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--color-background)" }}
    >
      <RegisterForm />
    </div>
  );
}