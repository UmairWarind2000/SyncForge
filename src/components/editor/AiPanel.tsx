// src/components/editor/AiPanel.tsx
"use client";

import { useState } from "react";
import { Sparkles, X, Loader2, Copy, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AiMode = "explain" | "refactor";

interface AiPanelProps {
  selectedCode:  string;
  language:      string;
  fileName:      string;
  workspaceId:   string;
  onInsertCode:  (code: string) => void;  // called when user accepts refactored code
  onClose:       () => void;
}

export function AiPanel({
  selectedCode,
  language,
  fileName,
  workspaceId,
  onInsertCode,
  onClose,
}: AiPanelProps) {
  const [mode, setMode]               = useState<AiMode>("explain");
  const [result, setResult]           = useState<string>("");
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState("");
  const [copied, setCopied]           = useState(false);
  const [instructions, setInstructions] = useState("");

  async function handleExplain() {
    setIsLoading(true);
    setError("");
    setResult("");
    setMode("explain");

    try {
      const res  = await fetch("/api/ai/explain", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: selectedCode, language, fileName }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error);
        return;
      }
      setResult(data.data.explanation);
    } catch {
      setError("Request failed. Check your connection.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefactor() {
    setIsLoading(true);
    setError("");
    setResult("");
    setMode("refactor");

    try {
      const res  = await fetch("/api/ai/refactor", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: selectedCode, language, instructions }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error);
        return;
      }
      setResult(data.data.refactored);
    } catch {
      setError("Request failed.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="w-80 shrink-0 border-l bg-background flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">AI assistant</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Selected code preview */}
      <div className="px-4 py-3 border-b shrink-0">
        <p className="text-xs text-muted-foreground mb-2">Selected code</p>
        <pre className="text-xs bg-muted rounded-md p-2 overflow-x-auto max-h-24 overflow-y-auto">
          <code>{selectedCode || "No code selected — select code in the editor first."}</code>
        </pre>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-b shrink-0 space-y-2">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={handleExplain}
            disabled={isLoading || !selectedCode.trim()}
          >
            {isLoading && mode === "explain" ? (
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-3 w-3" />
            )}
            Explain
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={handleRefactor}
            disabled={isLoading || !selectedCode.trim()}
          >
            {isLoading && mode === "refactor" ? (
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
            ) : (
              <RotateCcw className="mr-1.5 h-3 w-3" />
            )}
            Refactor
          </Button>
        </div>

        {/* Optional refactor instructions */}
        <input
          type="text"
          placeholder="Refactor instructions (optional)..."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="w-full text-xs px-2 py-1.5 rounded border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Result area */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive mb-3">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Thinking…</span>
          </div>
        )}

        {result && !isLoading && (
          <div className="space-y-3">
            {/* Result text */}
            <div
              className={cn(
                "text-sm leading-relaxed whitespace-pre-wrap",
                mode === "refactor" && "font-mono text-xs bg-muted rounded-md p-3"
              )}
            >
              {result}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="mr-1.5 h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="mr-1.5 h-3 w-3" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>

              {/* Only show Insert for refactor results */}
              {mode === "refactor" && (
                <Button
                  size="sm"
                  className="text-xs"
                  onClick={() => onInsertCode(result)}
                >
                  Insert into editor
                </Button>
              )}
            </div>
          </div>
        )}

        {!result && !isLoading && !error && (
          <p className="text-xs text-muted-foreground">
            Select code in the editor then click Explain or Refactor.
          </p>
        )}
      </div>
    </div>
  );
}