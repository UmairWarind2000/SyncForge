// src/store/index.ts

import { configureStore } from "@reduxjs/toolkit";
import { boardApi }    from "./api/boardApi";
import boardReducer    from "./slices/boardSlice";
import chatReducer     from "./slices/chatSlice";
import presenceReducer from "./slices/presenceSlice";
import editorReducer   from "./slices/editorSlice";

export const store = configureStore({
  reducer: {
    [boardApi.reducerPath]: boardApi.reducer,
    board:    boardReducer,
    chat:     chatReducer,
    presence: presenceReducer,
    editor:   editorReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(boardApi.middleware),
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;