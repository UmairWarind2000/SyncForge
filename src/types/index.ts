// src/types/index.ts

import type {
  User,
  Workspace,
  WorkspaceMember,
  Column,
  Task,
  TaskLabel,
  Message,
  CodeFile,
  WorkspaceRole,
  TaskPriority,
} from "@prisma/client";

// Re-export Prisma enums for use throughout the app
export { WorkspaceRole, TaskPriority };

// Workspace with its members and owner included
export type WorkspaceWithMembers = Workspace & {
  owner: Pick<User, "id" | "name" | "email" | "image">;
  members: (WorkspaceMember & {
    user: Pick<User, "id" | "name" | "email" | "image">;
  })[];
  _count: {
    tasks: number;
    members: number;
  };
};

// Task with relations populated
export type TaskWithRelations = Task & {
  assignee: Pick<User, "id" | "name" | "image"> | null;
  creator: Pick<User, "id" | "name" | "image">;
  labels: TaskLabel[];
  column: Pick<Column, "id" | "name">;
};

// Column with its tasks
export type ColumnWithTasks = Column & {
  tasks: TaskWithRelations[];
};

// Message with author
export type MessageWithAuthor = Message & {
  author: Pick<User, "id" | "name" | "image">;
};

// API response wrapper — consistent shape for all API responses
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };