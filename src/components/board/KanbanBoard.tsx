// src/components/board/KanbanBoard.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { Loader2, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { RootState } from "@/store";
import {
  setBoardData,
  moveTaskOptimistic,
  setActiveDragId,
} from "@/store/slices/boardSlice";
import { useGetBoardDataQuery, useMoveTaskMutation } from "@/store/api/boardApi";
import { useSocket } from "@/hooks/useSocket";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { CreateTaskModal } from "./CreateTaskModal";
import { TaskDetailModal } from "./TaskDetailModal";
import type { TaskWithRelations, ColumnWithTasks } from "@/types";

interface KanbanBoardProps {
  workspaceId: string;
}

export function KanbanBoard({ workspaceId }: KanbanBoardProps) {
  const dispatch                                   = useAppDispatch();
  const { data: session }                          = useSession();
  const { columns, selectedTaskId, activeDragId }  = useAppSelector(
    (s: RootState) => s.board
  );

  const { data: serverColumns, isLoading } = useGetBoardDataQuery(workspaceId);
  const [moveTask]                         = useMoveTaskMutation();
  const { emit }                           = useSocket(workspaceId);

  const [createModalColumnId, setCreateModalColumnId] = useState<string | null>(null);
  const [overId, setOverId]                           = useState<string | null>(null);

  // Sync server data into Redux store when it arrives
  useEffect(() => {
    if (serverColumns) {
      dispatch(setBoardData(serverColumns));
    }
  }, [serverColumns, dispatch]);

  // Require 8px movement before drag starts — prevents accidental drags on click
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Find a task by ID across all columns
  const findTask = useCallback(
    (id: string): TaskWithRelations | undefined => {
      for (const col of columns) {
        const task = col.tasks.find((t: TaskWithRelations) => t.id === id);
        if (task) return task;
      }
    },
    [columns]
  );

  // Find which column a task belongs to
  const findTaskColumn = useCallback(
    (taskId: string): string | undefined => {
      return columns.find((col: ColumnWithTasks) =>
        col.tasks.some((t: TaskWithRelations) => t.id === taskId)
      )?.id;
    },
    [columns]
  );

  function handleDragStart({ active }: DragStartEvent) {
    dispatch(setActiveDragId(active.id as string));
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) {
      setOverId(null);
      return;
    }
    const id           = over.id as string;
    const isOverColumn = columns.some((c: ColumnWithTasks) => c.id === id);
    setOverId(isOverColumn ? id : findTaskColumn(id) ?? null);
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    dispatch(setActiveDragId(null));
    setOverId(null);

    if (!over) return;

    const taskId      = active.id as string;
    const overItemId  = over.id as string;

    const fromColumnId = findTaskColumn(taskId);
    if (!fromColumnId) return;

    const isOverColumn = columns.some((c: ColumnWithTasks) => c.id === overItemId);
    const toColumnId   = isOverColumn
      ? overItemId
      : findTaskColumn(overItemId) ?? fromColumnId;

    const toColumn  = columns.find((c: ColumnWithTasks) => c.id === toColumnId);
    const overIndex = isOverColumn
      ? toColumn!.tasks.length
      : toColumn!.tasks.findIndex((t: TaskWithRelations) => t.id === overItemId);

    const newOrder = overIndex >= 0 ? overIndex : toColumn!.tasks.length;

    // 1. Update Redux state immediately (optimistic)
    dispatch(moveTaskOptimistic({ taskId, fromColumnId, toColumnId, newOrder }));

    // 2. Broadcast to other users via Socket.io
    emit("board:task-moved", {
      workspaceId,
      taskId,
      fromColumnId,
      toColumnId,
      newOrder,
    });

    // 3. Persist to server in background
    try {
      await moveTask({
        taskId,
        columnId: toColumnId,
        order:    newOrder,
        workspaceId,
      }).unwrap();
    } catch (err) {
      console.error("Move failed, refetching board:", err);
    }
  }

  const activeDragTask = activeDragId ? findTask(activeDragId) : null;
  const selectedTask   = selectedTaskId ? findTask(selectedTaskId) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Board header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background shrink-0">
        <h2 className="text-lg font-semibold">Board</h2>
        <button
          onClick={() => setCreateModalColumnId(columns[0]?.id ?? null)}
          className="flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <Plus className="h-4 w-4" />
          Add task
        </button>
      </div>

      {/* Kanban columns */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-5 p-6 h-full min-w-max">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {columns.map((col: ColumnWithTasks) => (
              <KanbanColumn
                key={col.id}
                column={col}
                onAddTask={setCreateModalColumnId}
                isOver={overId === col.id}
              />
            ))}

            <DragOverlay>
              {activeDragTask && (
                <TaskCard task={activeDragTask} isDragOverlay />
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Create task modal */}
      {createModalColumnId && (
        <CreateTaskModal
          workspaceId={workspaceId}
          columnId={createModalColumnId}
          open={!!createModalColumnId}
          onClose={() => setCreateModalColumnId(null)}
        />
      )}

      {/* Task detail modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          workspaceId={workspaceId}
        />
      )}
    </div>
  );
}