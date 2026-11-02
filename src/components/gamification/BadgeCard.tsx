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
      return <Leaf className="h-6 w-6" aria-hidden="true" />;
    case "recycle":
      return <Recycle className="h-6 w-6" aria-hidden="true" />;
    case "users":
      return <Users className="h-6 w-6" aria-hidden="true" />;
    case "award":
      return <Award className="h-6 w-6" aria-hidden="true" />;
  }
}

/**
 * Hexagonal environmental badge shield card matching "Your Badges (4/12)"
 * in references/ecoshare-ui-reference.png.
 */
export function BadgeCard({ badge, className }: BadgeCardProps) {
  const isGold = badge.accentRing === "gold";

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-border/70 bg-surface p-3.5 text-center transition-colors hover:border-primary/40",
        className,
      )}
    >
      {/* Hexagon Shield Container matching reference image */}
      <div className="relative mb-2.5 flex h-16 w-16 items-center justify-center">
        <svg
          viewBox="0 0 64 64"
          className="absolute inset-0 h-full w-full drop-shadow-2xs"
          aria-hidden="true"
        >
          <polygon
            points="32,3 58,17.5 58,46.5 32,61 6,46.5 6,17.5"
            fill={isGold ? "#15803D" : "#DCFCE7"}
            stroke={isGold ? "#F59E0B" : "#22C55E"}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
        </svg>
        <div
          className={cn(
            "relative z-10 flex items-center justify-center",
            isGold ? "text-white" : "text-primary-dark",
          )}
        >
          {renderBadgeIcon(badge.iconName)}
        </div>
      </div>

      <p className="text-xs font-bold text-foreground leading-tight">
        {badge.name}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
        {badge.description}
      </p>
    </div>
  );
}
