// src/store/slices/chatSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorImage: string | null;
  tempId?: string;      // present on optimistic messages
  isPending?: boolean;  // true while waiting for server confirmation
}

interface ChatState {
  // workspaceId → messages array
  messages: Record<string, ChatMessage[]>;
  // userId → userName (for typing indicator)
  typingUsers: Record<string, string>;
}

const initialState: ChatState = {
  messages: {},
  typingUsers: {},
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {

    // Set initial messages loaded from API
    setMessages(
      state,
      action: PayloadAction<{ workspaceId: string; messages: ChatMessage[] }>
    ) {
      state.messages[action.payload.workspaceId] = action.payload.messages;
    },

    // Add a message — handles both optimistic and real messages
    addMessage(state, action: PayloadAction<ChatMessage>) {
      const msg = action.payload;
      const workspaceId = findWorkspaceForMessage(state, msg);

      // If this is a server confirmation of an optimistic message, replace it
      if (msg.tempId) {
        Object.keys(state.messages).forEach((wsId) => {
          const idx = state.messages[wsId].findIndex(
            (m) => m.tempId === msg.tempId && m.isPending
          );
          if (idx !== -1) {
            state.messages[wsId][idx] = { ...msg, isPending: false };
            return;
          }
        });
        return;
      }

      // Otherwise just append
      if (workspaceId && state.messages[workspaceId]) {
        state.messages[workspaceId].push(msg);
      }
    },

    // Add an optimistic message (before server confirms)
    addOptimisticMessage(
      state,
      action: PayloadAction<{ workspaceId: string; message: ChatMessage }>
    ) {
      const { workspaceId, message } = action.payload;
      if (!state.messages[workspaceId]) {
        state.messages[workspaceId] = [];
      }
      state.messages[workspaceId].push({ ...message, isPending: true });
    },

    // Update typing indicators
    setTypingUsers(
      state,
      action: PayloadAction<{
        userId: string;
        userName: string;
        isTyping: boolean;
      }>
    ) {
      const { userId, userName, isTyping } = action.payload;
      if (isTyping) {
        state.typingUsers[userId] = userName;
      } else {
        delete state.typingUsers[userId];
      }
    },
  },
});

// Helper — find which workspace a received message belongs to
function findWorkspaceForMessage(
  state: ChatState,
  msg: ChatMessage
): string | undefined {
  return Object.keys(state.messages).find((wsId) =>
    state.messages[wsId].some((m) => m.authorId === msg.authorId)
  );
}

export const { setMessages, addMessage, addOptimisticMessage, setTypingUsers } =
  chatSlice.actions;

export default chatSlice.reducer;