"use client";

import { useUser } from "@clerk/nextjs";
import { Leaf } from "lucide-react";
import Link from "next/link";

import { ChallengeCard } from "@/components/challenges/ChallengeCard";
import { VerificationBadge } from "@/components/impact/VerificationBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { calculateLevelProgress } from "@/lib/constants/levels";
import {
  PROTOTYPE_CHALLENGES,
  PROTOTYPE_USER_PROFILE,
} from "@/lib/mock/prototype-data";
import { cn } from "@/lib/utils";

export interface RightContextualPanelProps {
  readonly className?: string;
}

/**
 * Matches the right contextual column in references/ecoshare-ui-reference.png:
 * 1. User summary card ("Alex R.", "@alexr", "Level 4 · Planet Protector",
 *    progress bar, and 3-column metrics: 420 Points | 7 Verified Actions | 4 Badges).
 * 2. "Ongoing Challenges" card with "See All" link and compact challenge items.
 */
export function RightContextualPanel({ className }: RightContextualPanelProps) {
  const { isSignedIn, user } = useUser();

  const displayName =
    isSignedIn && user
      ? user.fullName ||
        user.username ||
        user.primaryEmailAddress?.emailAddress ||
        PROTOTYPE_USER_PROFILE.displayName
      : PROTOTYPE_USER_PROFILE.displayName;

  const handle =
    isSignedIn && user?.username
      ? `@${user.username}`
      : `@${PROTOTYPE_USER_PROFILE.username}`;

  const avatarSrc =
    isSignedIn && user?.imageUrl
      ? user.imageUrl
      : PROTOTYPE_USER_PROFILE.avatarSrc;

  const progress = calculateLevelProgress(PROTOTYPE_USER_PROFILE.totalXp);

  return (
    <aside
      aria-label="Environmental impact summary and ongoing challenges"
      className={cn(
        "hidden xl:flex xl:w-80 shrink-0 flex-col gap-4 h-fit sticky top-4",
        className,
      )}
    >
      {/* Top User Impact Summary Card matching reference image */}
      <Card className="p-5 space-y-4 shadow-xs">
        <Link
          href="/profile"
          className="flex items-center gap-3.5 min-w-0 group outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl"
        >
          <Avatar
            src={avatarSrc}
            alt={displayName}
            size="lg"
            className="h-14 w-14 border border-border"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-base font-bold text-foreground group-hover:text-primary-dark truncate">
                {displayName}
              </p>
              <VerificationBadge variant="author" />
            </div>
            <p className="text-xs text-muted-foreground truncate">{handle}</p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary-dark">
              <Leaf className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span>
                Level {progress.currentLevel.level} · {progress.currentLevel.name}
              </span>
            </p>
          </div>
        </Link>

        {/* XP Bar matching reference image */}
        <div className="space-y-1.5">
          <ProgressBar
            value={progress.progressPercentage}
            label={`Level ${progress.currentLevel.level} XP progress`}
            className="h-2.5"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {progress.totalXp} / {progress.nextLevel?.xpRequired ?? progress.totalXp} XP
            </span>
            <span>
              {progress.nextLevel
                ? `${progress.xpNeededForNextLevel} XP to Level ${progress.nextLevel.level}`
                : "Max Level"}
            </span>
          </div>
        </div>

        {/* 3-Column Metrics Bar matching reference image: 420 Points | 7 Verified Actions | 4 Badges */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-border/80 bg-background/60 px-2 py-2.5">
            <p className="text-base font-bold text-foreground">
              {PROTOTYPE_USER_PROFILE.totalXp}
            </p>
            <p className="text-[11px] text-muted-foreground">Points</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-background/60 px-2 py-2.5">
            <p className="text-base font-bold text-foreground">
              {PROTOTYPE_USER_PROFILE.verifiedActionsCount}
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Verified Actions
            </p>
          </div>
          <div className="rounded-xl border border-border/80 bg-background/60 px-2 py-2.5">
            <p className="text-base font-bold text-foreground">
              {PROTOTYPE_USER_PROFILE.badgesEarnedCount}
            </p>
            <p className="text-[11px] text-muted-foreground">Badges</p>
          </div>
        </div>
      </Card>

      {/* Ongoing Challenges Card matching reference image */}
      <Card className="p-5 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Ongoing Challenges</h2>
          <Link
            href="/challenges"
            className="text-xs font-semibold text-primary-dark hover:underline outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm"
          >
            See All
          </Link>
        </div>

        <div className="space-y-3">
          {PROTOTYPE_CHALLENGES.slice(0, 2).map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              variant="compact"
            />
          ))}
        </div>
      </Card>
    </aside>
  );
}
