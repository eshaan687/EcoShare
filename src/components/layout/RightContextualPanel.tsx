"use client";

import { Leaf } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ChallengeCard } from "@/components/challenges/ChallengeCard";
import { VerificationBadge } from "@/components/impact/VerificationBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useSafeUser } from "@/lib/auth/clerk-hooks";
import { calculateLevelProgress } from "@/lib/constants/levels";
import type { PrototypeChallenge } from "@/lib/mock/prototype-data";
import { useSafeSupabaseClient } from "@/lib/supabase/client";
import { ensureCurrentUserProfile } from "@/lib/supabase/profile-sync";
import { cn } from "@/lib/utils";

export interface RightContextualPanelProps {
  readonly className?: string;
}

/**
 * Matches the right contextual column in references/ecoshare-ui-reference.png
 * using real Supabase profile metrics (`total_xp`, approved `impact_submissions`, `user_badges`)
 * and live `challenges` from Supabase.
 */
export function RightContextualPanel({ className }: RightContextualPanelProps) {
  const supabase = useSafeSupabaseClient();
  const { isSignedIn, user } = useSafeUser();
  const userId = user?.id ?? null;

  const [totalXp, setTotalXp] = useState(0);
  const [verifiedActionsCount, setVerifiedActionsCount] = useState(0);
  const [badgesEarnedCount, setBadgesEarnedCount] = useState(0);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(
    null,
  );
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [ongoingChallenges, setOngoingChallenges] = useState<
    readonly PrototypeChallenge[]
  >([]);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    async function loadRightRailData() {
      const { data: challengesData } = await supabase!
        .from("challenges")
        .select("*")
        .order("participants_count", { ascending: false })
        .limit(2);

      if (!cancelled && challengesData) {
        setOngoingChallenges(
          challengesData.map((row) => ({
            id: row.id,
            isPrototype: true,
            slug: row.slug,
            title: row.title,
            description: row.description,
            category: row.category,
            thumbnailSrc: row.thumbnail_url,
            participantsCount: row.participants_count,
            rewardXp: row.reward_xp,
            durationLabel: row.duration_label,
          })),
        );
      }

      if (isSignedIn && userId && user) {
        await ensureCurrentUserProfile(supabase!, user);
        const [
          { data: profileRow },
          { count: approvedCount },
          { count: badgesCount },
        ] = await Promise.all([
          supabase!
            .from("profiles")
            .select("username, display_name, avatar_url, total_xp")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase!
            .from("impact_submissions")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("status", "approved"),
          supabase!
            .from("user_badges")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId),
        ]);

        if (!cancelled) {
          if (profileRow) {
            setTotalXp(profileRow.total_xp ?? 0);
            setProfileUsername(profileRow.username);
            setProfileDisplayName(profileRow.display_name);
            setProfileAvatarUrl(profileRow.avatar_url);
          }
          setVerifiedActionsCount(approvedCount ?? 0);
          setBadgesEarnedCount(badgesCount ?? 0);
        }
      } else if (!cancelled) {
        setTotalXp(0);
        setVerifiedActionsCount(0);
        setBadgesEarnedCount(0);
        setProfileUsername(null);
        setProfileDisplayName(null);
        setProfileAvatarUrl(null);
      }
    }

    void Promise.resolve().then(() => loadRightRailData());
    return () => {
      cancelled = true;
    };
  }, [supabase, isSignedIn, userId, user]);

  const displayName =
    profileDisplayName ||
    (isSignedIn && user
      ? user.fullName ||
        user.username ||
        user.primaryEmailAddress?.emailAddress ||
        "EcoShare Member"
      : "Guest Explorer");

  const handle = profileUsername
    ? `@${profileUsername}`
    : isSignedIn && user?.username
      ? `@${user.username}`
      : isSignedIn
        ? "@member"
        : "Sign in to track verified XP";

  const avatarSrc =
    profileAvatarUrl || (isSignedIn && user?.imageUrl ? user.imageUrl : undefined);

  const progress = calculateLevelProgress(totalXp);

  return (
    <aside
      aria-label="Environmental impact summary and ongoing challenges"
      className={cn(
        "hidden xl:flex xl:w-80 shrink-0 flex-col gap-4 h-fit sticky top-4",
        className,
      )}
    >
      {/* Top User Impact Summary Card */}
      <Card className="p-5 space-y-4 shadow-xs">
        <Link
          href={isSignedIn ? "/profile" : "/login"}
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
              {verifiedActionsCount > 0 ? (
                <VerificationBadge variant="author" />
              ) : null}
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

        {/* XP Bar */}
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

        {/* 3-Column Metrics Bar */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-border/80 bg-background/60 px-2 py-2.5">
            <p className="text-base font-bold text-foreground">{totalXp}</p>
            <p className="text-[11px] text-muted-foreground">Points</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-background/60 px-2 py-2.5">
            <p className="text-base font-bold text-foreground">
              {verifiedActionsCount}
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Verified Actions
            </p>
          </div>
          <div className="rounded-xl border border-border/80 bg-background/60 px-2 py-2.5">
            <p className="text-base font-bold text-foreground">
              {badgesEarnedCount}
            </p>
            <p className="text-[11px] text-muted-foreground">Badges</p>
          </div>
        </div>
      </Card>

      {/* Ongoing Challenges Card */}
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

        {ongoingChallenges.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Loading active environmental challenges...
          </p>
        ) : (
          <div className="space-y-3">
            {ongoingChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                variant="compact"
              />
            ))}
          </div>
        )}
      </Card>
    </aside>
  );
}
