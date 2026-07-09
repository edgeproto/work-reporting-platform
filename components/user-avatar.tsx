import { cn } from "@/lib/utils";

type UserAvatarProps = {
  userId: string;
  name: string;
  hasAvatar: boolean;
  size?: "sm" | "md" | "lg";
  cacheBust?: boolean;
  className?: string;
  title?: string;
};

const sizeClass = {
  sm: "size-8 text-xs",
  md: "size-9 text-xs",
  lg: "size-16 text-lg",
} as const;

export function UserAvatar({
  userId,
  name,
  hasAvatar,
  size = "md",
  cacheBust = false,
  className,
  title,
}: UserAvatarProps) {
  const initial = name.trim().slice(0, 1).toUpperCase() || "?";
  const sizeCls = sizeClass[size];

  if (hasAvatar) {
    const src = cacheBust
      ? `/api/avatars/${userId}?v=${Date.now()}`
      : `/api/avatars/${userId}`;

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        title={title}
        className={cn(
          "shrink-0 rounded-full border object-cover",
          sizeCls,
          className,
        )}
      />
    );
  }

  return (
    <div
      title={title}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border bg-muted font-medium",
        sizeCls,
        className,
      )}
    >
      {initial}
    </div>
  );
}
