// src/components/board/TaskCard.tsx
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, AlertCircle } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { openTaskDetail } from "@/store/slices/boardSlice";
import { formatDate, cn } from "@/lib/utils";
import { PRIORITY_CONFIG } from "@/lib/design";
import { UserAvatar } from "@/components/layout/UserAvatar";
import type { TaskWithRelations } from "@/types";

interface TaskCardProps {
  task: TaskWithRelations;
  isDragOverlay?: boolean;
}

export function TaskCard({ task, isDragOverlay = false }: TaskCardProps) {
  const dispatch = useAppDispatch();
  const priority = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: task.id, data: { type: "task", task } });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background:  isDragging ? "var(--color-surface-3)" : "var(--color-surface-2)",
        border:      `1px solid ${isDragging ? "var(--color-accent-border)" : "var(--color-border)"}`,
        opacity:     isDragging ? 0.5 : 1,
        transform:   isDragOverlay ? `${CSS.Transform.toString(transform)} rotate(1.5deg)` : CSS.Transform.toString(transform) ?? undefined,
      }}
      className={cn(
        "rounded-xl p-3 cursor-grab active:cursor-grabbing select-none transition-colors",
        !isDragging && "hover:border-[var(--color-border-subtle)]",
        isDragOverlay && "shadow-2xl"
      )}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation();
          dispatch(openTaskDetail(task.id));
        }
      }}
    >
      {/* Priority dot + title */}
      <div className="flex items-start gap-2 mb-2">
        <div
          className="h-1.5 w-1.5 rounded-full mt-1.5 shrink-0"
          style={{ background: priority?.color ?? "#888" }}
        />
        <p
          className="text-sm font-medium leading-snug flex-1 min-w-0"
          style={{ color: "var(--color-text-primary)" }}
        >
          {task.title}
        </p>
        {task.priority === "URGENT" && (
          <AlertCircle className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-urgent)" }} />
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p
          className="text-xs line-clamp-2 mb-2 ml-3.5"
          style={{ color: "var(--color-text-muted)" }}
        >
          {task.description}
        </p>
      )}

      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2 ml-3.5">
          {task.labels.map((label) => (
            <span
              key={label.id}
              className="text-xs px-1.5 py-0.5 rounded-md font-medium"
              style={{
                background: label.color + "22",
                color:      label.color,
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 ml-3.5">
        <div className="flex items-center gap-2">
          {/* Priority badge */}
          <span
            className="text-xs px-1.5 py-0.5 rounded-md font-medium"
            style={{
              background: priority?.bg ?? "var(--color-surface-3)",
              color:      priority?.color ?? "var(--color-text-muted)",
            }}
          >
            {priority?.label ?? task.priority.toLowerCase()}
          </span>

          {task.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" style={{ color: "var(--color-text-muted)" }} />
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {formatDate(task.dueDate)}
              </span>
            </div>
          )}
        </div>

        {task.assignee && (
          <UserAvatar
            name={task.assignee.name}
            image={task.assignee.image}
            size="xs"
          />
        )}
      </div>
    </div>
  );
}