"use client";

import { MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { PostActions } from "@/components/feed/PostActions";
import { PostMedia } from "@/components/feed/PostMedia";
import { VerificationBadge } from "@/components/impact/VerificationBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useSafeUser } from "@/lib/auth/clerk-hooks";
import type { PrototypePost } from "@/lib/mock/prototype-data";
import { dispatchPostCreatedEvent } from "@/lib/realtime/use-realtime-feed";
import { useSafeSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PostCardProps {
  readonly post: PrototypePost;
  readonly className?: string;
}

/**
 * Matches Sofia M.'s environmental feed post card in references/ecoshare-ui-reference.png.
 * Preserves the distinction between ordinary social posts and human-verified impact posts,
 * and allows post authors to delete their own posts in Supabase.
 */
export function PostCard({ post, className }: PostCardProps) {
  const supabase = useSafeSupabaseClient();
  const { user, isSignedIn } = useSafeUser();
  const [deleted, setDeleted] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwnPost = Boolean(
    isSignedIn && user?.id && post.author.id === user.id,
  );

  async function handleDeletePost() {
    if (!isOwnPost || deleting) return;
    setDeleting(true);
    try {
      setDeleted(true);
      if (supabase && UUID_REGEX.test(post.id)) {
        await supabase
          .from("posts")
          .delete()
          .eq("id", post.id)
          .eq("author_id", user!.id);
        dispatchPostCreatedEvent();
      }
    } finally {
      setDeleting(false);
    }
  }

  if (deleted) {
    return null;
  }

  return (
    <Card as="article" className={cn("p-5 space-y-3.5 shadow-xs", className)}>
      {/* Author Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/u/${post.author.username}`}
            className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <Avatar
              src={post.author.avatarSrc}
              initials={post.author.avatarInitials}
              backgroundColor={post.author.avatarColor}
              alt={post.author.displayName}
              size="md"
            />
          </Link>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Link
                href={`/u/${post.author.username}`}
                className="text-[15px] font-bold text-foreground hover:text-primary-dark truncate outline-none focus-visible:underline"
              >
                {post.author.displayName}
              </Link>
              {post.author.isVerifiedContributor ? (
                <VerificationBadge variant="author" />
              ) : null}
            </div>

            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span>{post.publishedRelative}</span>
              <span>·</span>
              <span>{post.author.location}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {post.isVerifiedImpact ? (
            <VerificationBadge status="verified" className="hidden sm:inline-flex" />
          ) : (
            <Badge variant="neutral" className="hidden sm:inline-flex">
              Community Discussion
            </Badge>
          )}
          {isOwnPost ? (
            <button
              type="button"
              disabled={deleting}
              onClick={() => void handleDeletePost()}
              aria-label="Delete your post"
              title="Delete your post"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-error/10 hover:text-error cursor-pointer"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground"
              aria-hidden="true"
            >
              <MoreHorizontal className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>

      {/* Post Copy */}
      <p className="text-[15px] leading-relaxed text-foreground">{post.content}</p>

      {/* Media Grid */}
      <PostMedia media={post.media} />

      {/* Social Actions */}
      <PostActions
        postId={post.id}
        initialLikes={post.initialLikes}
        initialComments={post.initialComments}
        initialBookmarked={post.initialBookmarked}
      />
    </Card>
  );
}
