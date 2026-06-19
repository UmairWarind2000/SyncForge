// src/components/board/KanbanColumn.tsx
"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";
import type { ColumnWithTasks } from "@/types";

interface KanbanColumnProps {
  column:    ColumnWithTasks;
  onAddTask: (columnId: string) => void;
  isOver?:   boolean;
}

export function KanbanColumn({ column, onAddTask, isOver }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id:   column.id,
    data: { type: "column", column },
  });

  const taskIds = column.tasks.map((t) => t.id);

  return (
    <div className="flex flex-col w-64 sm:w-72 shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ background: column.color }}
          />
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {column.name}
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-md font-medium"
            style={{
              background: "var(--color-surface-3)",
              color:      "var(--color-text-muted)",
            }}
          >
            {column.tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(column.id)}
          className="p-1 rounded-md transition-colors"
          style={{ color: "var(--color-text-muted)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--color-surface-2)";
            (e.currentTarget as HTMLElement).style.color = "var(--color-text-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)";
          }}
          title="Add task"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-col gap-2 min-h-24 rounded-xl p-2 transition-all duration-150"
        )}
        style={{
          background: isOver ? "var(--color-accent-muted)" : "var(--color-surface-2)",
          border:     isOver
            ? "1px dashed var(--color-accent-border)"
            : "1px solid var(--color-border-subtle)",
        }}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {column.tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Drop tasks here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}