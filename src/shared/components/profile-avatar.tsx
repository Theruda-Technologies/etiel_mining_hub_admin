"use client";

import { cn } from "@/shared/utils";

type ProfileAvatarProps = {
  src?: string | null;
  name?: string;
  className?: string;
  size?: number;
};

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function ProfileAvatar({
  src,
  name = "User",
  className,
  size = 36,
}: ProfileAvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={cn(
          "rounded-full object-cover ring-1 ring-border",
          className,
        )}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-accent-soft font-medium tracking-wide text-accent ring-1 ring-border",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.32) }}
    >
      {initialsFromName(name)}
    </span>
  );
}
