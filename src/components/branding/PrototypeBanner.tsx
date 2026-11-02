import { Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface PrototypeBannerProps {
  readonly className?: string;
  readonly message?: string;
}

export function PrototypeBanner({
  className,
  message = "Milestone 1 UI Preview — Sample feed, challenge, and profile items are isolated prototype data. Interactions update local preview state only and never award XP.",
}: PrototypeBannerProps) {
  return (
    <div
      role="status"
      aria-label="Prototype status notice"
      className={cn(
        "flex items-center gap-2.5 rounded-button border border-secondary bg-secondary/25 px-3.5 py-2 text-xs text-primary-dark",
        className,
      )}
    >
      <Info className="h-4 w-4 shrink-0 text-primary-dark" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
