// src/components/editor/TabBar.tsx
"use client";

import { X, Circle } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { closeTab, setActiveFile } from "@/store/slices/editorSlice";
import { cn } from "@/lib/utils";

export function TabBar() {
  const dispatch     = useAppDispatch();
  const { openTabs, activeFileId } = useAppSelector((s) => s.editor);

  if (openTabs.length === 0) return null;

  return (
    <div className="flex items-center border-b bg-background overflow-x-auto shrink-0">
      {openTabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => dispatch(setActiveFile(tab.id))}
          className={cn(
            "flex items-center gap-2 px-3 py-2 border-r text-sm cursor-pointer shrink-0",
            "hover:bg-accent transition-colors min-w-0 max-w-40",
            activeFileId === tab.id
              ? "bg-background border-b-2 border-b-primary"
              : "bg-muted/30 text-muted-foreground"
          )}
        >
          {/* Dirty indicator */}
          {tab.isDirty && (
            <Circle className="h-2 w-2 fill-primary text-primary shrink-0" />
          )}

          <span className="truncate text-xs">{tab.name}</span>

          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              dispatch(closeTab(tab.id));
            }}
            className="ml-auto p-0.5 rounded hover:bg-muted shrink-0"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}