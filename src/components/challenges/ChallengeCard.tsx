"use client";

import { useUser } from "@clerk/nextjs";
import { Calendar, Check, ChevronRight, ShieldCheck, Sparkles, Users } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { PrototypeChallenge } from "@/lib/mock/prototype-data";
import { useSafeSupabaseClient } from "@/lib/supabase/client";
import { ensureCurrentUserProfile } from "@/lib/supabase/profile-sync";
import { cn } from "@/lib/utils";

export interface ChallengeCardProps {
  readonly challenge: PrototypeChallenge;
  readonly isJoinedInitial?: boolean;
  readonly onSubmitChallengeEvidence?: (challenge: PrototypeChallenge) => void;
  readonly variant?: "compact" | "full";
  readonly className?: string;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Supports both the compact "Ongoing Challenges" right-sidebar item from
 * references/ecoshare-ui-reference.png and the full challenge discovery card
 * on /challenges and /explore, persisted to Supabase challenge_participants.
 */
export function ChallengeCard({
  challenge,
  isJoinedInitial = false,
  onSubmitChallengeEvidence,
  variant = "full",
  className,
}: ChallengeCardProps) {
  const supabase = useSafeSupabaseClient();
  const { user, isSignedIn } = useUser();

  const [joined, setJoined] = useState(isJoinedInitial);
  const [participantsDelta, setParticipantsDelta] = useState(0);
  const [busy, setBusy] = useState(false);

  async function handleToggleJoin() {
    if (busy) return;
    const nextJoined = !joined;
    setJoined(nextJoined);
    setParticipantsDelta((prev) => prev + (nextJoined ? 1 : -1));

    if (!supabase || !isSignedIn || !user?.id || !UUID_REGEX.test(challenge.id)) {
      return;
    }

    setBusy(true);
    try {
      await ensureCurrentUserProfile(supabase, user);
      if (nextJoined) {
        await supabase.from("challenge_participants").upsert(
          {
            challenge_id: challenge.id,
            user_id: user.id,
          },
          { onConflict: "challenge_id,user_id" },
        );
      } else {
        await supabase
          .from("challenge_participants")
          .delete()
          .eq("challenge_id", challenge.id)
          .eq("user_id", user.id);
      }
    } finally {
      setBusy(false);
    }
  }

  const displayedParticipants = Math.max(
    0,
    challenge.participantsCount + participantsDelta,
  );

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
              {displayedParticipants.toLocaleString()} participants
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleToggleJoin()}
              aria-pressed={joined}
              aria-label={
                joined
                  ? `Leave ${challenge.title} preview`
                  : `Join ${challenge.title} preview`
              }
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-md px-1.5 py-0.5 cursor-pointer",
                joined
                  ? "bg-secondary/60 text-primary-dark"
                  : "text-primary-dark hover:bg-secondary/35",
              )}
            >
              <span>{joined ? "Joined" : "Join"}</span>
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
          src={challenge.thumbnailSrc || "/images/challenge-oceans.png"}
          alt={challenge.title}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover"
        />
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <Badge variant="verified">{challenge.category}</Badge>
          <Badge variant="verified">+{challenge.rewardXp} XP</Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <h3 className="text-base font-bold text-foreground">{challenge.title}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">{challenge.description}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              {displayedParticipants.toLocaleString()} participants
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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          {onSubmitChallengeEvidence ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              pill
              onClick={() => onSubmitChallengeEvidence(challenge)}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Submit Evidence (+{challenge.rewardXp} XP)
            </Button>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              {joined
                ? "Active Challenge Participant"
                : "Requires verified impact evidence for XP"}
            </span>
          )}

          <Button
            type="button"
            size="sm"
            variant={joined ? "secondary" : "primary"}
            pill
            disabled={busy}
            onClick={() => void handleToggleJoin()}
            aria-pressed={joined}
          >
            {joined ? (
              <>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Joined Challenge
              </>
            ) : (
              "Join Challenge"
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
