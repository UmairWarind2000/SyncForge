// src/hooks/useSocket.ts
"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import { useAppDispatch } from "@/store/hooks";
import { moveTaskOptimistic, setBoardData } from "@/store/slices/boardSlice";
import { addMessage, setTypingUsers } from "@/store/slices/chatSlice";
import { setPresence } from "@/store/slices/presenceSlice";
import {
    applyRemoteChange,
    updateRemoteCursor,
} from "@/store/slices/editorSlice";
import { boardApi } from "@/store/api/boardApi";

const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

// Singleton socket — one connection shared across the entire app
let socketInstance: Socket | null = null;

export function useSocket(workspaceId: string) {
    const { data: session } = useSession();
    const dispatch = useAppDispatch();
    const socketRef = useRef<Socket | null>(null);

    const connect = useCallback(() => {
        if (!session?.user || socketInstance?.connected) return;

        // Create socket with user auth data in handshake
        socketInstance = io(SOCKET_URL, {
            auth: {
                userId: session.user.id,
                userName: session.user.name,
                userImage: session.user.image,
            },
            // Reconnect automatically with exponential backoff
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        socketRef.current = socketInstance;

        // ── Connection lifecycle ──────────────────────────────────────────────

        socketInstance.on("connect", () => {
            console.log("[Socket] Connected:", socketInstance?.id);
            // Join the workspace room immediately on connect
            socketInstance?.emit("workspace:join", {
                workspaceId,
                userId: session.user.id,
            });
        });

        socketInstance.on("disconnect", (reason) => {
            console.log("[Socket] Disconnected:", reason);
        });

        socketInstance.on("connect_error", (err) => {
            console.error("[Socket] Connection error:", err.message);
        });

        // ── Board events ──────────────────────────────────────────────────────

        // Someone else moved a task — update our Redux state
        socketInstance.on("board:task-moved", (payload) => {
            dispatch(
                moveTaskOptimistic({
                    taskId: payload.taskId,
                    fromColumnId: payload.fromColumnId,
                    toColumnId: payload.toColumnId,
                    newOrder: payload.newOrder,
                })
            );
        });

        // Someone created a new task — refetch board to get it
        socketInstance.on("board:task-created", () => {
            dispatch(boardApi.util.invalidateTags(["Board"]));
        });

        // ── Editor events ─────────────────────────────────────────────────

        socketInstance.on("editor:change", (payload) => {
            dispatch(
                applyRemoteChange({
                    fileId: payload.fileId,
                    content: payload.content,
                })
            );
        });

        socketInstance.on("editor:cursor", (payload) => {
            dispatch(
                updateRemoteCursor({
                    fileId: payload.fileId,
                    cursor: {
                        userId: payload.userId,
                        userName: payload.userName,
                        lineNumber: payload.lineNumber,
                        column: payload.column,
                        color: payload.color,
                    },
                })
            );
        });

        // ── Chat events ───────────────────────────────────────────────────────

        socketInstance.on("chat:message", (payload) => {
            dispatch(addMessage(payload));
        });

        socketInstance.on("chat:typing", (payload) => {
            dispatch(
                setTypingUsers({ userId: payload.userId, userName: payload.userName, isTyping: true })
            );
        });

        socketInstance.on("chat:stop-typing", (payload) => {
            dispatch(
                setTypingUsers({ userId: payload.userId, userName: "", isTyping: false })
            );
        });

        // ── Presence events ───────────────────────────────────────────────────

        socketInstance.on("presence:update", (payload) => {
            dispatch(setPresence(payload.users));
        });
    }, [session, workspaceId, dispatch]);

    useEffect(() => {
        connect();

        return () => {
            // Leave the room but keep the socket alive (user might navigate to another workspace)
            socketInstance?.emit("workspace:leave", { workspaceId });
        };
    }, [connect, workspaceId]);

    // Expose emit helper so components can send events
    const emit = useCallback(
        <T>(event: string, payload: T) => {
            socketInstance?.emit(event, payload);
        },
        []
    );

    return { socket: socketRef.current, emit, isConnected: socketInstance?.connected };
}