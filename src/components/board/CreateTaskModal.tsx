// src/components/board/CreateTaskModal.tsx
"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2 } from "lucide-react";
import { useCreateTaskMutation } from "@/store/api/boardApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TaskExpandButton } from "@/components/ai/TaskExpandButton";

interface CreateTaskModalProps {
    workspaceId: string;
    columnId: string;
    open: boolean;
    onClose: () => void;
}

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export function CreateTaskModal({
    workspaceId,
    columnId,
    open,
    onClose,
}: CreateTaskModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDesc] = useState("");
    const [priority, setPriority] = useState<string>("MEDIUM");

    // RTK Query mutation hook — gives us a trigger function + loading state
    const [createTask, { isLoading }] = useCreateTaskMutation();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim()) return;

        try {
            await createTask({
                workspaceId,
                columnId,
                title: title.trim(),
                description: description.trim() || undefined,
                priority,
            }).unwrap();   // .unwrap() throws if the mutation fails

            // Reset and close on success
            setTitle(""); setDesc(""); setPriority("MEDIUM");
            onClose();
        } catch (err) {
            console.error("Failed to create task:", err);
        }
    }

    return (
        <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-xl border shadow-lg p-6">
                    <div className="flex items-center justify-between mb-5">
                        <Dialog.Title className="text-base font-semibold">
                            New task
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="task-title">Title *</Label>
                            <Input
                                id="task-title"
                                placeholder="What needs to be done?"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                autoFocus
                                disabled={isLoading}
                            />
                        </div>

                        <TaskExpandButton
                            title={title}
                            workspaceName="SyncForge"
                            onExpanded={(desc) => setDesc(desc)}
                        />

                        <div className="space-y-1.5">
                            <Label htmlFor="task-desc">Description</Label>
                            <textarea
                                id="task-desc"
                                className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 resize-none"
                                placeholder="Add more details..."
                                value={description}
                                onChange={(e) => setDesc(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Priority</Label>
                            <div className="flex gap-2">
                                {PRIORITIES.map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPriority(p)}
                                        className={`flex-1 py-1.5 text-xs rounded-md border transition-colors font-medium ${priority === p
                                                ? "bg-primary text-white border-primary"
                                                : "border-slate-200 text-slate-600 hover:border-slate-300"
                                            }`}
                                    >
                                        {p.toLowerCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading || !title.trim()}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create task
                            </Button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}