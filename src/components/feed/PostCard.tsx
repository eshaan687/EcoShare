import { CheckCircle2, MapPin, MoreHorizontal } from "lucide-react";
import Link from "next/link";

import { PostActions } from "@/components/feed/PostActions";
import { PostMedia } from "@/components/feed/PostMedia";
import { VerificationBadge } from "@/components/impact/VerificationBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { PrototypePost } from "@/lib/mock/prototype-data";
import { cn } from "@/lib/utils";

export interface PostCardProps {
  readonly post: PrototypePost;
  readonly className?: string;
}

/**
 * Matches Sofia M.'s environmental feed post card in references/ecoshare-ui-reference.png.
 * Preserves the distinction between ordinary social posts and human-verified impact posts.
 */
export function PostCard({ post, className }: PostCardProps) {
  return (
    <Card as="article" className={cn("p-5 space-y-3.5", className)}>
      {/* Author Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/u/${post.author.username}`}
            className="shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Avatar
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
                className="text-sm font-bold text-foreground hover:text-primary-dark truncate"
              >
                {post.author.displayName}
              </Link>
              {post.author.isVerifiedContributor ? (
                <CheckCircle2
                  className="h-4 w-4 shrink-0 text-primary"
                  aria-label="Verified Environmental Contributor"
                />
              ) : null}
              <span className="text-xs text-muted-foreground">
                · {post.publishedRelative}
              </span>
            </div>

            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3 text-primary" aria-hidden="true" />
                {post.author.location}
              </span>
              <span>·</span>
              <span className="font-medium text-primary-dark">{post.category}</span>
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
          <Badge variant="prototype">Sample</Badge>
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground"
            aria-hidden="true"
          >
            <MoreHorizontal className="h-4 w-4" />
          </span>
        </div>
      </div>

      {/* Post Copy */}
      <p className="text-sm leading-relaxed text-foreground">{post.content}</p>

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
