import { Leaf, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { calculateLevelProgress } from "@/lib/constants/levels";
import { cn } from "@/lib/utils";

export interface LevelCardProps {
  readonly totalXp: number;
  readonly className?: string;
}

/**
 * Matches the "Your Level" card in the bottom-right panel of references/ecoshare-ui-reference.png,
 * using authoritative EcoShare PRD §8.2 level progression thresholds.
 */
export function LevelCard({ totalXp, className }: LevelCardProps) {
  const progress = calculateLevelProgress(totalXp);

  return (
    <Card className={cn("p-5 shadow-xs", className)}>
      <div className="flex items-center justify-between gap-2 mb-3.5">
        <h3 className="text-base font-bold text-foreground">Your Level</h3>
        <Badge variant="prototype">Sample Progression</Badge>
      </div>

      <div className="rounded-2xl border border-border/80 bg-background/60 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary/75 text-primary-dark shadow-2xs">
              <Leaf className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-foreground truncate">
                Level {progress.currentLevel.level}: {progress.currentLevel.name}
              </p>
              <p className="text-xs font-medium text-primary-dark">
                {progress.totalXp} XP Points
              </p>
            </div>
          </div>

          <span className="shrink-0 text-xs font-bold text-foreground">
            {progress.totalXp} / {progress.nextLevel?.xpRequired ?? progress.totalXp} XP
          </span>
        </div>

        <div className="mt-4 space-y-1.5">
          <ProgressBar
            value={progress.progressPercentage}
            label="XP progress toward next level"
            className="h-2.5"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              {progress.nextLevel
                ? `Next Level: ${progress.nextLevel.name}`
                : "Top Level Achieved"}
            </span>
            {progress.nextLevel ? (
              <span className="font-semibold text-primary-dark">
                {progress.xpNeededForNextLevel} XP to Level {progress.nextLevel.level} (
                {progress.nextLevel.xpRequired} XP)
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
