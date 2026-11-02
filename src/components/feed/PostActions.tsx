"use client";

import { Bookmark, Heart, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export interface PostActionsProps {
  readonly postId: string;
  readonly initialLikes: number;
  readonly initialComments: number;
  readonly initialBookmarked?: boolean;
  readonly className?: string;
}

/**
 * Interactive social action bar for a post card.
 * Uses local UI preview state in Milestone 1 (real database persistence in Milestone 2).
 */
export function PostActions({
  initialLikes,
  initialComments,
  initialBookmarked = false,
  className,
}: PostActionsProps) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [sharedFeedback, setSharedFeedback] = useState(false);

  const likeCount = initialLikes + (liked ? 1 : 0);

  return (
    <div
      className={cn(
        "flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setLiked((prev) => !prev)}
          aria-pressed={liked}
          aria-label={`Like post (${likeCount} likes)`}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-semibold transition-colors",
            liked
              ? "bg-error/10 text-error"
              : "text-muted-foreground hover:bg-background hover:text-foreground",
          )}
        >
          <Heart
            className={cn("h-4 w-4", liked ? "fill-current" : "")}
            aria-hidden="true"
          />
          <span>{likeCount}</span>
        </button>

        <span
          className="inline-flex items-center gap-1.5 px-2 py-1 font-semibold text-muted-foreground"
          aria-label={`${initialComments} comments`}
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          <span>{initialComments}</span>
        </span>

        <button
          type="button"
          onClick={() => setSharedFeedback((prev) => !prev)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        >
          <Share2 className="h-4 w-4" aria-hidden="true" />
          <span>{sharedFeedback ? "Link Previewed" : "Share"}</span>
        </button>
      </div>

      <button
        type="button"
        onClick={() => setBookmarked((prev) => !prev)}
        aria-pressed={bookmarked}
        aria-label={bookmarked ? "Remove bookmark (preview)" : "Bookmark post (preview)"}
        className={cn(
          "inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium transition-colors",
          bookmarked
            ? "bg-secondary/50 text-primary-dark"
            : "text-muted-foreground hover:bg-background hover:text-foreground",
        )}
      >
        <Bookmark
          className={cn("h-4 w-4", bookmarked ? "fill-current" : "")}
          aria-hidden="true"
        />
        <span className="sr-only sm:not-sr-only">
          {bookmarked ? "Saved" : "Save"}
        </span>
      </button>
    </div>
  );
}
