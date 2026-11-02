import { Award, Leaf, Recycle, Users } from "lucide-react";

import type { PrototypeBadgeItem } from "@/lib/mock/prototype-data";
import { cn } from "@/lib/utils";

export interface BadgeCardProps {
  readonly badge: PrototypeBadgeItem;
  readonly className?: string;
}

function renderBadgeIcon(iconName: PrototypeBadgeItem["iconName"]) {
  switch (iconName) {
    case "leaf":
      return <Leaf className="h-5 w-5" aria-hidden="true" />;
    case "recycle":
      return <Recycle className="h-5 w-5" aria-hidden="true" />;
    case "users":
      return <Users className="h-5 w-5" aria-hidden="true" />;
    case "award":
      return <Award className="h-5 w-5" aria-hidden="true" />;
  }
}

/**
 * Hexagonal/shield environmental badge card matching "Your Badges (4/12)"
 * in references/ecoshare-ui-reference.png.
 */
export function BadgeCard({ badge, className }: BadgeCardProps) {
  const isGold = badge.accentRing === "gold";

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl border border-border bg-surface p-3 text-center transition-colors hover:border-primary/40",
        className,
      )}
    >
      <div
        className={cn(
          "mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border-2 shadow-xs",
          isGold
            ? "border-warning bg-warning/15 text-amber-700"
            : "border-primary bg-secondary/45 text-primary-dark",
        )}
      >
        {renderBadgeIcon(badge.iconName)}
      </div>
      <p className="text-xs font-semibold text-foreground leading-tight">
        {badge.name}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
        {badge.description}
      </p>
    </div>
  );
}
