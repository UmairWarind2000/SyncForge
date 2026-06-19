// src/components/auth/LoginForm.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";

export function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [isLoading, setIsLoading]       = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    setIsLoading(false);
    if (result?.error) { setError("Invalid email or password"); return; }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm mx-auto px-4">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold mb-4"
          style={{ background: "var(--color-accent)" }}
        >
          SF
        </div>
        <h1 className="text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Welcome back
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
          Sign in to your workspace
        </p>
      </div>

      {/* GitHub */}
      <Button
        variant="outline"
        className="w-full mb-4"
        onClick={() => { setIsGithubLoading(true); signIn("github", { callbackUrl }); }}
        disabled={isGithubLoading || isLoading}
      >
        {isGithubLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
        )}
        Continue with GitHub
      </Button>

      {/* Divider */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full" style={{ borderTop: "1px solid var(--color-border)" }} />
        </div>
        <div className="relative flex justify-center">
          <span
            className="px-3 text-xs"
            style={{ background: "var(--color-background)", color: "var(--color-text-muted)" }}
          >
            or continue with email
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="rounded-lg px-3 py-2.5 text-sm mb-4"
          style={{ background: "var(--color-danger-muted)", color: "var(--color-danger)" }}
        >
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email" type="email" placeholder="you@example.com"
            value={email} onChange={(e) => setEmail(e.target.value)}
            required disabled={isLoading}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password" type="password" placeholder="••••••••"
            value={password} onChange={(e) => setPassword(e.target.value)}
            required disabled={isLoading}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm mt-6" style={{ color: "var(--color-text-secondary)" }}>
        No account?{" "}
        <Link href="/register" className="font-medium" style={{ color: "var(--color-accent)" }}>
          Create one
        </Link>
      </p>
    </div>
  );
}