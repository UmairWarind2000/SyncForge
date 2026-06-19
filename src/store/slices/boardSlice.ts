// src/store/slices/boardSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { ColumnWithTasks, TaskWithRelations } from "@/types";

interface BoardState {
  // Optimistic board data — updated immediately on drag before server confirms
  columns: ColumnWithTasks[];
  // ID of task whose detail modal is currently open
  selectedTaskId: string | null;
  // ID of item currently being dragged (for visual feedback)
  activeDragId: string | null;
  // Whether the board has been initialized from server data
  initialized: boolean;
}

const initialState: BoardState = {
  columns: [],
  selectedTaskId: null,
  activeDragId: null,
  initialized: false,
};

const boardSlice = createSlice({
  name: "board",
  initialState,
  reducers: {

    // Called when RTK Query returns data — initialize local state
    setBoardData(state, action: PayloadAction<ColumnWithTasks[]>) {
      state.columns = action.payload;
      state.initialized = true;
    },

    // Optimistic task move — update local state immediately
    // Server call happens in parallel; if it fails we refetch
    moveTaskOptimistic(
      state,
      action: PayloadAction<{
        taskId: string;
        fromColumnId: string;
        toColumnId: string;
        newOrder: number;
      }>
    ) {
      const { taskId, fromColumnId, toColumnId, newOrder } = action.payload;

      // Find source column and task
      const fromCol = state.columns.find((c) => c.id === fromColumnId);
      const task = fromCol?.tasks.find((t) => t.id === taskId);
      if (!fromCol || !task) return;

      // Remove from source column
      fromCol.tasks = fromCol.tasks.filter((t) => t.id !== taskId);

      // Find destination column
      const toCol = state.columns.find((c) => c.id === toColumnId);
      if (!toCol) return;

      // Insert at new position
      const updatedTask = { ...task, columnId: toColumnId, order: newOrder };
      toCol.tasks.splice(newOrder, 0, updatedTask);

      // Re-number orders to keep them sequential
      toCol.tasks = toCol.tasks.map((t, i) => ({ ...t, order: i }));
      fromCol.tasks = fromCol.tasks.map((t, i) => ({ ...t, order: i }));
    },

    // Open task detail modal
    openTaskDetail(state, action: PayloadAction<string>) {
      state.selectedTaskId = action.payload;
    },

    // Close task detail modal
    closeTaskDetail(state) {
      state.selectedTaskId = null;
    },

    // Track what's being dragged (for DragOverlay styling)
    setActiveDragId(state, action: PayloadAction<string | null>) {
      state.activeDragId = action.payload;
    },
  },
});

export const {
  setBoardData,
  moveTaskOptimistic,
  openTaskDetail,
  closeTaskDetail,
  setActiveDragId,
} = boardSlice.actions;

export default boardSlice.reducer;