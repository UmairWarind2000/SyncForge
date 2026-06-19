// src/lib/design.ts

// Priority styles used in TaskCard and TaskDetailModal
export const PRIORITY_CONFIG = {
  LOW:    { label: "low",    color: "#3b82f6", bg: "#3b82f615" },
  MEDIUM: { label: "medium", color: "#7c6ef7", bg: "#7c6ef715" },
  HIGH:   { label: "high",   color: "#f59e0b", bg: "#f59e0b15" },
  URGENT: { label: "urgent", color: "#ef4444", bg: "#ef444415" },
} as const;

// Workspace accent colors
export const WORKSPACE_COLORS = [
  "#7c6ef7", "#06b6d4", "#22c55e",
  "#f59e0b", "#ef4444", "#ec4899",
  "#8b5cf6", "#14b8a6",
];

// User presence colors
export const PRESENCE_COLORS = [
  "#7c6ef7", "#06b6d4", "#22c55e",
  "#f59e0b", "#ec4899", "#8b5cf6",
];