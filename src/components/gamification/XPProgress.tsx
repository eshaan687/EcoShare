import { Leaf } from "lucide-react";

import { ProgressBar } from "@/components/ui/ProgressBar";
import { calculateLevelProgress } from "@/lib/constants/levels";
import { cn } from "@/lib/utils";

export interface XPProgressProps {
  readonly totalXp: number;
  readonly className?: string;
}

export function XPProgress({ totalXp, className }: XPProgressProps) {
  const progress = calculateLevelProgress(totalXp);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 font-semibold text-primary-dark">
          <Leaf className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          Level {progress.currentLevel.level}: {progress.currentLevel.name}
        </span>
        <span className="font-semibold text-foreground">{progress.totalXp} XP</span>
      </div>
      <ProgressBar
        value={progress.progressPercentage}
        label={`Level ${progress.currentLevel.level} XP progress`}
      />
      <p className="text-[11px] text-muted-foreground">
        {progress.nextLevel
          ? `${progress.xpNeededForNextLevel} XP to Level ${progress.nextLevel.level}: ${progress.nextLevel.name} (${progress.nextLevel.xpRequired} XP)`
          : "Maximum EcoShare level reached (Planet Legend)"}
      </p>
    </div>
  );
}
