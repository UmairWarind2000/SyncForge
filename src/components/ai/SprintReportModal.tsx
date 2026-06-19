// src/components/ai/SprintReportModal.tsx
"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Sparkles, Loader2, Copy, Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SprintReportModalProps {
  workspaceId:   string;
  workspaceName: string;
}

export function SprintReportModal({
  workspaceId,
  workspaceName,
}: SprintReportModalProps) {
  const [open, setOpen]         = useState(false);
  const [report, setReport]     = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]       = useState("");
  const [copied, setCopied]     = useState(false);

  async function handleGenerate() {
    setIsLoading(true);
    setError("");
    setReport("");

    try {
      const res  = await fetch("/api/ai/sprint-report", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error);
        return;
      }
      setReport(data.data.report);
    } catch {
      setError("Request failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          Sprint report
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl bg-background rounded-xl border shadow-lg p-6 max-h-[85vh] flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between mb-5 shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <Dialog.Title className="text-base font-semibold">
                Sprint report — {workspaceName}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {!report && !isLoading && !error && (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Generate sprint report</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    AI will read all your tasks across every column and write a stakeholder-ready summary.
                  </p>
                </div>
                <Button onClick={handleGenerate}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate now
                </Button>
              </div>
            )}

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Reading tasks and writing report…
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive mb-4">
                {error}
              </div>
            )}

            {report && !isLoading && (
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                  {report}
                </pre>
              </div>
            )}
          </div>

          {/* Footer */}
          {report && (
            <div className="flex justify-between items-center pt-4 mt-4 border-t shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={isLoading}
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Regenerate
              </Button>
              <Button size="sm" onClick={handleCopy}>
                {copied ? (
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                ) : (
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                )}
                {copied ? "Copied" : "Copy report"}
              </Button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}