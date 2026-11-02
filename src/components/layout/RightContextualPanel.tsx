"use client";

import { useUser } from "@clerk/nextjs";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { ChallengeCard } from "@/components/challenges/ChallengeCard";
import { XPProgress } from "@/components/gamification/XPProgress";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
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
 * 1. User summary card ("Alex R. ✓", Level 4: Planet Protector, 420 XP bar,
 *    and 3-column metrics: 420 Points | 7 Verified Actions | 4 Badges).
 * 2. "Ongoing Challenges" card with "See All" link and compact challenge items.
 */
export function RightContextualPanel({ className }: RightContextualPanelProps) {
  const { isSignedIn, user } = useUser();

  const displayName =
    isSignedIn && user
      ? user.fullName || user.username || user.primaryEmailAddress?.emailAddress || PROTOTYPE_USER_PROFILE.displayName
      : PROTOTYPE_USER_PROFILE.displayName;

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      aria-label="Environmental impact summary and ongoing challenges"
      className={cn(
        "hidden xl:flex xl:w-80 shrink-0 flex-col gap-4 h-fit sticky top-4",
        className,
      )}
    >
      {/* Top User Impact Summary Card matching reference image */}
      <Card className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <Link href="/profile" className="flex items-center gap-3 min-w-0 group">
            <Avatar initials={initials} alt={displayName} size="md" />
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-sm font-bold text-foreground group-hover:text-primary-dark truncate">
                  {displayName}
                </p>
                <CheckCircle2
                  className="h-4 w-4 shrink-0 text-primary"
                  aria-label="Verified Contributor"
                />
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {isSignedIn ? "Signed in via Clerk · Sample XP" : "Sample Contributor Preview"}
              </p>
            </div>
          </Link>
          <Badge variant="prototype">Preview</Badge>
        </div>

        <XPProgress totalXp={PROTOTYPE_USER_PROFILE.totalXp} />

        {/* 3-Column Metrics Bar matching reference image: 420 Points | 7 Verified Actions | 4 Badges */}
        <div className="grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-background/70 py-2.5 text-center">
          <div className="px-2">
            <p className="text-sm font-bold text-foreground">
              {PROTOTYPE_USER_PROFILE.totalXp}
            </p>
            <p className="text-[11px] text-muted-foreground">Points</p>
          </div>
          <div className="px-2">
            <p className="text-sm font-bold text-foreground">
              {PROTOTYPE_USER_PROFILE.verifiedActionsCount}
            </p>
            <p className="text-[11px] text-muted-foreground">Verified Actions</p>
          </div>
          <div className="px-2">
            <p className="text-sm font-bold text-foreground">
              {PROTOTYPE_USER_PROFILE.badgesEarnedCount}
            </p>
            <p className="text-[11px] text-muted-foreground">Badges</p>
          </div>
        </div>
      </Card>

      {/* Ongoing Challenges Card matching reference image */}
      <Card className="p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Ongoing Challenges</h2>
          <Link
            href="/challenges"
            className="text-xs font-semibold text-primary-dark hover:underline"
          >
            See All
          </Link>
        </div>

        <div className="space-y-2.5">
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
