"use client";

import { useUser } from "@clerk/nextjs";
import { Plus, Sparkles, Trophy, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ChallengeCard } from "@/components/challenges/ChallengeCard";
import { CreateActionDialog } from "@/components/impact/CreateActionDialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { INITIATIVE_BANNERS } from "@/lib/constants/countries";
import type { PrototypeChallenge } from "@/lib/mock/prototype-data";
import { useSafeSupabaseClient } from "@/lib/supabase/client";
import { ensureCurrentUserProfile } from "@/lib/supabase/profile-sync";
import { cn } from "@/lib/utils";

const CHALLENGE_CATEGORIES = [
  "All",
  "Community Cleanup",
  "Tree Planting",
  "Ocean Conservation",
  "Recycling Initiatives",
  "Wildlife Conservation",
] as const;

interface SupabaseChallengeRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  thumbnail_url: string;
  participants_count: number;
  reward_xp: number;
  duration_label: string;
  created_by: string | null;
  created_at: string;
}

function mapRowToChallenge(row: SupabaseChallengeRow): PrototypeChallenge {
  return {
    id: row.id,
    isPrototype: true,
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category,
    thumbnailSrc: row.thumbnail_url || "/images/challenge-oceans.png",
    participantsCount: row.participants_count ?? 1,
    rewardXp: row.reward_xp ?? 75,
    durationLabel: row.duration_label || "14 days remaining",
  };
}

export default function ChallengesPage() {
  const supabase = useSafeSupabaseClient();
  const { user, isSignedIn } = useUser();
  const userId = user?.id ?? null;

  const [challenges, setChallenges] = useState<readonly PrototypeChallenge[]>(
    [],
  );
  const [joinedChallengeIds, setJoinedChallengeIds] = useState<
    ReadonlySet<string>
  >(new Set());
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Create Challenge Dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Community Cleanup");
  const [rewardXp, setRewardXp] = useState<number>(75);
  const [durationLabel, setDurationLabel] = useState("14 days remaining");
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(
    INITIATIVE_BANNERS[0].value,
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Submit Impact Evidence Dialog prefilled from a Challenge
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [activeChallengeForEvidence, setActiveChallengeForEvidence] =
    useState<PrototypeChallenge | null>(null);

  const fetchChallenges = useCallback(async () => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data && data.length > 0) {
      setChallenges(
        (data as unknown as SupabaseChallengeRow[]).map(mapRowToChallenge),
      );
    }

    if (userId) {
      const { data: memberships } = await supabase
        .from("challenge_participants")
        .select("challenge_id")
        .eq("user_id", userId);

      if (memberships) {
        setJoinedChallengeIds(new Set(memberships.map((m) => m.challenge_id)));
      }
    }
  }, [supabase, userId]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(async () => {
      if (!cancelled) {
        await fetchChallenges();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fetchChallenges]);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("ecoshare-realtime-challenges")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "challenges" },
        () => {
          void fetchChallenges();
        },
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, fetchChallenges]);

  const visibleChallenges = challenges.filter(
    (challenge) =>
      selectedCategory === "All" || challenge.category === selectedCategory,
  );

  async function handleCreateChallenge(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();
    if (trimmedTitle.length < 3) {
      setErrorMessage("Please enter a challenge title (at least 3 characters).");
      return;
    }
    if (trimmedDesc.length < 10) {
      setErrorMessage("Please describe what participants must do to earn XP.");
      return;
    }

    setSubmitting(true);
    try {
      const slugBase = trimmedTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 48);
      const uniqueSlug = `${slugBase || "eco-challenge"}-${Date.now().toString(36)}`;

      const optimisticChallenge: PrototypeChallenge = {
        id: `local-${Date.now()}`,
        isPrototype: true,
        slug: uniqueSlug,
        title: trimmedTitle,
        description: trimmedDesc,
        category,
        thumbnailSrc: thumbnailUrl,
        participantsCount: 1,
        rewardXp,
        durationLabel,
      };

      if (supabase && isSignedIn && user?.id) {
        await ensureCurrentUserProfile(supabase, user);
        const { data: inserted, error } = await supabase
          .from("challenges")
          .insert({
            slug: uniqueSlug,
            title: trimmedTitle,
            description: trimmedDesc,
            category,
            thumbnail_url: thumbnailUrl,
            participants_count: 1,
            reward_xp: rewardXp,
            duration_label: durationLabel,
            created_by: user.id,
          })
          .select("*")
          .single();

        if (!error && inserted) {
          await supabase.from("challenge_participants").upsert(
            {
              challenge_id: inserted.id,
              user_id: user.id,
            },
            { onConflict: "challenge_id,user_id" },
          );
          const mapped = mapRowToChallenge(
            inserted as unknown as SupabaseChallengeRow,
          );
          setChallenges((prev) => [
            mapped,
            ...prev.filter((c) => c.id !== mapped.id),
          ]);
          setJoinedChallengeIds((prev) => new Set([...prev, mapped.id]));
        } else {
          setChallenges((prev) => [optimisticChallenge, ...prev]);
        }
      } else {
        setChallenges((prev) => [optimisticChallenge, ...prev]);
      }

      setBannerNotice(
        `Created challenge "${trimmedTitle}" (+${rewardXp} Verified XP)!`,
      );
      setTitle("");
      setDescription("");
      setCreateOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 text-primary-dark">
              <Trophy className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Environmental Challenges
              </h1>
              <p className="text-xs text-muted-foreground">
                Join structured challenges and submit real-world evidence to earn verified XP
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isRealtimeConnected ? "verified" : "prototype"}>
              {isRealtimeConnected ? "Realtime Challenges" : "Active Challenges"}
            </Badge>
            <Button
              type="button"
              variant="primary"
              size="sm"
              pill
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Challenge
            </Button>
          </div>
        </div>

        {bannerNotice ? (
          <div
            role="status"
            className="flex items-center justify-between gap-2 rounded-xl border border-primary/30 bg-secondary/40 px-3.5 py-2 text-xs font-medium text-primary-dark"
          >
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              {bannerNotice}
            </span>
            <button
              type="button"
              onClick={() => setBannerNotice(null)}
              className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ) : null}

        <div
          role="group"
          aria-label="Filter challenges by category"
          className="flex flex-wrap items-center gap-2 pt-1"
        >
          {CHALLENGE_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "bg-primary text-white shadow-xs"
                    : "border border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {visibleChallenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            isJoinedInitial={joinedChallengeIds.has(challenge.id)}
            onSubmitChallengeEvidence={(selected) => {
              setActiveChallengeForEvidence(selected);
              setEvidenceDialogOpen(true);
            }}
          />
        ))}
      </div>

      {/* Create Challenge Modal */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Environmental Challenge"
        description="Launch a structured challenge where participants submit verified evidence to earn Environmental XP."
      >
        <form onSubmit={(e) => void handleCreateChallenge(e)} className="space-y-4">
          <div>
            <label
              htmlFor="create-challenge-title"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Challenge Title
            </label>
            <Input
              id="create-challenge-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., 30-Day Urban Riverbank Cleanup Sprint"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="create-challenge-category"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Category
              </label>
              <select
                id="create-challenge-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-surface px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                <option value="Community Cleanup">Community Cleanup</option>
                <option value="Tree Planting">Tree Planting</option>
                <option value="Ocean Conservation">Ocean Conservation</option>
                <option value="Recycling Initiatives">Recycling Initiatives</option>
                <option value="Wildlife Conservation">Wildlife Conservation</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="create-challenge-xp"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Verified XP Reward
              </label>
              <select
                id="create-challenge-xp"
                value={rewardXp}
                onChange={(e) => setRewardXp(Number(e.target.value))}
                className="h-10 w-full rounded-xl border border-input bg-surface px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                <option value={50}>+50 XP (Quick Action)</option>
                <option value={75}>+75 XP (Standard Impact)</option>
                <option value={100}>+100 XP (Major Field Action)</option>
                <option value={150}>+150 XP (Multi-Day Expedition)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="create-challenge-duration"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Duration / Deadline
              </label>
              <Input
                id="create-challenge-duration"
                value={durationLabel}
                onChange={(e) => setDurationLabel(e.target.value)}
                placeholder="e.g., 14 days remaining"
              />
            </div>

            <div>
              <label
                htmlFor="create-challenge-banner"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Cover Photo Theme
              </label>
              <select
                id="create-challenge-banner"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-surface px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                {INITIATIVE_BANNERS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="create-challenge-description"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Challenge Instructions & Verification Criteria
            </label>
            <Textarea
              id="create-challenge-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what environmental action participants need to complete and what photo/video evidence they should submit..."
              required
            />
          </div>

          {errorMessage ? (
            <p role="alert" className="text-xs font-medium text-destructive">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              pill
              disabled={submitting}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {submitting ? "Launching..." : "Launch Challenge"}
            </Button>
          </div>
        </form>
      </Dialog>

      <CreateActionDialog
        key={activeChallengeForEvidence?.id ?? "challenge-evidence"}
        open={evidenceDialogOpen}
        onOpenChange={setEvidenceDialogOpen}
        defaultMode="impact"
        defaultCategory={
          activeChallengeForEvidence?.category ?? "Community Cleanup"
        }
        defaultTitle={
          activeChallengeForEvidence
            ? `${activeChallengeForEvidence.title} — Field Evidence`
            : ""
        }
      />
    </div>
  );
}
