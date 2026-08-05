"use client";

import { cn } from "@/shared/utils";

const FALLBACK =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=face";

type ProfileAvatarProps = {
  src?: string | null;
  name?: string;
  className?: string;
  size?: number;
};

export function ProfileAvatar({
  src,
  name = "User",
  className,
  size = 36,
}: ProfileAvatarProps) {
  return (
    <img
      src={src || FALLBACK}
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
