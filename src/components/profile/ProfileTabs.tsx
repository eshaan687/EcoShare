"use client";

import { useState } from "react";

import { PostCard } from "@/components/feed/PostCard";
import { BadgeCard } from "@/components/gamification/BadgeCard";
import { LevelCard } from "@/components/gamification/LevelCard";
import { Card } from "@/components/ui/Card";
import type {
  PrototypeBadgeItem,
  PrototypePost,
  PrototypeProfileSummary,
} from "@/lib/mock/prototype-data";
import { cn } from "@/lib/utils";

export type ProfileTabId = "posts" | "impact" | "badges" | "about";

export interface ProfileTabsProps {
  readonly profile: PrototypeProfileSummary;
  readonly posts: readonly PrototypePost[];
  readonly badges: readonly PrototypeBadgeItem[];
}

/**
 * Matches the "Posts | Impact | Badges | About" tab bar and "Your Badges (4/12)"
 * section in references/ecoshare-ui-reference.png.
 */
export function ProfileTabs({ profile, posts, badges }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<ProfileTabId>("badges");

  const verifiedPosts = posts.filter((post) => post.isVerifiedImpact);

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Profile sections"
        className="flex items-center gap-2 border-b border-border bg-surface px-4 pt-2 rounded-t-[16px]"
      >
        {(
          [
            { id: "posts", label: "Posts" },
            { id: "impact", label: "Impact" },
            { id: "badges", label: "Badges" },
            { id: "about", label: "About" },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative px-3 py-2.5 text-sm font-semibold transition-colors",
                isActive
                  ? "text-primary-dark"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              {isActive ? (
                <span
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary"
                  aria-hidden="true"
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {activeTab === "badges" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <Card className="p-5 lg:col-span-3">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">
                Your Badges ({profile.badgesEarnedCount}/{profile.totalBadgesAvailable})
              </h2>
              <span className="text-xs font-medium text-primary-dark">
                Verified milestones
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {badges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </div>
          </Card>

          <div className="lg:col-span-2">
            <LevelCard totalXp={profile.totalXp} />
          </div>
        </div>
      ) : null}

      {activeTab === "posts" ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : null}

      {activeTab === "impact" ? (
        <div className="space-y-4">
          <LevelCard totalXp={profile.totalXp} />
          {verifiedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : null}

      {activeTab === "about" ? (
        <Card className="p-5 space-y-3">
          <h2 className="text-base font-bold text-foreground">
            About {profile.displayName}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {profile.bio}
          </p>
          <div className="rounded-xl border border-secondary bg-secondary/20 p-3.5 text-xs text-primary-dark">
            <strong>EcoShare Reputation Guarantee:</strong> {profile.displayName} has
            completed {profile.verifiedActionsCount} human-verified environmental
            contributions totaling {profile.totalXp} Environmental XP.
          </div>
        </Card>
      ) : null}
    </div>
  );
}
