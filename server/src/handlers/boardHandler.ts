// server/src/handlers/boardHandler.ts

import { Server, Socket } from "socket.io";

export function setupBoardHandler(io: Server, socket: Socket) {

  // When a user drags a task, broadcast to all OTHER members of the workspace
  socket.on(
    "board:task-moved",
    (payload: {
      workspaceId: string;
      taskId: string;
      fromColumnId: string;
      toColumnId: string;
      newOrder: number;
    }) => {
      const { workspaceId, ...moveData } = payload;

      // socket.to() sends to everyone in the room EXCEPT the sender
      // The sender already updated their own board optimistically
      socket.to(workspaceId).emit("board:task-moved", {
        ...moveData,
        movedBy: (socket as any).userId || "unknown",
      });
    }
  );

  // Broadcast newly created task to all workspace members
  socket.on(
    "board:task-created",
    (payload: {
      workspaceId: string;
      columnId: string;
      task: {
        id: string;
        title: string;
        priority: string;
        order: number;
        columnId: string;
      };
    }) => {
      // Send to everyone INCLUDING sender so all clients stay in sync
      io.to(payload.workspaceId).emit("board:task-created", payload);
    }
  );
}