// server/src/handlers/chatHandler.ts

import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Track typing state per workspace
// workspaceId → Map of userId → timeout
const typingTimers = new Map<string, Map<string, ReturnType<typeof setTimeout>>>();

export function setupChatHandler(io: Server, socket: Socket) {

  // User sends a chat message
  socket.on(
    "chat:message",
    async (payload: {
      workspaceId: string;
      content: string;
      authorId: string;
      authorName: string;
      authorImage: string | null;
      tempId: string;
    }) => {
      const { workspaceId, content, authorId, authorName, authorImage, tempId } =
        payload;

      if (!content?.trim()) return;

      try {
        // Persist message to Postgres
        const message = await prisma.message.create({
          data: {
            content: content.trim(),
            workspaceId,
            authorId,
          },
        });

        // Broadcast the saved message to everyone in the workspace
        // Including the sender — this replaces their optimistic message with the real one
        io.to(workspaceId).emit("chat:message", {
          id: message.id,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
          authorId,
          authorName,
          authorImage,
          tempId, // client uses this to replace optimistic message
        });

        // Clear typing indicator for this user
        clearTyping(io, workspaceId, authorId, socket);
      } catch (err) {
        console.error("Failed to save message:", err);
      }
    }
  );

  // User started typing
  socket.on(
    "chat:typing",
    (payload: {
      workspaceId: string;
      userId: string;
      userName: string;
    }) => {
      const { workspaceId, userId, userName } = payload;

      // Broadcast to everyone else in the room
      socket.to(workspaceId).emit("chat:typing", { userId, userName });

      // Auto-clear typing indicator after 3s of no activity
      if (!typingTimers.has(workspaceId)) {
        typingTimers.set(workspaceId, new Map());
      }

      const wsTimers = typingTimers.get(workspaceId)!;
      const existing = wsTimers.get(userId);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        socket.to(workspaceId).emit("chat:stop-typing", { userId });
        wsTimers.delete(userId);
      }, 3000);

      wsTimers.set(userId, timer);
    }
  );

  // User stopped typing manually
  socket.on(
    "chat:stop-typing",
    (payload: { workspaceId: string; userId: string }) => {
      const { workspaceId, userId } = payload;
      clearTyping(io, workspaceId, userId, socket);
    }
  );
}

function clearTyping(
  io: Server,
  workspaceId: string,
  userId: string,
  socket: Socket
) {
  const wsTimers = typingTimers.get(workspaceId);
  if (wsTimers) {
    const timer = wsTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      wsTimers.delete(userId);
    }
  }
  socket.to(workspaceId).emit("chat:stop-typing", { userId });
}