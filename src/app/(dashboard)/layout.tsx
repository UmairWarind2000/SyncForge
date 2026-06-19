// src/app/(dashboard)/layout.tsx

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/layout/TopNav";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "var(--color-background)" }}
    >
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main
          className="flex-1 overflow-auto"
          style={{ background: "var(--color-background)" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}