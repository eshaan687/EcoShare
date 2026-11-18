"use client";

import { useCallback, useEffect, useState } from "react";
import { useSafeUser } from "@/lib/auth/clerk-hooks";
import type { PrototypePost } from "@/lib/mock/prototype-data";
import { useSafeSupabaseClient } from "@/lib/supabase/client";
import { ensureCurrentUserProfile } from "@/lib/supabase/profile-sync";

type PostCategory = PrototypePost["category"];

const VALID_CATEGORIES: readonly PostCategory[] = [
  "Community Cleanup",
  "Tree Planting",
  "Recycling Initiatives",
  "Sustainable Living",
  "Wildlife Conservation",
  "Environmental Education",
];

function normalizeCategory(raw: string): PostCategory {
  const match = VALID_CATEGORIES.find(
    (c) => c.toLowerCase() === raw.toLowerCase(),
  );
  return match ?? "Community Cleanup";
}

function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

interface SupabasePostQueryRow {
  id: string;
  author_id: string;
  content: string;
  category: string;
  location: string | null;
  is_verified_impact: boolean;
  likes_count: number;
  comments_count: number;
  bookmarks_count: number;
  created_at: string;
  profiles: {
    user_id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    location: string | null;
    level: number;
  } | null;
  post_media: Array<{
    id: string;
    url: string;
    alt_text: string;
    has_verified_badge: boolean;
  }> | null;
}

function mapRowToPost(
  row: SupabasePostQueryRow,
  followingIds: ReadonlySet<string>,
  bookmarkedPostIds: ReadonlySet<string>,
): PrototypePost {
  const displayName = row.profiles?.display_name ?? "EcoShare Member";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return {
    id: row.id,
    isPrototype: true,
    author: {
      id: row.author_id,
      username: row.profiles?.username ?? "ecoshare",
      displayName,
      avatarInitials: initials || "EC",
      avatarColor: "#15803D",
      avatarSrc: row.profiles?.avatar_url ?? "/images/avatar-alex.png",
      location: row.location ?? row.profiles?.location ?? "Global EcoShare",
      isVerifiedContributor:
        row.is_verified_impact || (row.profiles?.level ?? 1) >= 3,
    },
    publishedRelative: formatRelativeTime(row.created_at),
    content: row.content,
    category: normalizeCategory(row.category),
    isVerifiedImpact: row.is_verified_impact,
    isFollowingAuthor:
      followingIds.size > 0
        ? followingIds.has(row.author_id)
        : row.is_verified_impact,
    media: (row.post_media ?? []).map((m) => ({
      id: m.id,
      src: m.url,
      alt: m.alt_text,
      hasVerifiedImpactBadge: m.has_verified_badge,
    })),
    initialLikes: row.likes_count,
    initialComments: row.comments_count,
    initialBookmarked: bookmarkedPostIds.has(row.id),
  };
}

export function dispatchPostCreatedEvent(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ecoshare:post-created"));
  }
}

export interface CreatePostInput {
  readonly content: string;
  readonly category: string;
  readonly location?: string;
}

export interface UseRealtimeFeedResult {
  readonly posts: readonly PrototypePost[];
  readonly isRealtimeConnected: boolean;
  readonly isUsingSupabaseData: boolean;
  readonly isSubmitting: boolean;
  readonly createPost: (input: CreatePostInput) => Promise<{
    readonly ok: boolean;
    readonly error?: string;
  }>;
}

export function useRealtimeFeed(): UseRealtimeFeedResult {
  const supabase = useSafeSupabaseClient();
  const { isSignedIn, user } = useSafeUser();
  const userId = user?.id ?? null;
  const [posts, setPosts] = useState<readonly PrototypePost[]>([]);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [isUsingSupabaseData, setIsUsingSupabaseData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPosts = useCallback(async () => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("posts")
      .select(
        `
        id,
        author_id,
        content,
        category,
        location,
        is_verified_impact,
        likes_count,
        comments_count,
        bookmarks_count,
        created_at,
        profiles:author_id (
          user_id,
          username,
          display_name,
          avatar_url,
          location,
          level
        ),
        post_media (
          id,
          url,
          alt_text,
          has_verified_badge
        )
      `,
      )
      .order("created_at", { ascending: false })
      .limit(25);

    let followingIds = new Set<string>();
    let bookmarkedIds = new Set<string>();

    if (userId) {
      const [{ data: followsData }, { data: bookmarksData }] = await Promise.all(
        [
          supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", userId),
          supabase
            .from("post_bookmarks")
            .select("post_id")
            .eq("user_id", userId),
        ],
      );
      if (followsData) {
        followingIds = new Set(followsData.map((f) => f.following_id));
      }
      if (bookmarksData) {
        bookmarkedIds = new Set(bookmarksData.map((b) => b.post_id));
      }
    }

    if (!error && data) {
      const mapped = (data as unknown as SupabasePostQueryRow[]).map((row) =>
        mapRowToPost(row, followingIds, bookmarkedIds),
      );
      setPosts(mapped);
      setIsUsingSupabaseData(true);
    }
  }, [supabase, userId]);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    void Promise.resolve().then(async () => {
      if (!cancelled) {
        await fetchPosts();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [supabase, fetchPosts]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handlePostCreated = () => {
      void fetchPosts();
    };
    window.addEventListener("ecoshare:post-created", handlePostCreated);
    return () => {
      window.removeEventListener("ecoshare:post-created", handlePostCreated);
    };
  }, [fetchPosts]);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("ecoshare-realtime-posts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
        },
        () => {
          void fetchPosts();
        },
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, fetchPosts]);

  const createPost = useCallback(
    async (input: CreatePostInput) => {
      const trimmed = input.content.trim();
      if (!trimmed) {
        return { ok: false, error: "Post content cannot be empty." };
      }
      if (!isSignedIn || !user || !supabase) {
        return {
          ok: false,
          error: "Please sign in to publish a live community post.",
        };
      }

      setIsSubmitting(true);
      try {
        await ensureCurrentUserProfile(supabase, user);

        const { error } = await supabase.from("posts").insert({
          author_id: user.id,
          content: trimmed,
          category: input.category || "Community Cleanup",
          location: input.location?.trim() || null,
          is_verified_impact: false,
        });

        if (error) {
          return { ok: false, error: error.message };
        }

        await fetchPosts();
        dispatchPostCreatedEvent();
        return { ok: true };
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSignedIn, user, supabase, fetchPosts],
  );

  return {
    posts,
    isRealtimeConnected,
    isUsingSupabaseData,
    isSubmitting,
    createPost,
  };
}
