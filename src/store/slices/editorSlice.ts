// src/store/slices/editorSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Assign a deterministic color to each user
const USER_COLORS = [
  "#6366f1", "#ec4899", "#f97316",
  "#14b8a6", "#8b5cf6", "#22c55e",
  "#ef4444", "#3b82f6",
];

export function getUserColor(userId: string): string {
  // Hash userId to get consistent color assignment
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

interface RemoteCursor {
  userId:     string;
  userName:   string;
  lineNumber: number;
  column:     number;
  color:      string;
}

interface FileTab {
  id:       string;
  name:     string;
  path:     string;
  language: string;
  content:  string;
  isDirty:  boolean; // true if unsaved local changes
}

interface EditorState {
  // Files listed in the file tree
  files: Array<{
    id:       string;
    name:     string;
    path:     string;
    language: string;
  }>;
  // Open file tabs
  openTabs: FileTab[];
  // Currently active tab
  activeFileId: string | null;
  // Remote cursors: fileId → array of cursor positions
  remoteCursors: Record<string, RemoteCursor[]>;
  // Users currently viewing each file: fileId → userIds
  fileViewers: Record<string, string[]>;
}

const initialState: EditorState = {
  files:         [],
  openTabs:      [],
  activeFileId:  null,
  remoteCursors: {},
  fileViewers:   {},
};

const editorSlice = createSlice({
  name: "editor",
  initialState,
  reducers: {

    // Set file list from API
    setFiles(
      state,
      action: PayloadAction<EditorState["files"]>
    ) {
      state.files = action.payload;
    },

    // Open a file in a tab
    openFile(state, action: PayloadAction<FileTab>) {
      const existing = state.openTabs.find((t) => t.id === action.payload.id);
      if (!existing) {
        state.openTabs.push(action.payload);
      }
      state.activeFileId = action.payload.id;
    },

    // Close a tab
    closeTab(state, action: PayloadAction<string>) {
      const idx = state.openTabs.findIndex((t) => t.id === action.payload);
      state.openTabs = state.openTabs.filter((t) => t.id !== action.payload);

      if (state.activeFileId === action.payload) {
        // Activate adjacent tab after closing
        const nextTab = state.openTabs[Math.max(0, idx - 1)];
        state.activeFileId = nextTab?.id ?? null;
      }
    },

    // Set active tab
    setActiveFile(state, action: PayloadAction<string>) {
      state.activeFileId = action.payload;
    },

    // Update local content (user is typing)
    updateLocalContent(
      state,
      action: PayloadAction<{ fileId: string; content: string }>
    ) {
      const tab = state.openTabs.find((t) => t.id === action.payload.fileId);
      if (tab) {
        tab.content  = action.payload.content;
        tab.isDirty  = true;
      }
    },

    // Apply remote content change (from another user via socket)
    applyRemoteChange(
      state,
      action: PayloadAction<{ fileId: string; content: string }>
    ) {
      const tab = state.openTabs.find((t) => t.id === action.payload.fileId);
      if (tab) {
        tab.content = action.payload.content;
        // Don't mark as dirty — this is already synced
        tab.isDirty = false;
      }
    },

    // Mark file as saved
    markSaved(state, action: PayloadAction<string>) {
      const tab = state.openTabs.find((t) => t.id === action.payload);
      if (tab) tab.isDirty = false;
    },

    // Update remote cursor position
    updateRemoteCursor(
      state,
      action: PayloadAction<{
        fileId: string;
        cursor: RemoteCursor;
      }>
    ) {
      const { fileId, cursor } = action.payload;
      if (!state.remoteCursors[fileId]) {
        state.remoteCursors[fileId] = [];
      }
      // Replace existing cursor for this user or add new one
      const idx = state.remoteCursors[fileId].findIndex(
        (c) => c.userId === cursor.userId
      );
      if (idx >= 0) {
        state.remoteCursors[fileId][idx] = cursor;
      } else {
        state.remoteCursors[fileId].push(cursor);
      }
    },

    // Remove cursor when user leaves
    removeRemoteCursor(
      state,
      action: PayloadAction<{ fileId: string; userId: string }>
    ) {
      const { fileId, userId } = action.payload;
      if (state.remoteCursors[fileId]) {
        state.remoteCursors[fileId] = state.remoteCursors[fileId].filter(
          (c) => c.userId !== userId
        );
      }
    },

    // Add a new file to the file list
    addFile(
      state,
      action: PayloadAction<EditorState["files"][0]>
    ) {
      state.files.push(action.payload);
    },

    // Remove a file from list and close its tab
    removeFile(state, action: PayloadAction<string>) {
      state.files    = state.files.filter((f) => f.id !== action.payload);
      state.openTabs = state.openTabs.filter((t) => t.id !== action.payload);
      if (state.activeFileId === action.payload) {
        state.activeFileId = state.openTabs[0]?.id ?? null;
      }
    },
  },
});

export const {
  setFiles,
  openFile,
  closeTab,
  setActiveFile,
  updateLocalContent,
  applyRemoteChange,
  markSaved,
  updateRemoteCursor,
  removeRemoteCursor,
  addFile,
  removeFile,
} = editorSlice.actions;

export default editorSlice.reducer;