// src/components/board/TaskDetailModal.tsx
"use client";


import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Trash2, Loader2, Calendar, Flag } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { closeTaskDetail } from "@/store/slices/boardSlice";
import { useUpdateTaskMutation, useDeleteTaskMutation } from "@/store/api/boardApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TaskWithRelations } from "@/types";


const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;


const PRIORITY_COLORS: Record<string, string> = {
  LOW:    "text-slate-500",
  MEDIUM: "text-blue-600",
  HIGH:   "text-amber-600",
  URGENT: "text-red-600",
};


interface TaskDetailModalProps {
  task: TaskWithRelations;
  workspaceId: string;
}


export function TaskDetailModal({ task, workspaceId }: TaskDetailModalProps) {
  const dispatch = useAppDispatch();


  // Local form state — pre-filled from task
  const [title, setTitle]           = useState(task.title);
  const [description, setDesc]      = useState(task.description ?? "");
  const [priority, setPriority]     = useState(task.priority);
  const [isDirty, setIsDirty]       = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);


  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();


  // Track whether form has changes
  useEffect(() => {
    const changed =
      title !== task.title ||
      description !== (task.description ?? "") ||
      priority !== task.priority;
    setIsDirty(changed);
  }, [title, description, priority, task]);


  async function handleSave() {
    try {
      await updateTask({
        id: task.id,
        workspaceId,
        title,
        description,
        priority,
      }).unwrap();
      setIsDirty(false);
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  }


  async function handleDelete() {
    try {
      await deleteTask({ id: task.id }).unwrap();
      dispatch(closeTaskDetail());
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  }


  return (
    <Dialog.Root open onOpenChange={(o) => !o && dispatch(closeTaskDetail())}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-white rounded-xl border shadow-lg p-6 max-h-[90vh] overflow-y-auto">


          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-slate-400">
                  in <span className="font-medium text-slate-600">{task.column.name}</span>
                </span>
              </div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-base font-semibold border-none p-0 h-auto focus-visible:ring-0 shadow-none"
              />
            </div>
            <Dialog.Close asChild>
              <button className="text-slate-400 hover:text-slate-600 mt-1">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>


          <div className="space-y-5">
            {/* Priority */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Flag className="h-3.5 w-3.5" />
                Priority
              </Label>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-1.5 text-xs rounded-md border transition-colors font-medium ${
                      priority === p
                        ? "bg-primary text-white border-primary"
                        : "border-slate-200 hover:border-slate-300 " + PRIORITY_COLORS[p]
                    }`}
                  >
                    {p.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>


            {/* Description */}
            <div className="space-y-1.5">
              <Label>Description</Label>
              <textarea
                className="flex min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                placeholder="Add a description..."
                value={description}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>


            {/* Meta info */}
            <div className="rounded-lg bg-slate-50 p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Created by</span>
                <span className="font-medium">{task.creator.name}</span>
              </div>
              {task.assignee && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned to</span>
                  <span className="font-medium">{task.assignee.name}</span>
                </div>
              )}
              {task.dueDate && (
                <div className="flex justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Due date
                  </span>
                  <span className="font-medium">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>


          {/* Footer actions */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            {/* Delete */}
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Sure?</span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  Yes, delete
                </Button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-sm text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>
            )}


            {/* Save */}
            <Button
              onClick={handleSave}
              disabled={!isDirty || isUpdating}
              size="sm"
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}