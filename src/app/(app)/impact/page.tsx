"use client";

import { useUser } from "@clerk/nextjs";
import { Crown, Plus, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { LevelCard } from "@/components/gamification/LevelCard";
import {
  CreateActionDialog,
  IMPACT_SUBMITTED_EVENT,
} from "@/components/impact/CreateActionDialog";
import { VerificationBadge } from "@/components/impact/VerificationBadge";
import { VerificationReviewCard } from "@/components/impact/VerificationReviewCard";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { calculateLevelProgress } from "@/lib/constants/levels";
import type { PrototypeVerificationReviewItem } from "@/lib/mock/prototype-data";
import { dispatchPostCreatedEvent } from "@/lib/realtime/use-realtime-feed";
import { useSafeSupabaseClient } from "@/lib/supabase/client";
import { ensureCurrentUserProfile } from "@/lib/supabase/profile-sync";
import { cn } from "@/lib/utils";

interface SupabaseImpactRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  location: string | null;
  evidence_url: string;
  status: string;
  reward_xp: number;
  created_at: string;
}

interface SupabaseProfileRow {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  location: string | null;
  total_xp: number;
  level: number;
}

function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ImpactPage() {
  const supabase = useSafeSupabaseClient();
  const { user, isSignedIn } = useUser();
  const userId = user?.id ?? null;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [queueItems, setQueueItems] = useState<
    readonly PrototypeVerificationReviewItem[]
  >([]);
  const [leaderboard, setLeaderboard] = useState<readonly SupabaseProfileRow[]>(
    [],
  );
  const [userTotalXp, setUserTotalXp] = useState<number>(0);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  const fetchImpactData = useCallback(async () => {
    if (!supabase) return;

    const [{ data: submissionsData }, { data: profilesData }] = await Promise.all(
      [
        supabase
          .from("impact_submissions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("profiles")
          .select(
            "user_id, username, display_name, avatar_url, location, total_xp, level",
          )
          .eq("is_deleted", false)
          .order("total_xp", { ascending: false })
          .limit(20),
      ],
    );

    const profileMap = new Map<string, SupabaseProfileRow>();
    if (profilesData) {
      const typedProfiles = profilesData as unknown as SupabaseProfileRow[];
      setLeaderboard(typedProfiles);
      for (const p of typedProfiles) {
        profileMap.set(p.user_id, p);
      }
      if (userId) {
        const myProfile = typedProfiles.find((p) => p.user_id === userId);
        if (myProfile) {
          setUserTotalXp(myProfile.total_xp);
        } else {
          const { data: singleProfile } = await supabase
            .from("profiles")
            .select("total_xp")
            .eq("user_id", userId)
            .maybeSingle();
          setUserTotalXp(singleProfile?.total_xp ?? 0);
        }
      } else {
        setUserTotalXp(0);
      }
    }

    if (submissionsData) {
      const typedRows = submissionsData as unknown as SupabaseImpactRow[];
      const mapped: PrototypeVerificationReviewItem[] = typedRows.map((row) => {
        const submitter = profileMap.get(row.user_id);
        const mappedStatus: "pending" | "approved" | "rejected" =
          row.status === "approved"
            ? "approved"
            : row.status === "rejected"
              ? "rejected"
              : "pending";
        return {
          id: row.id,
          isPrototype: true,
          submitterName: submitter?.display_name ?? "EcoShare Member",
          submitterHandle: `@${submitter?.username ?? "member"}`,
          submittedRelative: formatRelativeTime(row.created_at),
          activityTitle: row.title,
          description: row.description,
          category: row.category,
          location: row.location ?? submitter?.location ?? "Global Action Site",
          thumbnailSrc: row.evidence_url || "/images/cleanup-park.png",
          rewardXp: row.reward_xp ?? 75,
          status: mappedStatus,
        };
      });
      setQueueItems(mapped);
    }
  }, [supabase, userId]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(async () => {
      if (!cancelled) {
        await fetchImpactData();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fetchImpactData]);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("ecoshare-realtime-impact")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "impact_submissions" },
        () => {
          void fetchImpactData();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        () => {
          void fetchImpactData();
        },
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === "SUBSCRIBED");
      });

    const handleLocalImpactSubmitted = () => {
      void fetchImpactData();
    };
    window.addEventListener(IMPACT_SUBMITTED_EVENT, handleLocalImpactSubmitted);

    return () => {
      window.removeEventListener(
        IMPACT_SUBMITTED_EVENT,
        handleLocalImpactSubmitted,
      );
      void supabase.removeChannel(channel);
    };
  }, [supabase, fetchImpactData]);

  async function handleReviewDecision(
    submissionId: string,
    decision: "approved" | "rejected",
  ) {
    if (!supabase || !isSignedIn || !user) return;

    await ensureCurrentUserProfile(supabase, user);
    const { error } = await supabase.rpc("review_impact_submission", {
      p_submission_id: submissionId,
      p_decision: decision,
      p_notes: `Verified via EcoShare Impact Queue by ${user.fullName ?? user.username ?? "Verifier"}`,
    });

    if (!error) {
      if (decision === "approved") {
        dispatchPostCreatedEvent();
      }
      await fetchImpactData();
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 text-primary-dark">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">
                My Environmental Impact
              </h1>
              <Badge variant={isRealtimeConnected ? "verified" : "prototype"}>
                {isRealtimeConnected ? "Realtime Verification & XP" : "Impact Engine"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Submit real-world environmental evidence, verify actions, and earn Environmental XP
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="primary"
          pill
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Submit Impact Evidence
        </Button>
      </Card>

      {/* Live Level Progression Card synced with Supabase total_xp */}
      <LevelCard totalXp={userTotalXp} />

      {/* Verification State Machine */}
      <Card className="p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-foreground">
            Impact Verification Lifecycle
          </h2>
          <Badge variant="verified">Anti-Fraud XP Protection</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          In EcoShare, likes and ordinary posts never grant Environmental XP. Every
          impact submission progresses through this verified state machine:
        </p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-background/60 p-3">
            <p className="text-xs font-bold text-foreground">1. Draft</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Prepare photos/videos, category, and location metadata.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background/60 p-3">
            <p className="text-xs font-bold text-foreground">2. Submitted</p>
            <p className="mt-1 text-[11px] text-muted-foreground break-words">
              Evidence stored and queued in <code>impact_submissions</code>.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background/60 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-foreground">3. Under Review</p>
              <VerificationBadge status="pending" label="Pending" />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Inspected by verifiers in the live review queue below.
            </p>
          </div>
          <div className="rounded-xl border border-secondary bg-secondary/20 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-primary-dark">4. Approved</p>
              <VerificationBadge status="verified" label="Verified" />
            </div>
            <p className="mt-1 text-[11px] text-primary-dark">
              Atomic database RPC awards XP, updates level, and logs audit trail.
            </p>
          </div>
        </div>
      </Card>

      {/* Live Verifier Queue Review Component */}
      <VerificationReviewCard
        items={queueItems}
        onReviewDecision={handleReviewDecision}
        isRealtimeConnected={isRealtimeConnected}
      />

      {/* Live Global Eco-Champions Leaderboard */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" aria-hidden="true" />
            <div>
              <h2 className="text-base font-bold text-foreground">
                Global Eco-Champions Leaderboard
              </h2>
              <p className="text-xs text-muted-foreground">
                Live ranking by human-verified Environmental XP across all countries
              </p>
            </div>
          </div>
          <Badge variant="verified">Live XP Standings</Badge>
        </div>

        {leaderboard.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Loading verified leaderboard...
          </p>
        ) : (
          <div className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {leaderboard.slice(0, 6).map((member, index) => {
              const levelProgress = calculateLevelProgress(member.total_xp);
              const isCurrentUser = Boolean(userId && member.user_id === userId);
              return (
                <Link
                  key={member.user_id}
                  href={`/u/${member.username}`}
                  className={cn(
                    "flex items-center justify-between gap-3 px-4 py-3 transition-colors",
                    isCurrentUser ? "bg-secondary/35" : "hover:bg-background/50",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        index === 0
                          ? "bg-amber-400/25 text-amber-800 ring-1 ring-amber-400"
                          : index === 1
                            ? "bg-slate-200 text-slate-700"
                            : index === 2
                              ? "bg-amber-700/15 text-amber-900"
                              : "bg-background text-muted-foreground",
                      )}
                    >
                      #{index + 1}
                    </span>

                    <Avatar
                      src={member.avatar_url ?? undefined}
                      alt={member.display_name}
                      initials={member.display_name.slice(0, 2).toUpperCase()}
                      size="sm"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-bold text-foreground hover:text-primary-dark">
                          {member.display_name}
                        </p>
                        {isCurrentUser ? (
                          <Badge variant="verified">You</Badge>
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        @{member.username}
                        {member.location ? ` · ${member.location}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2.5 text-right">
                    <div className="hidden sm:block">
                      <p className="text-xs font-semibold text-foreground">
                        Level {levelProgress.currentLevel.level} · {levelProgress.currentLevel.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Verified Contributor
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary/65 px-3 py-1 text-xs font-bold text-primary-dark">
                      <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                      {member.total_xp.toLocaleString()} XP
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      <CreateActionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultMode="impact"
      />
    </div>
  );
}
