"use client";

import { CheckCircle2, Globe, MapPin, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { PostCard } from "@/components/feed/PostCard";
import { BadgeCard } from "@/components/gamification/BadgeCard";
import { LevelCard } from "@/components/gamification/LevelCard";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type {
  PrototypeBadgeItem,
  PrototypeCommunity,
  PrototypePost,
  PrototypeProfileSummary,
} from "@/lib/mock/prototype-data";
import { cn } from "@/lib/utils";

export type ProfileTabId = "posts" | "impact" | "badges" | "about";

export interface ApprovedImpactSummary {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly location: string | null;
  readonly activityDate: string;
  readonly rewardXp: number;
}

export interface ProfileTabsProps {
  readonly profile: PrototypeProfileSummary;
  readonly posts: readonly PrototypePost[];
  readonly badges: readonly PrototypeBadgeItem[];
  readonly approvedContributions?: readonly ApprovedImpactSummary[];
  readonly joinedCommunities?: readonly PrototypeCommunity[];
}

/**
 * Matches the "Posts | Impact | Badges | About" tab bar in references/ecoshare-ui-reference.png
 * and renders real user posts, approved environmental impact records (without exposing private evidence),
 * earned badges, and joined public communities.
 */
export function ProfileTabs({
  profile,
  posts,
  badges,
  approvedContributions = [],
  joinedCommunities = [],
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<ProfileTabId>("posts");

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
            { id: "posts", label: `Posts (${posts.length})` },
            {
              id: "impact",
              label: `Impact (${approvedContributions.length || verifiedPosts.length})`,
            },
            {
              id: "badges",
              label: `Badges (${profile.badgesEarnedCount}/${profile.totalBadgesAvailable})`,
            },
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
                "relative px-3 py-2.5 text-sm font-semibold transition-colors cursor-pointer",
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

      {activeTab === "posts" ? (
        posts.length === 0 ? (
          <Card className="p-8 text-center space-y-2">
            <p className="text-sm font-bold text-foreground">
              No published posts yet
            </p>
            <p className="text-xs text-muted-foreground">
              When @{profile.username} shares environmental updates or verified actions, they will appear here.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )
      ) : null}

      {activeTab === "impact" ? (
        <div className="space-y-4">
          <LevelCard totalXp={profile.totalXp} />

          {approvedContributions.length > 0 ? (
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground">
                  Approved Environmental Contributions ({approvedContributions.length})
                </h2>
                <Badge variant="verified">Verified Impact Ledger</Badge>
              </div>
              <div className="space-y-2.5">
                {approvedContributions.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-background/60 p-3.5"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2
                          className="h-4 w-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <p className="text-sm font-bold text-foreground">
                          {item.title}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.category}
                        {item.location ? ` · ${item.location}` : ""} ·{" "}
                        {item.activityDate}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary/65 px-2.5 py-1 text-xs font-bold text-primary-dark">
                      <Sparkles className="h-3 w-3 text-primary" aria-hidden="true" />
                      +{item.rewardXp} XP
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ) : verifiedPosts.length > 0 ? (
            <div className="space-y-4">
              {verifiedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center space-y-2">
              <p className="text-sm font-bold text-foreground">
                No approved environmental contributions yet
              </p>
              <p className="text-xs text-muted-foreground">
                Approved field contributions and verified XP rewards will appear here once reviewed.
              </p>
            </Card>
          )}
        </div>
      ) : null}

      {activeTab === "badges" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <Card className="p-5 lg:col-span-3">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">
                Earned Badges ({profile.badgesEarnedCount}/{profile.totalBadgesAvailable})
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

      {activeTab === "about" ? (
        <div className="space-y-4">
          <Card className="p-5 space-y-3">
            <h2 className="text-base font-bold text-foreground">
              About {profile.displayName}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {profile.bio || "No biography shared yet."}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
              {profile.location ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  {profile.location}
                </span>
              ) : null}
              <span>{profile.joinedLabel}</span>
            </div>
            <div className="rounded-xl border border-secondary bg-secondary/20 p-3.5 text-xs text-primary-dark">
              <strong>EcoShare Reputation Record:</strong> {profile.displayName} has
              completed {profile.verifiedActionsCount} human-verified environmental
              contribution{profile.verifiedActionsCount === 1 ? "" : "s"} totaling{" "}
              {profile.totalXp} Environmental XP.
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                <h3 className="text-base font-bold text-foreground">
                  Joined Public Communities ({joinedCommunities.length})
                </h3>
              </div>
              <Link
                href="/communities"
                className="text-xs font-semibold text-primary-dark hover:underline"
              >
                Explore Communities
              </Link>
            </div>

            {joinedCommunities.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Not a member of any public communities yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {joinedCommunities.map((comm) => (
                  <Link
                    key={comm.id}
                    href="/communities"
                    className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background/60 p-3 hover:border-primary/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-foreground">
                        {comm.name}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {comm.category} · {comm.country ?? "Global"}
                      </p>
                    </div>
                    <Globe className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
}
