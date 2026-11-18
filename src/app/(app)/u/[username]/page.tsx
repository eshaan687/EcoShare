"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";

import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileStats } from "@/components/profile/ProfileStats";
import {
  type ApprovedImpactSummary,
  ProfileTabs,
} from "@/components/profile/ProfileTabs";
import { Card } from "@/components/ui/Card";
import { useSafeUser } from "@/lib/auth/clerk-hooks";
import {
  PROTOTYPE_BADGES,
  type PrototypeBadgeItem,
  type PrototypeCommunity,
  type PrototypeProfileSummary,
} from "@/lib/mock/prototype-data";
import { useRealtimeFeed } from "@/lib/realtime/use-realtime-feed";
import { useSafeSupabaseClient } from "@/lib/supabase/client";

export interface PublicProfilePageProps {
  readonly params: Promise<{ username: string }>;
}

export default function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { username } = use(params);
  const normalizedUsername = decodeURIComponent(username).replace(/^@/, "");

  const supabase = useSafeSupabaseClient();
  const { user } = useSafeUser();
  const currentUserId = user?.id ?? null;
  const { posts: feedPosts } = useRealtimeFeed();

  const [profile, setProfile] = useState<PrototypeProfileSummary | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [badges, setBadges] = useState<readonly PrototypeBadgeItem[]>(() =>
    PROTOTYPE_BADGES.map((b) => ({ ...b, earned: false })),
  );
  const [approvedContributions, setApprovedContributions] = useState<
    readonly ApprovedImpactSummary[]
  >([]);
  const [joinedCommunities, setJoinedCommunities] = useState<
    readonly PrototypeCommunity[]
  >([]);

  const loadPublicProfile = useCallback(async () => {
    if (!supabase) return;

    const { data: profileRow } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", normalizedUsername)
      .eq("is_deleted", false)
      .maybeSingle();

    if (!profileRow) {
      setNotFound(true);
      return;
    }

    setNotFound(false);

    const [
      { count: followersCount },
      { count: followingCount },
      { data: impactRows },
      { data: membershipRows },
      followCheck,
    ] = await Promise.all([
      supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", profileRow.user_id),
      supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("follower_id", profileRow.user_id),
      supabase
        .from("impact_submissions")
        .select(
          "id, title, description, category, location, activity_date, reward_xp",
        )
        .eq("user_id", profileRow.user_id)
        .eq("status", "approved")
        .order("created_at", { ascending: false }),
      supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", profileRow.user_id),
      currentUserId
        ? supabase
            .from("follows")
            .select("id")
            .eq("follower_id", currentUserId)
            .eq("following_id", profileRow.user_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const approvedList: ApprovedImpactSummary[] = (impactRows ?? []).map(
      (r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        location: r.location,
        activityDate: r.activity_date,
        rewardXp: r.reward_xp,
      }),
    );
    setApprovedContributions(approvedList);

    const xp = profileRow.total_xp ?? 0;
    const updatedBadges = PROTOTYPE_BADGES.map((b, idx) => {
      const threshold = idx === 0 ? 50 : idx === 1 ? 150 : idx === 2 ? 300 : 400;
      return { ...b, earned: xp >= threshold };
    });
    setBadges(updatedBadges);

    if (membershipRows && membershipRows.length > 0) {
      const commIds = membershipRows.map((m) => m.community_id);
      const { data: commData } = await supabase
        .from("communities")
        .select("*")
        .in("id", commIds)
        .eq("visibility", "public");
      if (commData) {
        setJoinedCommunities(
          commData.map((c) => ({
            id: c.id,
            isPrototype: true,
            slug: c.slug,
            name: c.name,
            description: c.description,
            category: c.category,
            country: c.country,
            city: c.city ?? undefined,
            campaignGoal: c.campaign_goal ?? undefined,
            membersCount: c.members_count,
            visibility: "public",
            bannerSrc: c.banner_url,
          })),
        );
      }
    } else {
      setJoinedCommunities([]);
    }

    setIsFollowing(Boolean(followCheck.data));
    const earnedCount = updatedBadges.filter((b) => b.earned).length;
    setProfile({
      isPrototype: true,
      userId: profileRow.user_id,
      username: profileRow.username,
      displayName: profileRow.display_name,
      bio: profileRow.bio || "",
      location: profileRow.location || "",
      joinedLabel: `Joined ${new Date(profileRow.created_at).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })}`,
      avatarSrc: profileRow.avatar_url || "",
      coverSrc: profileRow.cover_url || "/images/hero-mountains.png",
      isVerifiedContributor: approvedList.length > 0 || xp >= 50,
      totalXp: xp,
      verifiedActionsCount: approvedList.length,
      badgesEarnedCount: earnedCount,
      totalBadgesAvailable: updatedBadges.length,
      followersCount: followersCount ?? 0,
      followingCount: followingCount ?? 0,
    });
  }, [supabase, normalizedUsername, currentUserId]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(async () => {
      if (!cancelled) {
        await loadPublicProfile();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [loadPublicProfile]);

  if (notFound) {
    return (
      <Card className="p-8 text-center space-y-3">
        <h1 className="text-lg font-bold text-foreground">
          Profile @{normalizedUsername} not found
        </h1>
        <p className="text-xs text-muted-foreground">
          This account may not exist yet or may have changed its username.
        </p>
        <div className="pt-1">
          <Link
            href="/explore"
            className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-xs font-semibold text-white hover:bg-primary-dark"
          >
            Discover EcoShare Members
          </Link>
        </div>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="p-8 text-center">
        <p className="text-xs text-muted-foreground">
          Loading @{normalizedUsername}&apos;s profile...
        </p>
      </Card>
    );
  }

  const authorPosts = feedPosts.filter(
    (p) =>
      p.author.username.toLowerCase() === profile.username.toLowerCase() ||
      (profile.userId && p.author.id === profile.userId),
  );

  const isOwn = Boolean(
    currentUserId && profile.userId && currentUserId === profile.userId,
  );

  return (
    <div className="space-y-4">
      <ProfileHeader
        key={`${profile.userId ?? profile.username}-${isFollowing}`}
        profile={profile}
        isOwnProfile={isOwn}
        isFollowingInitial={isFollowing}
        onProfileUpdated={(updated) =>
          setProfile((prev) => (prev ? { ...prev, ...updated } : prev))
        }
      />
      <ProfileStats profile={profile} />
      <ProfileTabs
        profile={profile}
        posts={authorPosts}
        badges={badges}
        approvedContributions={approvedContributions}
        joinedCommunities={joinedCommunities}
      />
    </div>
  );
}
