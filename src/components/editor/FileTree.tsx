// src/components/editor/FileTree.tsx
"use client";

import { useState } from "react";
import { File, FilePlus, Trash2, ChevronRight } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openFile, removeFile } from "@/store/slices/editorSlice";
import { cn } from "@/lib/utils";

interface FileTreeProps {
  workspaceId: string;
  onFileSelect: (fileId: string) => void;
}

export function FileTree({ workspaceId, onFileSelect }: FileTreeProps) {
  const dispatch  = useAppDispatch();
  const { files, activeFileId } = useAppSelector((s) => s.editor);

  const [showNewFile, setShowNewFile]   = useState(false);
  const [newFileName, setNewFileName]   = useState("");
  const [isCreating, setIsCreating]     = useState(false);
  const [contextMenu, setContextMenu]   = useState<{
    fileId: string;
    x: number;
    y: number;
  } | null>(null);

  async function handleCreateFile(e: React.FormEvent) {
    e.preventDefault();
    if (!newFileName.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/files", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          name: newFileName.trim(),
          path: newFileName.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        dispatch(
          openFile({
            id:       data.data.id,
            name:     data.data.name,
            path:     data.data.path,
            language: data.data.language,
            content:  data.data.content,
            isDirty:  false,
          })
        );
        onFileSelect(data.data.id);
      }
    } finally {
      setIsCreating(false);
      setShowNewFile(false);
      setNewFileName("");
    }
  }

  async function handleDeleteFile(fileId: string) {
    setContextMenu(null);
    try {
      await fetch(`/api/files/${fileId}`, { method: "DELETE" });
      dispatch(removeFile(fileId));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  return (
    <div
      className="w-56 shrink-0 border-r bg-background flex flex-col h-full"
      onClick={() => setContextMenu(null)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Files
        </span>
        <button
          onClick={() => setShowNewFile(true)}
          className="p-1 rounded hover:bg-accent transition-colors"
          title="New file"
        >
          <FilePlus className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* New file input */}
      {showNewFile && (
        <form onSubmit={handleCreateFile} className="px-2 py-1.5 border-b">
          <input
            autoFocus
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setShowNewFile(false)}
            placeholder="filename.ts"
            className="w-full text-xs px-2 py-1 rounded border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={isCreating}
          />
        </form>
      )}

      {/* File list */}
      <div className="flex-1 overflow-y-auto py-1">
        {files.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8 px-3">
            No files yet. Click + to create one.
          </p>
        )}

        {files.map((file) => (
          <button
            key={file.id}
            onClick={() => onFileSelect(file.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({ fileId: file.id, x: e.clientX, y: e.clientY });
            }}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors",
              "hover:bg-accent",
              activeFileId === file.id
                ? "bg-primary/10 text-primary"
                : "text-foreground"
            )}
          >
            <File className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-xs">{file.name}</span>
          </button>
        ))}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-background border rounded-md shadow-md py-1 min-w-32"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={() => handleDeleteFile(contextMenu.fileId)}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete file
          </button>
        </div>
      )}
    </div>
  );
}