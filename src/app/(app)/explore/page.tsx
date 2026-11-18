"use client";

import { Compass, Search, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { ChallengeCard } from "@/components/challenges/ChallengeCard";
import { CommunityCard } from "@/components/communities/CommunityCard";
import { PostCard } from "@/components/feed/PostCard";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  PROTOTYPE_TRENDING_TOPICS,
  type PrototypeChallenge,
  type PrototypeCommunity,
} from "@/lib/mock/prototype-data";
import { useRealtimeFeed } from "@/lib/realtime/use-realtime-feed";
import { useSafeSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const EXPLORE_CATEGORIES = [
  "All",
  "Community Cleanup",
  "Tree Planting",
  "Ocean Conservation",
  "Recycling Initiatives",
] as const;

interface DiscoveredMember {
  readonly user_id: string;
  readonly username: string;
  readonly display_name: string;
  readonly avatar_url: string | null;
  readonly location: string | null;
  readonly total_xp: number;
  readonly level: number;
}

function ExplorePageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const supabase = useSafeSupabaseClient();
  const { posts } = useRealtimeFeed();

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [members, setMembers] = useState<readonly DiscoveredMember[]>([]);
  const [communities, setCommunities] = useState<readonly PrototypeCommunity[]>(
    [],
  );
  const [challenges, setChallenges] = useState<readonly PrototypeChallenge[]>(
    [],
  );

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    void Promise.resolve().then(async () => {
      const [
        { data: profilesData },
        { data: communitiesData },
        { data: challengesData },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "user_id, username, display_name, avatar_url, location, total_xp, level",
          )
          .eq("is_deleted", false)
          .order("total_xp", { ascending: false })
          .limit(12),
        supabase
          .from("communities")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(12),
        supabase
          .from("challenges")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(12),
      ]);

      if (cancelled) return;

      if (profilesData && profilesData.length > 0) {
        setMembers(profilesData as unknown as DiscoveredMember[]);
      }
      if (communitiesData && communitiesData.length > 0) {
        setCommunities(
          communitiesData.map((row) => ({
            id: row.id,
            isPrototype: true,
            slug: row.slug,
            name: row.name,
            description: row.description,
            category: row.category,
            country: row.country,
            city: row.city ?? undefined,
            campaignGoal: row.campaign_goal ?? undefined,
            membersCount: row.members_count,
            visibility: row.visibility === "private" ? "private" : "public",
            bannerSrc: row.banner_url,
          })),
        );
      }
      if (challengesData && challengesData.length > 0) {
        setChallenges(
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
    });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredTopics = PROTOTYPE_TRENDING_TOPICS.filter((topic) => {
    const matchesCategory =
      selectedCategory === "All" || topic.category === selectedCategory;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      topic.tag.toLowerCase().includes(normalizedQuery) ||
      topic.category.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });

  const filteredMembers = members.filter((member) => {
    if (normalizedQuery.length === 0) return true;
    return (
      member.display_name.toLowerCase().includes(normalizedQuery) ||
      member.username.toLowerCase().includes(normalizedQuery) ||
      (member.location ?? "").toLowerCase().includes(normalizedQuery)
    );
  });

  const filteredChallenges = challenges.filter((challenge) => {
    const matchesCategory =
      selectedCategory === "All" || challenge.category === selectedCategory;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      challenge.title.toLowerCase().includes(normalizedQuery) ||
      challenge.description.toLowerCase().includes(normalizedQuery) ||
      challenge.category.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });

  const filteredCommunities = communities.filter((community) => {
    const matchesCategory =
      selectedCategory === "All" || community.category === selectedCategory;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      community.name.toLowerCase().includes(normalizedQuery) ||
      community.description.toLowerCase().includes(normalizedQuery) ||
      (community.country ?? "").toLowerCase().includes(normalizedQuery) ||
      community.category.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });

  const filteredPosts = posts.filter((post) => {
    const matchesCategory =
      selectedCategory === "All" || post.category === selectedCategory;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      post.content.toLowerCase().includes(normalizedQuery) ||
      post.author.displayName.toLowerCase().includes(normalizedQuery) ||
      post.author.username.toLowerCase().includes(normalizedQuery) ||
      post.category.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });

  const hasResults =
    filteredTopics.length > 0 ||
    filteredMembers.length > 0 ||
    filteredChallenges.length > 0 ||
    filteredCommunities.length > 0 ||
    filteredPosts.length > 0;

  return (
    <div className="space-y-5">
      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 text-primary-dark">
              <Compass className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Explore EcoShare</h1>
              <p className="text-xs text-muted-foreground">
                Search environmental contributors, verified posts, challenges, and global communities
              </p>
            </div>
          </div>
          <Badge variant="verified">Live Discovery Search</Badge>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter sample topics, challenges, or communities..."
            aria-label="Filter sample topics, challenges, or communities"
            className="pl-10"
          />
        </div>

        {/* Category Filter Pills */}
        <div
          role="group"
          aria-label="Filter by environmental category"
          className="flex flex-wrap items-center gap-2"
        >
          {EXPLORE_CATEGORIES.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "bg-primary text-white shadow-xs"
                    : "border border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {category}
              </button>
            );
          })}
        </div>
      </Card>

      {!hasResults ? (
        <Card className="p-8 text-center space-y-3">
          <p className="text-base font-bold text-foreground">
            No sample items match &ldquo;{query}&rdquo;
          </p>
          <p className="text-xs text-muted-foreground">
            Try clearing your search query or selecting &ldquo;All&rdquo; categories.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setQuery("");
              setSelectedCategory("All");
            }}
          >
            Reset Filters
          </Button>
        </Card>
      ) : (
        <>
          {filteredMembers.length > 0 ? (
            <Card className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                <h2 className="text-base font-bold text-foreground">
                  Environmental Contributors
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredMembers.slice(0, 6).map((member) => (
                  <Link
                    key={member.user_id}
                    href={`/u/${member.username}`}
                    className="flex items-center justify-between gap-2.5 rounded-xl border border-border bg-background/60 p-3 transition-colors hover:border-primary/40"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar
                        src={member.avatar_url ?? undefined}
                        alt={member.display_name}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-foreground">
                          {member.display_name}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          @{member.username}
                          {member.location ? ` · ${member.location}` : ""}
                        </p>
                      </div>
                    </div>
                    <Badge variant="verified">{member.total_xp} XP</Badge>
                  </Link>
                ))}
              </div>
            </Card>
          ) : null}

          {filteredTopics.length > 0 ? (
            <Card className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
                <h2 className="text-base font-bold text-foreground">
                  Trending Environmental Topics
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {filteredTopics.map((topic) => (
                  <div
                    key={topic.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-background/60 p-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-primary-dark">{topic.tag}</p>
                      <p className="text-xs text-muted-foreground">{topic.category}</p>
                    </div>
                    <Badge variant="verified">{topic.actionsCountLabel}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {filteredChallenges.length > 0 ? (
            <section aria-labelledby="explore-challenges-heading" className="space-y-3">
              <h2
                id="explore-challenges-heading"
                className="text-base font-bold text-foreground px-1"
              >
                Featured Environmental Challenges
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredChallenges.map((challenge) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}
              </div>
            </section>
          ) : null}

          {filteredCommunities.length > 0 ? (
            <section aria-labelledby="explore-communities-heading" className="space-y-3">
              <h2
                id="explore-communities-heading"
                className="text-base font-bold text-foreground px-1"
              >
                Featured Action Communities
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredCommunities.map((community) => (
                  <CommunityCard key={community.id} community={community} />
                ))}
              </div>
            </section>
          ) : null}

          {normalizedQuery.length > 0 && filteredPosts.length > 0 ? (
            <section aria-labelledby="explore-posts-heading" className="space-y-3">
              <h2
                id="explore-posts-heading"
                className="text-base font-bold text-foreground px-1"
              >
                Matching Community Posts ({filteredPosts.length})
              </h2>
              <div className="space-y-4">
                {filteredPosts.slice(0, 5).map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-[20px]" />}>
      <ExplorePageContent />
    </Suspense>
  );
}
