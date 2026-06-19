// src/components/presence/PresenceBar.tsx
"use client";

import { useAppSelector } from "@/store/hooks";
import { UserAvatar } from "@/components/layout/UserAvatar";

interface PresenceBarProps {
  workspaceId: string;
}

export function PresenceBar({ workspaceId }: PresenceBarProps) {
  const onlineUsers = useAppSelector((s) => s.presence.onlineUsers);

  if (onlineUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b bg-background">
      {/* Green dot + label */}
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs text-muted-foreground">
          {onlineUsers.length} online
        </span>
      </div>

      {/* Avatar stack */}
      <div className="flex -space-x-1.5">
        {onlineUsers.slice(0, 6).map((user) => (
          <div key={user.userId} title={user.userName}>
            <UserAvatar
              name={user.userName}
              image={user.userImage}
              size="sm"
              className="border-2 border-background"
            />
          </div>
        ))}
        {onlineUsers.length > 6 && (
          <div className="h-7 w-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs text-muted-foreground">
            +{onlineUsers.length - 6}
          </div>
        )}
      </div>
    </div>
  );
}