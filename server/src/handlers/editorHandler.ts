// server/src/handlers/editorHandler.ts

import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Debounce auto-save: fileId → timeout
const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function setupEditorHandler(io: Server, socket: Socket) {

  // User typed in the editor
  socket.on(
    "editor:change",
    (payload: {
      workspaceId: string;
      fileId: string;
      content: string;
      versionId: number;
    }) => {
      const { workspaceId, fileId, content, versionId } = payload;

      // Broadcast to everyone else in the workspace instantly
      // We exclude sender because they already have the content
      socket.to(workspaceId).emit("editor:change", {
        fileId,
        content,
        versionId,
        changedBy: (socket as any).userId,
      });

      // Debounced auto-save — only write to DB after 2s of no changes
      // This prevents hammering the database on every keystroke
      const existingTimer = saveTimers.get(fileId);
      if (existingTimer) clearTimeout(existingTimer);

      const timer = setTimeout(async () => {
        try {
          await prisma.codeFile.update({
            where: { id: fileId },
            data: {
              content,
              updatedAt: new Date(),
            },
          });

          // Record edit in history
          await prisma.fileEdit.create({
            data: {
              fileId,
              userId: (socket as any).userId,
              diff: content.slice(0, 500), // store first 500 chars as snapshot
            },
          });

          console.log(`[Editor] Auto-saved file ${fileId}`);
        } catch (err) {
          console.error("[Editor] Auto-save failed:", err);
        } finally {
          saveTimers.delete(fileId);
        }
      }, 2000);

      saveTimers.set(fileId, timer);
    }
  );

  // User moved cursor
  socket.on(
    "editor:cursor",
    (payload: {
      workspaceId: string;
      fileId: string;
      userId: string;
      userName: string;
      lineNumber: number;
      column: number;
      color: string;
    }) => {
      // Broadcast cursor position to everyone else in the room
      socket.to(payload.workspaceId).emit("editor:cursor", {
        fileId:     payload.fileId,
        userId:     payload.userId,
        userName:   payload.userName,
        lineNumber: payload.lineNumber,
        column:     payload.column,
        color:      payload.color,
      });
    }
  );

  // User opened a file — let others know
  socket.on(
    "editor:file-opened",
    (payload: {
      workspaceId: string;
      fileId: string;
      userId: string;
      userName: string;
    }) => {
      socket.to(payload.workspaceId).emit("editor:file-opened", {
        fileId:   payload.fileId,
        userId:   payload.userId,
        userName: payload.userName,
      });
    }
  );

  // Clean up save timers on disconnect
  socket.on("disconnect", () => {
    saveTimers.forEach((timer, fileId) => {
      clearTimeout(timer);
    });
  });
}