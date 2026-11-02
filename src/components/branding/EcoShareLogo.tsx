import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export interface EcoShareLogoProps {
  readonly className?: string;
  readonly variant?: "default" | "light";
  readonly iconOnly?: boolean;
  readonly size?: "sm" | "md" | "lg";
  readonly href?: string;
}

export function EcoShareLogo({
  className,
  variant = "default",
  iconOnly = false,
  size = "md",
  href = "/home",
}: EcoShareLogoProps) {
  const iconDimensions =
    size === "sm" ? "h-6 w-6" : size === "lg" ? "h-9 w-9" : "h-7 w-7";
  const textSize =
    size === "sm"
      ? "text-lg"
      : size === "lg"
        ? "text-2xl"
        : "text-[21px] leading-none";

  const leafFill = variant === "light" ? "#FFFFFF" : "#22C55E";
  const stemStroke = variant === "light" ? "#22C55E" : "#FFFFFF";
  const wordmarkColor =
    variant === "light" ? "text-surface" : "text-text-primary";

  const logoContent = (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 select-none",
        className,
      )}
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        className={cn("shrink-0", iconDimensions)}
      >
        <path
          d="M27.5 4.5C17.5 4.5 7.5 9.2 5.2 19.6C4.6 22.3 5.2 25.1 6.8 26.8C8.5 28.4 11.3 29 14 28.4C24.4 26.1 29.1 16.1 27.5 4.5Z"
          fill={leafFill}
        />
        <path
          d="M6.5 26.5C11.5 21.5 17.2 16.2 23.5 11.5"
          stroke={stemStroke}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
      {!iconOnly ? (
        <span
          className={cn(
            "font-bold tracking-tight",
            textSize,
            wordmarkColor,
          )}
        >
          EcoShare
        </span>
      ) : (
        <span className="sr-only">EcoShare</span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
