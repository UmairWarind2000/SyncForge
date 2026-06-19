// src/components/ai/TaskExpandButton.tsx
"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface TaskExpandButtonProps {
  title:         string;
  workspaceName: string;
  onExpanded:    (description: string) => void;
}

export function TaskExpandButton({
  title,
  workspaceName,
  onExpanded,
}: TaskExpandButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState("");

  async function handleExpand() {
    if (!title.trim()) return;
    setIsLoading(true);
    setError("");

    try {
      const res  = await fetch("/api/ai/expand-task", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, workspaceName }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error);
        return;
      }
      onExpanded(data.data.description);
    } catch {
      setError("AI request failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleExpand}
        disabled={isLoading || !title.trim()}
        className="flex items-center gap-1.5 text-xs text-primary hover:underline disabled:opacity-40 disabled:no-underline"
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Sparkles className="h-3 w-3" />
        )}
        {isLoading ? "Expanding…" : "Expand with AI"}
      </button>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}