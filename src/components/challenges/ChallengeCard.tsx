"use client";

import { Calendar, ChevronRight, Sparkles, Users } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { PrototypeChallenge } from "@/lib/mock/prototype-data";
import { cn } from "@/lib/utils";

export interface ChallengeCardProps {
  readonly challenge: PrototypeChallenge;
  readonly variant?: "compact" | "full";
  readonly className?: string;
}

/**
 * Supports both the compact "Ongoing Challenges" right-sidebar item from
 * references/ecoshare-ui-reference.png (with photo thumbnail, description,
 * participant count, and chevron) and the full challenge discovery card
 * on /challenges and /explore.
 */
export function ChallengeCard({
  challenge,
  variant = "full",
  className,
}: ChallengeCardProps) {
  const [joinedPreview, setJoinedPreview] = useState(false);

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-3.5 rounded-2xl border border-border/80 bg-surface p-3 transition-colors hover:border-primary/40",
          className,
        )}
      >
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border/60">
          <Image
            src={challenge.thumbnailSrc}
            alt={challenge.title}
            fill
            sizes="64px"
            className="object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground truncate">{challenge.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 leading-snug">
            {challenge.description}
          </p>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">
              {(challenge.participantsCount + (joinedPreview ? 1 : 0)).toLocaleString()}{" "}
              participants
            </span>
            <button
              type="button"
              onClick={() => setJoinedPreview((prev) => !prev)}
              aria-pressed={joinedPreview}
              aria-label={
                joinedPreview
                  ? `Leave ${challenge.title} preview`
                  : `Join ${challenge.title} preview`
              }
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-md px-1.5 py-0.5",
                joinedPreview
                  ? "bg-secondary/60 text-primary-dark"
                  : "text-primary-dark hover:bg-secondary/35",
              )}
            >
              <span>{joinedPreview ? "Joined" : "Join"}</span>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("overflow-hidden flex flex-col shadow-xs", className)}>
      <div className="relative h-44 w-full overflow-hidden border-b border-border">
        <Image
          src={challenge.thumbnailSrc}
          alt={challenge.title}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover"
        />
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <Badge variant="verified">{challenge.category}</Badge>
          <Badge variant="prototype">Sample Challenge</Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <h3 className="text-base font-bold text-foreground">{challenge.title}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">{challenge.description}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              {challenge.participantsCount.toLocaleString()} participants
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-primary-dark">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />+
              {challenge.rewardXp} XP upon verified completion
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              {challenge.durationLabel}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="text-[11px] text-muted-foreground">
            {joinedPreview
              ? "Local preview state: Joined challenge"
              : "Requires verified impact evidence for XP"}
          </span>
          <Button
            type="button"
            size="sm"
            variant={joinedPreview ? "secondary" : "primary"}
            pill
            onClick={() => setJoinedPreview((prev) => !prev)}
            aria-pressed={joinedPreview}
          >
            {joinedPreview ? "Joined (Preview)" : "Join Challenge"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
