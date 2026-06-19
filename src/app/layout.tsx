// src/app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ReduxProvider } from "@/components/providers/ReduxProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "SyncForge", template: "%s | SyncForge" },
  description: "Real-time collaborative development workspace.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ReduxProvider>
          <SessionProvider>{children}</SessionProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}