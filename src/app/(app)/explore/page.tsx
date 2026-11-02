"use client";

import { Compass, Search, TrendingUp } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { ChallengeCard } from "@/components/challenges/ChallengeCard";
import { CommunityCard } from "@/components/communities/CommunityCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  PROTOTYPE_CHALLENGES,
  PROTOTYPE_COMMUNITIES,
  PROTOTYPE_TRENDING_TOPICS,
} from "@/lib/mock/prototype-data";
import { cn } from "@/lib/utils";

const EXPLORE_CATEGORIES = [
  "All",
  "Community Cleanup",
  "Tree Planting",
  "Ocean Conservation",
  "Recycling Initiatives",
] as const;

function ExplorePageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

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

  const filteredChallenges = PROTOTYPE_CHALLENGES.filter((challenge) => {
    const matchesCategory =
      selectedCategory === "All" || challenge.category === selectedCategory;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      challenge.title.toLowerCase().includes(normalizedQuery) ||
      challenge.description.toLowerCase().includes(normalizedQuery) ||
      challenge.category.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });

  const filteredCommunities = PROTOTYPE_COMMUNITIES.filter((community) => {
    const matchesCategory =
      selectedCategory === "All" || community.category === selectedCategory;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      community.name.toLowerCase().includes(normalizedQuery) ||
      community.description.toLowerCase().includes(normalizedQuery) ||
      community.category.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });

  const hasResults =
    filteredTopics.length > 0 ||
    filteredChallenges.length > 0 ||
    filteredCommunities.length > 0;

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
                Discover verified environmental initiatives, challenges, and communities
              </p>
            </div>
          </div>
          <Badge variant="prototype">Sample Discovery Filter</Badge>
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
