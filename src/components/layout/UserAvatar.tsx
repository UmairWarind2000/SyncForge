// src/components/layout/UserAvatar.tsx
import * as Avatar from "@radix-ui/react-avatar";
import { getInitials, cn } from "@/lib/utils";

interface UserAvatarProps {
  name?:      string | null;
  image?:     string | null;
  size?:      "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  xs: "h-5 w-5 text-[10px]",
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
};

export function UserAvatar({ name, image, size = "md", className }: UserAvatarProps) {
  return (
    <Avatar.Root
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full ring-1 ring-[var(--color-border)]",
        sizeMap[size],
        className
      )}
    >
      <Avatar.Image
        src={image ?? undefined}
        alt={name ?? "User"}
        className="aspect-square h-full w-full object-cover"
      />
      <Avatar.Fallback
        className="flex h-full w-full items-center justify-center font-medium"
        style={{
          background: "var(--color-accent-muted)",
          color:      "var(--color-accent)",
        }}
      >
        {getInitials(name)}
      </Avatar.Fallback>
    </Avatar.Root>
  );
}