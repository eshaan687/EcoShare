"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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
import { ensureCurrentUserProfile } from "@/lib/supabase/profile-sync";

export default function MyProfilePage() {
  const supabase = useSafeSupabaseClient();
  const { isSignedIn, user } = useSafeUser();
  const userId = user?.id ?? null;
  const { posts: feedPosts } = useRealtimeFeed();

  const [profile, setProfile] = useState<PrototypeProfileSummary>(() => ({
    isPrototype: true,
    userId: user?.id,
    username: user?.username || "member",
    displayName:
      user?.fullName ||
      user?.username ||
      user?.primaryEmailAddress?.emailAddress ||
      "EcoShare Member",
    bio: "",
    location: "",
    joinedLabel: "Joined EcoShare",
    avatarSrc: user?.imageUrl || "",
    coverSrc: "/images/hero-mountains.png",
    isVerifiedContributor: false,
    totalXp: 0,
    verifiedActionsCount: 0,
    badgesEarnedCount: 0,
    totalBadgesAvailable: 4,
    followersCount: 0,
    followingCount: 0,
  }));

  const [badges, setBadges] = useState<readonly PrototypeBadgeItem[]>(() =>
    PROTOTYPE_BADGES.map((b) => ({ ...b, earned: false })),
  );
  const [approvedContributions, setApprovedContributions] = useState<
    readonly ApprovedImpactSummary[]
  >([]);
  const [joinedCommunities, setJoinedCommunities] = useState<
    readonly PrototypeCommunity[]
  >([]);

  const loadMyProfile = useCallback(async () => {
    if (!supabase || !userId || !user) return;
    await ensureCurrentUserProfile(supabase, user);

    const [
      { data: profileRow },
      { count: followersCount },
      { count: followingCount },
      { data: impactRows },
      { data: earnedBadgeRows },
      { data: membershipRows },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", userId),
      supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("follower_id", userId),
      supabase
        .from("impact_submissions")
        .select(
          "id, title, description, category, location, activity_date, reward_xp",
        )
        .eq("user_id", userId)
        .eq("status", "approved")
        .order("created_at", { ascending: false }),
      supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", userId),
      supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", userId),
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

    const xp = profileRow?.total_xp ?? 0;
    const earnedBadgeIds = new Set(
      (earnedBadgeRows ?? []).map((b) => b.badge_id),
    );
    const updatedBadges = PROTOTYPE_BADGES.map((b, idx) => {
      const threshold = idx === 0 ? 50 : idx === 1 ? 150 : idx === 2 ? 300 : 400;
      const earned = xp >= threshold || earnedBadgeIds.size > idx;
      return { ...b, earned };
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

    if (profileRow) {
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
        avatarSrc: profileRow.avatar_url || user.imageUrl || "",
        coverSrc: profileRow.cover_url || "/images/hero-mountains.png",
        isVerifiedContributor: approvedList.length > 0 || xp >= 50,
        totalXp: xp,
        verifiedActionsCount: approvedList.length,
        badgesEarnedCount: earnedCount,
        totalBadgesAvailable: updatedBadges.length,
        followersCount: followersCount ?? 0,
        followingCount: followingCount ?? 0,
      });
    }
  }, [supabase, userId, user]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(async () => {
      if (!cancelled) {
        await loadMyProfile();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [loadMyProfile]);

  if (!isSignedIn) {
    return (
      <Card className="p-8 text-center space-y-3">
        <h1 className="text-xl font-bold text-foreground">Your EcoShare Profile</h1>
        <p className="mx-auto max-w-md text-xs text-muted-foreground">
          Sign in to customize your profile, track your verified Environmental XP, and view your published posts and joined communities.
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <Link
            href="/login"
            className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-xs font-semibold text-white hover:bg-primary-dark"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-9 items-center rounded-full border border-border bg-surface px-4 text-xs font-semibold text-foreground hover:bg-background"
          >
            Create Account
          </Link>
        </div>
      </Card>
    );
  }

  const myPosts = userId ? feedPosts.filter((p) => p.author.id === userId) : [];

  return (
    <div className="space-y-4">
      <ProfileHeader
        profile={profile}
        isOwnProfile={true}
        onProfileUpdated={(updated) =>
          setProfile((prev) => ({ ...prev, ...updated }))
        }
      />
      <ProfileStats profile={profile} />
      <ProfileTabs
        profile={profile}
        posts={myPosts}
        badges={badges}
        approvedContributions={approvedContributions}
        joinedCommunities={joinedCommunities}
      />
    </div>
  );
}
