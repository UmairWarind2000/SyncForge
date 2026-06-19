// src/types/socket.ts
// Shared Socket.io event names and payload types
// Used by both the Next.js client and the Socket.io server

// ─── Events the CLIENT sends to SERVER ───────────────────────────────────────

export interface ClientToServerEvents {
  // Join a workspace room
  "workspace:join": (payload: { workspaceId: string; userId: string }) => void;

  // Leave a workspace room
  "workspace:leave": (payload: { workspaceId: string }) => void;

  // User moved a task on the board
  "board:task-moved": (payload: {
    workspaceId: string;
    taskId: string;
    fromColumnId: string;
    toColumnId: string;
    newOrder: number;
  }) => void;

  // User sent a chat message
  "chat:message": (payload: {
    workspaceId: string;
    content: string;
    authorId: string;
    authorName: string;
    authorImage: string | null;
    tempId: string; // client-generated ID for optimistic UI
  }) => void;

  // User is typing in chat
  "chat:typing": (payload: {
    workspaceId: string;
    userId: string;
    userName: string;
  }) => void;

  // User stopped typing
  "chat:stop-typing": (payload: {
    workspaceId: string;
    userId: string;
  }) => void;

  // User changed file content
  "editor:change": (payload: {
    workspaceId: string;
    fileId: string;
    content: string;
    versionId: number; // Monaco's internal version number — prevents stale updates
  }) => void;

  // User moved their cursor
  "editor:cursor": (payload: {
    workspaceId: string;
    fileId: string;
    userId: string;
    userName: string;
    lineNumber: number;
    column: number;
    color: string; // unique color per user
  }) => void;

  // User opened a file
  "editor:file-opened": (payload: {
    workspaceId: string;
    fileId: string;
    userId: string;
    userName: string;
  }) => void;

}

// ─── Events the SERVER sends to CLIENT ───────────────────────────────────────

export interface ServerToClientEvents {
  // Broadcast task move to all workspace members
  "board:task-moved": (payload: {
    taskId: string;
    fromColumnId: string;
    toColumnId: string;
    newOrder: number;
    movedBy: string; // userId who moved it
  }) => void;

  // A new message was saved and broadcast
  "chat:message": (payload: {
    id: string;
    content: string;
    createdAt: string;
    authorId: string;
    authorName: string;
    authorImage: string | null;
    tempId: string; // matches client's optimistic ID
  }) => void;

  // Someone is typing
  "chat:typing": (payload: {
    userId: string;
    userName: string;
  }) => void;

  // Someone stopped typing
  "chat:stop-typing": (payload: { userId: string }) => void;

  // Presence — who is in this workspace right now
  "presence:update": (payload: {
    users: Array<{
      userId: string;
      userName: string;
      userImage: string | null;
    }>;
  }) => void;

  // A new task was created by someone else
  "board:task-created": (payload: {
    workspaceId: string;
    columnId: string;
    task: {
      id: string;
      title: string;
      priority: string;
      order: number;
      columnId: string;
    };
  }) => void;

  // Broadcast content change to all other editors
  "editor:change": (payload: {
    fileId: string;
    content: string;
    versionId: number;
    changedBy: string;
  }) => void;

  // Broadcast cursor position
  "editor:cursor": (payload: {
    fileId: string;
    userId: string;
    userName: string;
    lineNumber: number;
    column: number;
    color: string;
  }) => void;

  // Someone opened a file — show in presence
  "editor:file-opened": (payload: {
    fileId: string;
    userId: string;
    userName: string;
  }) => void;
}