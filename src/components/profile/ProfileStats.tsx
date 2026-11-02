import { Award, CheckCircle2, Sparkles, Users } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { calculateLevelProgress } from "@/lib/constants/levels";
import type { PrototypeProfileSummary } from "@/lib/mock/prototype-data";
import { cn } from "@/lib/utils";

export interface ProfileStatsProps {
  readonly profile: PrototypeProfileSummary;
  readonly className?: string;
}

/**
 * Displays the user's environmental impact metrics and social counts:
 * 420 Points | 7 Verified Actions | 4/12 Badges | Level 4: Planet Protector.
 */
export function ProfileStats({ profile, className }: ProfileStatsProps) {
  const levelInfo = calculateLevelProgress(profile.totalXp);

  return (
    <Card className={cn("p-4", className)}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-background/60 p-3 text-center">
          <div className="inline-flex items-center justify-center gap-1 text-primary-dark">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="text-lg font-bold text-foreground">{profile.totalXp}</span>
          </div>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
            Points (Lvl {levelInfo.currentLevel.level})
          </p>
        </div>

        <div className="rounded-xl border border-border bg-background/60 p-3 text-center">
          <div className="inline-flex items-center justify-center gap-1 text-primary-dark">
            <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="text-lg font-bold text-foreground">
              {profile.verifiedActionsCount}
            </span>
          </div>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
            Verified Actions
          </p>
        </div>

        <div className="rounded-xl border border-border bg-background/60 p-3 text-center">
          <div className="inline-flex items-center justify-center gap-1 text-primary-dark">
            <Award className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="text-lg font-bold text-foreground">
              {profile.badgesEarnedCount}/{profile.totalBadgesAvailable}
            </span>
          </div>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
            Badges Earned
          </p>
        </div>

        <div className="rounded-xl border border-border bg-background/60 p-3 text-center">
          <div className="inline-flex items-center justify-center gap-1 text-primary-dark">
            <Users className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="text-lg font-bold text-foreground">
              {profile.followersCount}
            </span>
          </div>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
            Followers · {profile.followingCount} Following
          </p>
        </div>
      </div>
    </Card>
  );
}
