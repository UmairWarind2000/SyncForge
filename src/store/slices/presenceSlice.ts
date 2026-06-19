// src/store/slices/presenceSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface PresenceUser {
  userId: string;
  userName: string;
  userImage: string | null;
}

interface PresenceState {
  onlineUsers: PresenceUser[];
}

const initialState: PresenceState = {
  onlineUsers: [],
};

const presenceSlice = createSlice({
  name: "presence",
  initialState,
  reducers: {
    setPresence(state, action: PayloadAction<PresenceUser[]>) {
      state.onlineUsers = action.payload;
    },
  },
});

export const { setPresence } = presenceSlice.actions;
export default presenceSlice.reducer;