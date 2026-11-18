"use client";

import { Bookmark } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { BOOKMARK_CHANGED_EVENT } from "@/components/feed/PostActions";
import { PostCard } from "@/components/feed/PostCard";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useSafeUser } from "@/lib/auth/clerk-hooks";
import { useRealtimeFeed } from "@/lib/realtime/use-realtime-feed";
import { useSafeSupabaseClient } from "@/lib/supabase/client";

export default function BookmarksPage() {
  const supabase = useSafeSupabaseClient();
  const { user, isSignedIn } = useSafeUser();
  const userId = user?.id ?? null;
  const { posts } = useRealtimeFeed();
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<ReadonlySet<string>>(
    new Set(),
  );

  useEffect(() => {
    if (!supabase || !userId) return;

    let cancelled = false;
    async function loadBookmarks() {
      const { data } = await supabase!
        .from("post_bookmarks")
        .select("post_id")
        .eq("user_id", userId!);
      if (!cancelled && data) {
        setBookmarkedPostIds(new Set(data.map((r) => r.post_id)));
      }
    }

    void Promise.resolve().then(() => loadBookmarks());
    const handleChanged = () => {
      void loadBookmarks();
    };
    window.addEventListener(BOOKMARK_CHANGED_EVENT, handleChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(BOOKMARK_CHANGED_EVENT, handleChanged);
    };
  }, [supabase, userId]);

  const bookmarkedPosts = isSignedIn
    ? posts.filter((post) => bookmarkedPostIds.has(post.id))
    : [];

  return (
    <div className="space-y-4">
      <Card className="p-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 text-primary-dark">
            <Bookmark className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Saved Bookmarks</h1>
            <p className="text-xs text-muted-foreground">
              Your saved environmental posts and impact guides synced with Supabase
            </p>
          </div>
        </div>
        <Badge variant="verified">{bookmarkedPosts.length} Saved</Badge>
      </Card>

      {!isSignedIn ? (
        <Card className="p-8 text-center space-y-3">
          <p className="text-sm font-bold text-foreground">
            Sign in to save and view bookmarked posts
          </p>
          <p className="text-xs text-muted-foreground">
            Bookmark environmental updates, cleanup guides, and verified actions across EcoShare.
          </p>
          <div className="pt-1">
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-xs font-semibold text-white hover:bg-primary-dark"
            >
              Log In
            </Link>
          </div>
        </Card>
      ) : bookmarkedPosts.length === 0 ? (
        <Card className="p-8 text-center space-y-3">
          <p className="text-sm font-bold text-foreground">
            No saved bookmarks yet
          </p>
          <p className="text-xs text-muted-foreground">
            Click the Save button on any post in the feed to bookmark it for later.
          </p>
          <div className="pt-1">
            <Link
              href="/home"
              className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-xs font-semibold text-white hover:bg-primary-dark"
            >
              Browse Feed
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookmarkedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={{ ...post, initialBookmarked: true }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
