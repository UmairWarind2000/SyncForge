// server/src/handlers/presenceHandler.ts

import { Server, Socket } from "socket.io";

// Type for user presence entry
type PresenceEntry = {
  socketId: string;
  userId: string;
  userName: string;
  userImage: string | null;
};

// In-memory presence store
// workspaceId → Set of { socketId, userId, userName, userImage }
const workspacePresence = new Map<string, Set<PresenceEntry>>();

export function setupPresenceHandler(io: Server, socket: Socket) {

  // When user joins a workspace room
  socket.on(
    "workspace:join",
    ({ workspaceId, userId }: { workspaceId: string; userId: string }) => {
      // Add to Socket.io room
      socket.join(workspaceId);

      // Store workspace context on socket for cleanup on disconnect
      (socket as any).workspaceId = workspaceId;
      (socket as any).userId = userId;
      (socket as any).userName = (socket as any).userName || "Unknown";
      (socket as any).userImage = (socket as any).userImage || null;

      // Add to presence map
      if (!workspacePresence.has(workspaceId)) {
        workspacePresence.set(workspaceId, new Set());
      }

      const presence = workspacePresence.get(workspaceId)!;

      // Remove any stale entry for this user (reconnect case)
      presence.forEach((entry: PresenceEntry) => {
        if (entry.userId === userId) presence.delete(entry);
      });

      presence.add({
        socketId: socket.id,
        userId,
        userName: (socket as any).userName,
        userImage: (socket as any).userImage,
      });

      // Broadcast updated presence list to everyone in the room
      broadcastPresence(io, workspaceId);
    }
  );

  // When user explicitly leaves a workspace
  socket.on("workspace:leave", ({ workspaceId }: { workspaceId: string }) => {
    socket.leave(workspaceId);
    removeFromPresence(socket.id, workspaceId);
    broadcastPresence(io, workspaceId);
  });

  // On disconnect, clean up all presence for this socket
  socket.on("disconnect", () => {
    const workspaceId = (socket as any).workspaceId;
    if (workspaceId) {
      removeFromPresence(socket.id, workspaceId);
      broadcastPresence(io, workspaceId);
    }
  });
}

function removeFromPresence(socketId: string, workspaceId: string) {
  const presence = workspacePresence.get(workspaceId);
  if (!presence) return;

  presence.forEach((entry: { socketId: string; userId: string; userName: string; userImage: string | null }) => {
    if (entry.socketId === socketId) presence.delete(entry);
  });

  // Clean up empty rooms
  if (presence.size === 0) {
    workspacePresence.delete(workspaceId);
  }
}

function broadcastPresence(io: Server, workspaceId: string) {
  const presence = workspacePresence.get(workspaceId);
  const users = presence
    ? Array.from(presence).map((entry: { socketId: string; userId: string; userName: string; userImage: string | null }) => {
        const { userId, userName, userImage } = entry;
        return { userId, userName, userImage };
      })
    : [];

  io.to(workspaceId).emit("presence:update", { users });
}