// src/app/page.tsx

import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Code2, Users, Zap, ArrowRight, GitBranch } from "lucide-react";

export default async function LandingPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      {/* Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 sm:px-8"
        style={{
          borderBottom: "1px solid var(--color-border-subtle)",
          background:   "rgba(10,10,10,0.8)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
            style={{ background: "var(--color-accent)" }}
          >
            SF
          </div>
          <span className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>
            SyncForge
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <main className="pt-32 pb-20 px-4 sm:px-8 max-w-5xl mx-auto">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <span
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
            style={{
              background: "var(--color-accent-muted)",
              color:      "var(--color-accent)",
              border:     "1px solid var(--color-accent-border)",
            }}
          >
            <GitBranch className="h-3 w-3" />
            Built for modern dev teams
          </span>
        </div>

        {/* Headline */}
        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-center leading-tight mb-6"
          style={{ color: "var(--color-text-primary)" }}
        >
          Where teams{" "}
          <span style={{ color: "var(--color-accent)" }}>build together</span>
        </h1>

        <p
          className="text-base sm:text-lg text-center max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Real-time code editing, live Kanban boards, and an AI pair programmer
          — all in one workspace. No more context switching.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-24">
          <Button size="lg" asChild>
            <Link href="/register" className="flex items-center gap-2">
              Start building free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon:  Code2,
              title: "Live code editor",
              desc:  "Monaco editor with real-time multi-cursor sync. See teammates' cursors as they type.",
            },
            {
              icon:  Users,
              title: "Kanban board",
              desc:  "Drag tasks between columns. Updates broadcast to every teammate instantly.",
            },
            {
              icon:  Zap,
              title: "AI assistant",
              desc:  "Explain, refactor, and generate code. AI that understands your project context.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl p-5 group"
              style={{
                background: "var(--color-surface)",
                border:     "1px solid var(--color-border)",
              }}
            >
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center mb-4"
                style={{
                  background: "var(--color-accent-muted)",
                  border:     "1px solid var(--color-accent-border)",
                }}
              >
                <Icon className="h-4 w-4" style={{ color: "var(--color-accent)" }} />
              </div>
              <h3 className="font-medium mb-2 text-sm" style={{ color: "var(--color-text-primary)" }}>
                {title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}