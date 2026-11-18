"use client";

import { Send, Wifi } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ChallengeCard } from "@/components/challenges/ChallengeCard";
import { FeedTabs } from "@/components/feed/FeedTabs";
import { HeroBanner } from "@/components/feed/HeroBanner";
import { PostCard } from "@/components/feed/PostCard";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useSafeUser } from "@/lib/auth/clerk-hooks";
import type { EcoShareFeedTabId } from "@/lib/constants/design-tokens";
import {
  filterPrototypePostsByTab,
  type PrototypeChallenge,
} from "@/lib/mock/prototype-data";
import { useRealtimeFeed } from "@/lib/realtime/use-realtime-feed";
import { useSafeSupabaseClient } from "@/lib/supabase/client";

export default function HomeFeedPage() {
  const supabase = useSafeSupabaseClient();
  const [activeTab, setActiveTab] = useState<EcoShareFeedTabId>("for-you");
  const [quickPostText, setQuickPostText] = useState("");
  const [quickCategory, setQuickCategory] = useState("Community Cleanup");
  const [quickFeedback, setQuickFeedback] = useState<string | null>(null);
  const [ongoingChallenges, setOngoingChallenges] = useState<
    readonly PrototypeChallenge[]
  >([]);

  const { isSignedIn, user } = useSafeUser();
  const {
    posts,
    isRealtimeConnected,
    isUsingSupabaseData,
    isSubmitting,
    createPost,
  } = useRealtimeFeed();

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    void Promise.resolve().then(async () => {
      const { data } = await supabase
        .from("challenges")
        .select("*")
        .order("participants_count", { ascending: false })
        .limit(2);
      if (!cancelled && data) {
        setOngoingChallenges(
          data.map((row) => ({
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
    });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const visiblePosts = filterPrototypePostsByTab(posts, activeTab);

  async function handleQuickPostSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setQuickFeedback(null);

    const res = await createPost({
      content: quickPostText,
      category: quickCategory,
    });

    if (!res.ok) {
      setQuickFeedback(res.error ?? "Unable to publish post.");
      return;
    }

    setQuickPostText("");
    setQuickFeedback("Published live via Supabase Realtime!");
    setTimeout(() => setQuickFeedback(null), 4000);
  }

  const userAvatar = isSignedIn && user?.imageUrl ? user.imageUrl : undefined;
  const userDisplayName =
    isSignedIn && user
      ? user.fullName || user.username || "EcoShare Member"
      : "Guest";

  return (
    <div className="space-y-4">
      <HeroBanner />

      {/* Quick Real-Time Post Composer for Signed-In Members */}
      {isSignedIn ? (
        <Card className="p-4 shadow-xs">
          <form onSubmit={handleQuickPostSubmit} className="space-y-3">
            <div className="flex items-start gap-3">
              <Avatar
                src={userAvatar}
                alt={userDisplayName}
                size="sm"
                className="mt-0.5 h-9 w-9 border border-border"
              />
              <div className="min-w-0 flex-1 space-y-2">
                <textarea
                  value={quickPostText}
                  onChange={(e) => setQuickPostText(e.target.value)}
                  placeholder="Share an environmental update or community discussion in real time..."
                  rows={2}
                  maxLength={2000}
                  aria-label="Quick community post"
                  className="w-full resize-none rounded-xl border border-border bg-background/60 px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-surface focus:outline-none"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <select
                    value={quickCategory}
                    onChange={(e) => setQuickCategory(e.target.value)}
                    aria-label="Select post category"
                    className="h-8 rounded-lg border border-border bg-surface px-2.5 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="Community Cleanup">Community Cleanup</option>
                    <option value="Tree Planting">Tree Planting</option>
                    <option value="Recycling Initiatives">Recycling Initiatives</option>
                    <option value="Sustainable Living">Sustainable Living</option>
                    <option value="Wildlife Conservation">Wildlife Conservation</option>
                    <option value="Environmental Education">Environmental Education</option>
                  </select>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    pill
                    disabled={isSubmitting || !quickPostText.trim()}
                    className="h-8 px-4 text-xs font-semibold"
                  >
                    <Send className="h-3.5 w-3.5" aria-hidden="true" />
                    {isSubmitting ? "Posting..." : "Post Live"}
                  </Button>
                </div>
              </div>
            </div>
            {quickFeedback ? (
              <p className="text-xs font-medium text-primary-dark pl-12">
                {quickFeedback}
              </p>
            ) : null}
          </form>
        </Card>
      ) : null}

      <div>
        <div className="flex items-center justify-between rounded-t-[16px] border-b border-border/80 bg-surface pr-4">
          <FeedTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            className="border-b-0 flex-1"
          />
          <div
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-secondary/35 px-2.5 py-1 text-[11px] font-semibold text-primary-dark shrink-0"
            title="Powered by Supabase PostgreSQL & Realtime WebSockets"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isRealtimeConnected
                  ? "bg-primary animate-pulse"
                  : isUsingSupabaseData
                    ? "bg-primary"
                    : "bg-amber-500"
              }`}
              aria-hidden="true"
            />
            <Wifi className="h-3 w-3" aria-hidden="true" />
            <span>
              {isRealtimeConnected
                ? "Supabase Realtime Live"
                : isUsingSupabaseData
                  ? "Supabase Connected"
                  : "Instant Feed"}
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {visiblePosts.length === 0 ? (
            <Card className="p-8 text-center space-y-2">
              <p className="text-sm font-bold text-foreground">
                No posts in this feed tab yet
              </p>
              <p className="text-xs text-muted-foreground">
                {activeTab === "following"
                  ? "Follow environmental contributors on Explore to see their updates in your Following feed."
                  : "Share an environmental update above to start the conversation."}
              </p>
            </Card>
          ) : (
            visiblePosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>
      </div>

      {/* Mobile & Tablet Ongoing Challenges strip (< 1280px where right rail is collapsed) */}
      {ongoingChallenges.length > 0 ? (
        <Card className="p-5 xl:hidden space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Ongoing Challenges</h2>
            <Link
              href="/challenges"
              className="text-xs font-semibold text-primary-dark hover:underline"
            >
              See All
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {ongoingChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                variant="compact"
              />
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
