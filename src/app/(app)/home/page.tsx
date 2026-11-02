"use client";

import Link from "next/link";
import { useState } from "react";

import { ChallengeCard } from "@/components/challenges/ChallengeCard";
import { FeedTabs } from "@/components/feed/FeedTabs";
import { HeroBanner } from "@/components/feed/HeroBanner";
import { PostCard } from "@/components/feed/PostCard";
import { Card } from "@/components/ui/Card";
import type { EcoShareFeedTabId } from "@/lib/constants/design-tokens";
import {
  filterPrototypePostsByTab,
  PROTOTYPE_CHALLENGES,
  PROTOTYPE_POSTS,
} from "@/lib/mock/prototype-data";

export default function HomeFeedPage() {
  const [activeTab, setActiveTab] = useState<EcoShareFeedTabId>("for-you");
  const visiblePosts = filterPrototypePostsByTab(PROTOTYPE_POSTS, activeTab);

  return (
    <div className="space-y-4">
      <HeroBanner />

      <div>
        <FeedTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="mt-4 space-y-4">
          {visiblePosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>

      {/* Mobile & Tablet Ongoing Challenges strip (< 1280px where right rail is collapsed) */}
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
          {PROTOTYPE_CHALLENGES.slice(0, 2).map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              variant="compact"
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
