// src/components/workspace/CreateWorkspaceModal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { WORKSPACE_COLORS } from "@/lib/design";

export function CreateWorkspaceModal() {
  const router = useRouter();
  const [open, setOpen]         = useState(false);
  const [name, setName]         = useState("");
  const [description, setDesc]  = useState("");
  const [color, setColor]       = useState(WORKSPACE_COLORS[0]);
  const [error, setError]       = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const res  = await fetch("/api/workspaces", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, color }),
    });
    const data = await res.json();
    setIsLoading(false);
    if (!data.success) { setError(data.error); return; }
    setOpen(false);
    setName(""); setDesc(""); setColor(WORKSPACE_COLORS[0]);
    router.refresh();
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button size="sm">
          <Plus className="h-3.5 w-3.5" />
          New workspace
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100vw-2rem)] max-w-md rounded-2xl p-6"
          style={{
            background: "var(--color-surface)",
            border:     "1px solid var(--color-border)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
              New workspace
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="rounded-lg p-1 transition-colors"
                style={{ color: "var(--color-text-muted)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--color-surface-2)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {error && (
            <div
              className="rounded-lg px-3 py-2.5 text-sm mb-4"
              style={{ background: "var(--color-danger-muted)", color: "var(--color-danger)" }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ws-name">Name *</Label>
              <Input
                id="ws-name" placeholder="My project"
                value={name} onChange={(e) => setName(e.target.value)}
                required minLength={2} disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ws-desc">Description</Label>
              <Input
                id="ws-desc" placeholder="What is this workspace for?"
                value={description} onChange={(e) => setDesc(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {WORKSPACE_COLORS.map((c) => (
                  <button
                    key={c} type="button"
                    onClick={() => setColor(c)}
                    className="h-6 w-6 rounded-full transition-transform hover:scale-110"
                    style={{
                      background:  c,
                      outline:     color === c ? `2px solid ${c}` : "none",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" size="sm" disabled={isLoading}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" size="sm" disabled={isLoading || !name.trim()}>
                {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}