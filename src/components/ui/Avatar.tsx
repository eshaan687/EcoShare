import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export interface AvatarProps {
  readonly name?: string;
  readonly alt?: string;
  readonly initials?: string;
  readonly src?: string | null;
  readonly bgColor?: string;
  readonly backgroundColor?: string;
  readonly size?: "sm" | "md" | "lg" | "xl";
  readonly className?: string;
}

export function Avatar({
  name,
  alt,
  initials,
  src,
  bgColor,
  backgroundColor,
  size = "md",
  className,
}: AvatarProps) {
  const resolvedLabel = name ?? alt ?? "EcoShare Member";
  const resolvedBg = backgroundColor ?? bgColor ?? "#15803D";

  const sizeClasses =
    size === "sm"
      ? "h-8 w-8 text-xs"
      : size === "lg"
        ? "h-14 w-14 text-base"
        : size === "xl"
          ? "h-20 w-20 text-xl"
          : "h-10 w-10 text-sm";

  const dimension =
    size === "sm" ? 32 : size === "lg" ? 56 : size === "xl" ? 80 : 40;

  const computedInitials =
    initials ??
    resolvedLabel
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  if (src) {
    return (
      <Image
        src={src}
        alt={resolvedLabel}
        width={dimension}
        height={dimension}
        className={cn(
          "shrink-0 rounded-full object-cover",
          sizeClasses,
          className,
        )}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={resolvedLabel}
      style={{ backgroundColor: resolvedBg }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-surface select-none",
        sizeClasses,
        className,
      )}
    >
      {computedInitials}
    </div>
  );
}
